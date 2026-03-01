// Sale CRUD service — multi-tenant, atomic vehicle status update
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { auditService } from './audit.service';
import { CreateSaleInput, UpdateSaleInput } from '../validations/sale.validation';
import { emitToGallery } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const CURRENT_MONTH_START = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface GetAllParams {
  galleryId: string;
  page: number;
  limit: number;
  skip: number;
  startDate?: string;
  endDate?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SaleService {
  // ─── List ────────────────────────────────────────────────────────────────

  async getAll(params: GetAllParams) {
    const where: Prisma.SaleWhereInput = {
      galleryId: params.galleryId, // CRITICAL: tenant isolation
    };

    if (params.startDate || params.endDate) {
      where.saleDate = {};

      if (params.startDate) {
        (where.saleDate as Prisma.DateTimeFilter).gte = new Date(params.startDate);
      }

      if (params.endDate) {
        (where.saleDate as Prisma.DateTimeFilter).lte = new Date(params.endDate);
      }
    }

    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { saleDate: 'desc' },
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              color: true,
              vin: true,
              engineCC: true,
              fuelType: true,
              transmission: true,
              images: {
                where: { isMain: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Single sale ─────────────────────────────────────────────────────────

  async getById(id: string, galleryId: string) {
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        galleryId, // Tenant isolation
      },
      include: {
        vehicle: {
          include: {
            originCountry: {
              select: {
                id: true,
                code: true,
                name: true,
                flag: true,
              },
            },
            images: {
              orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
            },
            expenses: {
              orderBy: { date: 'desc' },
            },
            calculations: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                totalCostUSD: true,
                totalCostTL: true,
                calculatedAt: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            identityNo: true,
            address: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundError(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(
    data: CreateSaleInput,
    galleryId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const salePrice = data.salePrice;
    const saleDate = data.saleDate ? new Date(data.saleDate) : new Date();

    // Tüm guard sorguları ve yazma işlemleri tek atomik transaction içinde —
    // Eş zamanlı isteklerin aynı aracı satmasını önler (TOCTOU koruması).
    const { sale, vehicle, vehicleTotalCost, profit, profitMargin } =
      await prisma.$transaction(async (tx) => {
        // 1. Aracı doğrula — bu galeriye ait olmalı (tx içinde — atomik kilit)
        const foundVehicle = await tx.vehicle.findFirst({
          where: {
            id: data.vehicleId,
            galleryId, // CRITICAL: tenant check
          },
          include: {
            calculations: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                totalCostUSD: true,
              },
            },
          },
        });

        if (!foundVehicle) {
          throw new NotFoundError(`Vehicle with ID ${data.vehicleId} not found`);
        }

        // 2. Araç durumu kontrol et — sadece IN_STOCK satılabilir
        if (foundVehicle.status !== 'IN_STOCK') {
          throw new BadRequestError(
            `Vehicle cannot be sold: current status is "${foundVehicle.status}". Only IN_STOCK vehicles can be sold.`,
          );
        }

        // 3. Mevcut aktif satış var mı kontrol et (unique constraint var ama açık hata mesajı verelim)
        const existingSale = await tx.sale.findFirst({
          where: { vehicleId: data.vehicleId },
        });

        if (existingSale) {
          throw new BadRequestError(
            `Vehicle with ID ${data.vehicleId} already has a sale record`,
          );
        }

        // 4. Müşteriyi doğrula — bu galeriye ait olmalı
        const foundCustomer = await tx.customer.findFirst({
          where: {
            id: data.customerId,
            galleryId, // CRITICAL: tenant check
          },
        });

        if (!foundCustomer) {
          throw new NotFoundError(`Customer with ID ${data.customerId} not found`);
        }

        // 5. Kar hesaplama
        //    - totalCost: vehicle.totalCost (ithalat maliyeti + additionalExpenses — saveToVehicle tarafından set edilmiş)
        //    - Eğer vehicle.totalCost set edilmemişse fallback: fobPrice + additionalExpenses
        let txVehicleTotalCost: number;

        if (foundVehicle.totalCost !== null) {
          txVehicleTotalCost = Number(foundVehicle.totalCost);
        } else {
          // Fallback: FOB fiyatı + ek giderler
          txVehicleTotalCost =
            Number(foundVehicle.fobPrice) + Number(foundVehicle.additionalExpenses);
        }

        const txProfit = salePrice - txVehicleTotalCost;
        // profitMargin = (kar / satış fiyatı) * 100
        // Division by zero koruması
        const txProfitMargin = salePrice > 0 ? (txProfit / salePrice) * 100 : 0;

        // 6a. Sale kaydı oluştur
        const newSale = await tx.sale.create({
          data: {
            vehicleId: data.vehicleId,
            customerId: data.customerId,
            galleryId,
            salePrice: new Prisma.Decimal(salePrice),
            totalCost: new Prisma.Decimal(txVehicleTotalCost),
            profit: new Prisma.Decimal(txProfit),
            profitMargin: new Prisma.Decimal(txProfitMargin),
            saleDate,
            paymentType: data.paymentMethod,
            notes: data.notes,
            createdBy: userId,
          },
          include: {
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                vin: true,
                color: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        });

        // 6b. Araç durumunu SOLD yap, soldDate ve salePrice güncelle
        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: {
            status: 'SOLD',
            soldDate: saleDate,
            salePrice: new Prisma.Decimal(salePrice),
            profit: new Prisma.Decimal(txProfit),
            profitMargin: new Prisma.Decimal(txProfitMargin),
          },
        });

        return {
          sale: newSale,
          vehicle: foundVehicle,
          vehicleTotalCost: txVehicleTotalCost,
          profit: txProfit,
          profitMargin: txProfitMargin,
        };
      });

    // 7. Audit log
    await auditService.log({
      action: 'CREATE',
      entityType: 'Sale',
      entityId: sale.id,
      newValues: {
        vehicleId: data.vehicleId,
        customerId: data.customerId,
        galleryId,
        salePrice,
        totalCost: vehicleTotalCost,
        profit,
        profitMargin,
        saleDate: saleDate.toISOString(),
        paymentMethod: data.paymentMethod,
      },
      performedBy: userId,
      ipAddress,
    });

    try {
      emitToGallery(galleryId, SOCKET_EVENTS.SALE_CREATED, {
        id: sale.id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        salePrice: Number(sale.salePrice),
      });
      emitToGallery(galleryId, SOCKET_EVENTS.VEHICLE_SOLD, {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
      });
    } catch (emitError) {
      console.error('[SaleService] Socket emit error (create):', emitError);
    }

    return sale;
  }

  // ─── Update ──────────────────────────────────────────────────────────────
  // Sadece salePrice, notes, paymentMethod güncellenebilir.
  // salePrice değişirse kar yeniden hesaplanır.

  async update(
    id: string,
    data: UpdateSaleInput,
    galleryId: string,
  ) {
    const updated = await prisma.$transaction(async (tx) => {
      // Mevcut satışı doğrula — transaction içinde (TOCTOU koruması)
      const existing = await tx.sale.findFirst({
        where: { id, galleryId }, // CRITICAL: tenant isolation
      });

      if (!existing) {
        throw new NotFoundError(`Sale with ID ${id} not found`);
      }

      // Eğer salePrice değişiyorsa kar yeniden hesaplanır
      const newSalePrice =
        data.salePrice !== undefined
          ? data.salePrice
          : Number(existing.salePrice);

      const totalCost = Number(existing.totalCost);
      const profit = newSalePrice - totalCost;
      const profitMargin = newSalePrice > 0 ? (profit / newSalePrice) * 100 : 0;

      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          ...(data.salePrice !== undefined && {
            salePrice: new Prisma.Decimal(data.salePrice),
            profit: new Prisma.Decimal(profit),
            profitMargin: new Prisma.Decimal(profitMargin),
          }),
          ...(data.paymentMethod !== undefined && {
            paymentType: data.paymentMethod,
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Araç üzerindeki salePrice ve kar bilgilerini de güncelle.
      // U-MT2: existing.vehicleId, yukarıdaki galleryId-filtered sale findFirst'ten
      // geldiği için tenant izolasyonu zaten sağlanmış durumdadır. Bununla birlikte
      // updateMany + count kontrolü ile galleryId ek güvence sağlar.
      if (data.salePrice !== undefined) {
        const vehicleUpdateCount = await tx.vehicle.updateMany({
          where: { id: existing.vehicleId, galleryId },
          data: {
            salePrice: new Prisma.Decimal(data.salePrice),
            profit: new Prisma.Decimal(profit),
            profitMargin: new Prisma.Decimal(profitMargin),
          },
        });

        if (vehicleUpdateCount.count === 0) {
          throw new NotFoundError(
            `Vehicle with ID ${existing.vehicleId} not found in this gallery`
          );
        }
      }

      return updatedSale;
    });

    return updated;
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────
  // Satışı iptal et: Sale kaydını sil, aracı tekrar IN_STOCK'a al

  async cancel(
    id: string,
    galleryId: string,
    userId: string,
    ipAddress?: string,
  ) {
    // Atomik transaction: Doğrulama + Sale sil + Vehicle'ı IN_STOCK'a al
    const { sale, auditData } = await prisma.$transaction(async (tx) => {
      // Satışı bul ve galeriye ait olduğunu doğrula — transaction içinde (TOCTOU koruması)
      const foundSale = await tx.sale.findFirst({
        where: { id, galleryId }, // CRITICAL: tenant isolation
        select: {
          id: true,
          vehicleId: true,
          salePrice: true,
          galleryId: true,
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
            },
          },
        },
      });

      if (!foundSale) {
        throw new NotFoundError(`Sale with ID ${id} not found`);
      }

      // Audit log için bilgileri kaydet
      const audit = {
        vehicleId: foundSale.vehicleId,
        galleryId: foundSale.galleryId,
        salePrice: Number(foundSale.salePrice),
        cancelledBy: userId,
      };

      // Satış kaydını sil
      await tx.sale.delete({ where: { id } });

      // Aracı tekrar stoka al — satış bilgilerini temizle
      await tx.vehicle.update({
        where: { id: foundSale.vehicleId },
        data: {
          status: 'IN_STOCK',
          soldDate: null,
          salePrice: null,
          profit: null,
          profitMargin: null,
        },
      });

      return { sale: foundSale, auditData: audit };
    });

    // Audit log
    await auditService.log({
      action: 'CANCEL',
      entityType: 'Sale',
      entityId: id,
      oldValues: auditData,
      performedBy: userId,
      ipAddress,
    });

    try {
      emitToGallery(galleryId, SOCKET_EVENTS.SALE_CANCELLED, {
        id,
        vehicleId: sale.vehicleId,
      });
    } catch (emitError) {
      console.error('[SaleService] Socket emit error (cancel):', emitError);
    }

    return { id, message: 'Sale cancelled and vehicle returned to stock' };
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats(galleryId: string) {
    const monthStart = CURRENT_MONTH_START();

    const [totalStats, monthlyCount] = await Promise.all([
      // Tüm satış toplamları
      prisma.sale.aggregate({
        where: { galleryId },
        _count: { _all: true },
        _sum: {
          salePrice: true,
          profit: true,
          profitMargin: true,
        },
        _avg: {
          profitMargin: true,
        },
      }),
      // Bu ayki satış sayısı
      prisma.sale.count({
        where: {
          galleryId,
          saleDate: { gte: monthStart },
        },
      }),
    ]);

    const totalSales = totalStats._count._all;
    const totalRevenue = totalStats._sum.salePrice
      ? Number(totalStats._sum.salePrice)
      : 0;
    const totalProfit = totalStats._sum.profit
      ? Number(totalStats._sum.profit)
      : 0;
    const averageProfitMargin = totalStats._avg.profitMargin
      ? Number(totalStats._avg.profitMargin)
      : 0;

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      averageProfitMargin,
      currentMonthSales: monthlyCount,
    };
  }
}

export const saleService = new SaleService();
