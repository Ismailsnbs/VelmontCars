// Report Service — gallery-scoped (multi-tenant)
// T-051: 6 rapor: vehicleInventory, vehicleStatusSummary, costReport, stockReport, salesReport, financialSummary
import { Prisma, VehicleStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error.middleware';

// ─── Yardımcı dönüşüm fonksiyonları ──────────────────────────────────────────

function toNum(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function buildDateRange(
  startDate?: string,
  endDate?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (!startDate && !endDate) return undefined;

  const range: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) {
      throw new BadRequestError(`Invalid startDate: ${startDate}`);
    }
    range.gte = d;
  }

  if (endDate) {
    const d = new Date(endDate);
    if (isNaN(d.getTime())) {
      throw new BadRequestError(`Invalid endDate: ${endDate}`);
    }
    // Bitiş gününün sonuna kadar (23:59:59.999) al
    d.setHours(23, 59, 59, 999);
    range.lte = d;
  }

  return range;
}

// ─── Rapor veri tipleri ────────────────────────────────────────────────────────

export interface VehicleInventoryReport {
  generatedAt: Date;
  galleryId: string;
  filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  summary: {
    total: number;
    transit: number;
    inStock: number;
    sold: number;
    reserved: number;
  };
  vehicles: VehicleInventoryItem[];
}

export interface VehicleInventoryItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  fuelType: string | null;
  transmission: string | null;
  engineCC: number;
  originCountry: string;
  fobPrice: number;
  salePrice: number | null;
  totalCost: number | null;
  totalImportCost: number | null;
  additionalExpenses: number;
  createdAt: Date;
  soldDate: Date | null;
  arrivalDate: Date | null;
  estimatedArrival: Date | null;
}

export interface VehicleStatusSummaryReport {
  generatedAt: Date;
  galleryId: string;
  summary: {
    total: number;
    transit: number;
    inStock: number;
    sold: number;
    reserved: number;
    activeInventoryValue: number;
    soldInventoryValue: number;
  };
  breakdown: VehicleStatusBreakdownItem[];
}

export interface VehicleStatusBreakdownItem {
  status: string;
  count: number;
  totalFobValue: number;
  totalCostValue: number;
}

export interface CostReport {
  generatedAt: Date;
  galleryId: string;
  filters: {
    startDate?: string;
    endDate?: string;
  };
  summary: {
    totalCalculations: number;
    avgCIF: number;
    avgTotalCost: number;
    totalTaxesPaid: number;
    totalCostUSD: number;
    totalCostTL: number;
  };
  calculations: CostReportItem[];
}

export interface CostReportItem {
  id: string;
  vehicleId: string | null;
  originCountry: string;
  engineCC: number;
  vehicleType: string;
  modelYear: number;
  cifValue: number;
  customsDuty: number;
  kdv: number;
  fif: number;
  generalFif: number;
  gkk: number;
  wharfFee: number;
  bandrol: number;
  otherFees: number;
  totalTaxes: number;
  totalCostUSD: number;
  totalCostTL: number;
  exchangeRate: number;
  calculatedAt: Date;
}

export interface StockReport {
  generatedAt: Date;
  galleryId: string;
  summary: {
    totalProducts: number;
    lowStockCount: number;
    totalStockValue: number;
    categoryBreakdown: CategoryBreakdownItem[];
  };
  lowStockItems: LowStockItem[];
  allProducts: StockProductItem[];
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  totalValue: number;
  totalStock: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  deficit: number;
  unitPrice: number;
}

export interface StockProductItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
  stockValue: number;
  isLowStock: boolean;
  lastPurchaseAt: Date | null;
}

export interface SalesReport {
  generatedAt: Date;
  galleryId: string;
  filters: {
    startDate?: string;
    endDate?: string;
  };
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgProfitMargin: number;
  };
  sales: SalesReportItem[];
}

export interface SalesReportItem {
  id: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  customerName: string;
  salePrice: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  saleDate: Date;
  paymentType: string | null;
}

export interface FinancialSummaryReport {
  generatedAt: Date;
  galleryId: string;
  filters: {
    year?: number;
    month?: number;
  };
  summary: {
    totalImportCost: number;
    totalSalesRevenue: number;
    totalProfit: number;
    avgProfitMargin: number;
    vehiclesSold: number;
    vehiclesImported: number;
  };
  monthlyBreakdown: MonthlyFinancialItem[];
}

export interface MonthlyFinancialItem {
  year: number;
  month: number;
  importCost: number;
  salesRevenue: number;
  profit: number;
  vehiclesSold: number;
  vehiclesImported: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ReportService {
  // ─── 1. Araç Envanter Raporu ───────────────────────────────────────────────

  async vehicleInventoryReport(
    galleryId: string,
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<VehicleInventoryReport> {
    const dateRange = buildDateRange(filters?.startDate, filters?.endDate);

    const where: Prisma.VehicleWhereInput = {
      galleryId, // CRITICAL: multi-tenant isolation
    };

    if (filters?.status) {
      where.status = filters.status as VehicleStatus;
    }

    if (dateRange) {
      where.createdAt = dateRange;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        originCountry: {
          select: { name: true },
        },
      },
    });

    // Durum sayılarını hesapla
    const statusCounts = { TRANSIT: 0, IN_STOCK: 0, SOLD: 0, RESERVED: 0 };
    for (const v of vehicles) {
      statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1;
    }

    const vehicleItems: VehicleInventoryItem[] = vehicles.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      status: v.status,
      vin: v.vin,
      color: v.color,
      mileage: v.mileage,
      fuelType: v.fuelType,
      transmission: v.transmission,
      engineCC: v.engineCC,
      originCountry: v.originCountry.name,
      fobPrice: toNum(v.fobPrice),
      salePrice: v.salePrice !== null ? toNum(v.salePrice) : null,
      totalCost: v.totalCost !== null ? toNum(v.totalCost) : null,
      totalImportCost: v.totalImportCost !== null ? toNum(v.totalImportCost) : null,
      additionalExpenses: toNum(v.additionalExpenses),
      createdAt: v.createdAt,
      soldDate: v.soldDate,
      arrivalDate: v.arrivalDate,
      estimatedArrival: v.estimatedArrival,
    }));

    return {
      generatedAt: new Date(),
      galleryId,
      filters: {
        status: filters?.status,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
      summary: {
        total: vehicles.length,
        transit: statusCounts.TRANSIT,
        inStock: statusCounts.IN_STOCK,
        sold: statusCounts.SOLD,
        reserved: statusCounts.RESERVED,
      },
      vehicles: vehicleItems,
    };
  }

  // ─── 2. Araç Durum Özeti ───────────────────────────────────────────────────

  async vehicleStatusSummary(galleryId: string): Promise<VehicleStatusSummaryReport> {
    const [groupedByStatus, aggregates] = await Promise.all([
      // Status bazlı gruplama
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { galleryId },
        _count: { _all: true },
        _sum: {
          fobPrice: true,
          totalCost: true,
        },
      }),
      // Aktif envanter değeri vs satılan araç değeri
      Promise.all([
        prisma.vehicle.aggregate({
          where: { galleryId, status: { notIn: ['SOLD'] } },
          _sum: { totalCost: true },
        }),
        prisma.vehicle.aggregate({
          where: { galleryId, status: 'SOLD' },
          _sum: { salePrice: true },
        }),
      ]),
    ]);

    const [activeAgg, soldAgg] = aggregates;

    const statusCounts: Record<string, number> = {
      TRANSIT: 0,
      IN_STOCK: 0,
      SOLD: 0,
      RESERVED: 0,
    };

    const breakdown: VehicleStatusBreakdownItem[] = groupedByStatus.map((row) => {
      statusCounts[row.status] = row._count._all;
      return {
        status: row.status,
        count: row._count._all,
        totalFobValue: toNum(row._sum.fobPrice),
        totalCostValue: toNum(row._sum.totalCost),
      };
    });

    const total = Object.values(statusCounts).reduce((sum, v) => sum + v, 0);

    return {
      generatedAt: new Date(),
      galleryId,
      summary: {
        total,
        transit: statusCounts['TRANSIT'] ?? 0,
        inStock: statusCounts['IN_STOCK'] ?? 0,
        sold: statusCounts['SOLD'] ?? 0,
        reserved: statusCounts['RESERVED'] ?? 0,
        activeInventoryValue: toNum(activeAgg._sum.totalCost),
        soldInventoryValue: toNum(soldAgg._sum.salePrice),
      },
      breakdown,
    };
  }

  // ─── 3. Maliyet Raporu ─────────────────────────────────────────────────────

  async costReport(
    galleryId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    },
  ): Promise<CostReport> {
    const dateRange = buildDateRange(filters?.startDate, filters?.endDate);

    const where: Prisma.ImportCalculationWhereInput = {
      galleryId, // multi-tenant isolation
    };

    if (dateRange) {
      where.calculatedAt = dateRange;
    }

    const [calculations, aggregates] = await Promise.all([
      prisma.importCalculation.findMany({
        where,
        orderBy: { calculatedAt: 'desc' },
      }),
      prisma.importCalculation.aggregate({
        where,
        _count: { _all: true },
        _avg: {
          cifValue: true,
          totalCostUSD: true,
        },
        _sum: {
          totalTaxes: true,
          totalCostUSD: true,
          totalCostTL: true,
        },
      }),
    ]);

    const calculationItems: CostReportItem[] = calculations.map((c) => ({
      id: c.id,
      vehicleId: c.vehicleId,
      originCountry: c.originCountry,
      engineCC: c.engineCC,
      vehicleType: c.vehicleType,
      modelYear: c.modelYear,
      cifValue: toNum(c.cifValue),
      customsDuty: toNum(c.customsDuty),
      kdv: toNum(c.kdv),
      fif: toNum(c.fif),
      generalFif: toNum(c.generalFif),
      gkk: toNum(c.gkk),
      wharfFee: toNum(c.wharfFee),
      bandrol: toNum(c.bandrol),
      otherFees: toNum(c.otherFees),
      totalTaxes: toNum(c.totalTaxes),
      totalCostUSD: toNum(c.totalCostUSD),
      totalCostTL: toNum(c.totalCostTL),
      exchangeRate: toNum(c.exchangeRate),
      calculatedAt: c.calculatedAt,
    }));

    return {
      generatedAt: new Date(),
      galleryId,
      filters: {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
      summary: {
        totalCalculations: aggregates._count._all,
        avgCIF: toNum(aggregates._avg.cifValue),
        avgTotalCost: toNum(aggregates._avg.totalCostUSD),
        totalTaxesPaid: toNum(aggregates._sum.totalTaxes),
        totalCostUSD: toNum(aggregates._sum.totalCostUSD),
        totalCostTL: toNum(aggregates._sum.totalCostTL),
      },
      calculations: calculationItems,
    };
  }

  // ─── 4. Stok Raporu ────────────────────────────────────────────────────────

  async stockReport(galleryId: string): Promise<StockReport> {
    const products = await prisma.product.findMany({
      where: { galleryId }, // multi-tenant isolation
      orderBy: { name: 'asc' },
    });

    const allProducts: StockProductItem[] = products.map((p) => {
      const currentStock = toNum(p.currentStock);
      const minStockLevel = toNum(p.minStockLevel);
      const unitPrice = toNum(p.unitPrice);
      const stockValue = currentStock * unitPrice;
      const isLowStock = currentStock <= minStockLevel;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        currentStock,
        minStockLevel,
        unitPrice,
        stockValue,
        isLowStock,
        lastPurchaseAt: p.lastPurchaseAt,
      };
    });

    const lowStockItems: LowStockItem[] = products
      .filter((p) => toNum(p.currentStock) <= toNum(p.minStockLevel))
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        currentStock: toNum(p.currentStock),
        minStockLevel: toNum(p.minStockLevel),
        deficit: Math.max(0, toNum(p.minStockLevel) - toNum(p.currentStock)),
        unitPrice: toNum(p.unitPrice),
      }));

    // Kategori bazlı özet
    const categoryMap = new Map<
      string,
      { count: number; totalValue: number; totalStock: number }
    >();

    for (const p of allProducts) {
      const existing = categoryMap.get(p.category) ?? {
        count: 0,
        totalValue: 0,
        totalStock: 0,
      };
      categoryMap.set(p.category, {
        count: existing.count + 1,
        totalValue: existing.totalValue + p.stockValue,
        totalStock: existing.totalStock + p.currentStock,
      });
    }

    const categoryBreakdown: CategoryBreakdownItem[] = Array.from(
      categoryMap.entries(),
    ).map(([category, data]) => ({
      category,
      count: data.count,
      totalValue: data.totalValue,
      totalStock: data.totalStock,
    }));

    const totalStockValue = allProducts.reduce((sum, p) => sum + p.stockValue, 0);

    return {
      generatedAt: new Date(),
      galleryId,
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        totalStockValue,
        categoryBreakdown,
      },
      lowStockItems,
      allProducts,
    };
  }

  // ─── 5. Satış Raporu ───────────────────────────────────────────────────────

  async salesReport(
    galleryId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    },
  ): Promise<SalesReport> {
    const dateRange = buildDateRange(filters?.startDate, filters?.endDate);

    const where: Prisma.SaleWhereInput = {
      galleryId, // multi-tenant isolation
    };

    if (dateRange) {
      where.saleDate = dateRange;
    }

    const [sales, aggregates] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { saleDate: 'desc' },
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
              name: true,
            },
          },
        },
      }),
      prisma.sale.aggregate({
        where,
        _count: { _all: true },
        _sum: {
          salePrice: true,
          totalCost: true,
          profit: true,
        },
        _avg: {
          profitMargin: true,
        },
      }),
    ]);

    const saleItems: SalesReportItem[] = sales.map((s) => ({
      id: s.id,
      vehicleId: s.vehicleId,
      vehicleBrand: s.vehicle.brand,
      vehicleModel: s.vehicle.model,
      vehicleYear: s.vehicle.year,
      customerName: s.customer.name,
      salePrice: toNum(s.salePrice),
      totalCost: toNum(s.totalCost),
      profit: toNum(s.profit),
      profitMargin: toNum(s.profitMargin),
      saleDate: s.saleDate,
      paymentType: s.paymentType,
    }));

    return {
      generatedAt: new Date(),
      galleryId,
      filters: {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
      summary: {
        totalSales: aggregates._count._all,
        totalRevenue: toNum(aggregates._sum.salePrice),
        totalCost: toNum(aggregates._sum.totalCost),
        totalProfit: toNum(aggregates._sum.profit),
        avgProfitMargin: toNum(aggregates._avg.profitMargin),
      },
      sales: saleItems,
    };
  }

  // ─── 6. Finansal Özet ─────────────────────────────────────────────────────

  async financialSummary(
    galleryId: string,
    filters?: {
      year?: number;
      month?: number;
    },
  ): Promise<FinancialSummaryReport> {
    // Yıl/ay filtresine göre tarih aralığı belirle
    const now = new Date();
    const targetYear = filters?.year ?? now.getFullYear();

    let dateStart: Date;
    let dateEnd: Date;

    if (filters?.month) {
      // Belirli bir ay
      dateStart = new Date(targetYear, filters.month - 1, 1);
      dateEnd = new Date(targetYear, filters.month, 0, 23, 59, 59, 999);
    } else {
      // Tüm yıl
      dateStart = new Date(targetYear, 0, 1);
      dateEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    // Paralel sorgular — ithalat hesaplamaları + satışlar
    const [calculations, sales] = await Promise.all([
      prisma.importCalculation.findMany({
        where: {
          galleryId,
          calculatedAt: { gte: dateStart, lte: dateEnd },
        },
        select: {
          totalCostUSD: true,
          calculatedAt: true,
        },
        orderBy: { calculatedAt: 'asc' },
      }),
      prisma.sale.findMany({
        where: {
          galleryId,
          saleDate: { gte: dateStart, lte: dateEnd },
        },
        select: {
          salePrice: true,
          profit: true,
          profitMargin: true,
          saleDate: true,
        },
        orderBy: { saleDate: 'asc' },
      }),
    ]);

    // Aylık kırılım haritası (key: "YYYY-M")
    const monthlyMap = new Map<
      string,
      {
        year: number;
        month: number;
        importCost: number;
        salesRevenue: number;
        profit: number;
        vehiclesSold: number;
        vehiclesImported: number;
      }
    >();

    const ensureMonth = (year: number, month: number) => {
      const key = `${year}-${month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          importCost: 0,
          salesRevenue: 0,
          profit: 0,
          vehiclesSold: 0,
          vehiclesImported: 0,
        });
      }
      return monthlyMap.get(key)!;
    };

    // İthalat maliyetlerini aylık dağıt
    for (const calc of calculations) {
      const d = calc.calculatedAt;
      const entry = ensureMonth(d.getFullYear(), d.getMonth() + 1);
      entry.importCost += toNum(calc.totalCostUSD);
      entry.vehiclesImported += 1;
    }

    // Satışları aylık dağıt
    for (const sale of sales) {
      const d = sale.saleDate;
      const entry = ensureMonth(d.getFullYear(), d.getMonth() + 1);
      entry.salesRevenue += toNum(sale.salePrice);
      entry.profit += toNum(sale.profit);
      entry.vehiclesSold += 1;
    }

    // Sıralı aylık kırılım
    const monthlyBreakdown: MonthlyFinancialItem[] = Array.from(
      monthlyMap.values(),
    ).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Özet toplamları
    const totalImportCost = calculations.reduce(
      (sum, c) => sum + toNum(c.totalCostUSD),
      0,
    );
    const totalSalesRevenue = sales.reduce((sum, s) => sum + toNum(s.salePrice), 0);
    const totalProfit = sales.reduce((sum, s) => sum + toNum(s.profit), 0);
    const avgProfitMargin =
      sales.length > 0
        ? sales.reduce((sum, s) => sum + toNum(s.profitMargin), 0) / sales.length
        : 0;

    return {
      generatedAt: new Date(),
      galleryId,
      filters: {
        year: filters?.year,
        month: filters?.month,
      },
      summary: {
        totalImportCost,
        totalSalesRevenue,
        totalProfit,
        avgProfitMargin,
        vehiclesSold: sales.length,
        vehiclesImported: calculations.length,
      },
      monthlyBreakdown,
    };
  }
}

export const reportService = new ReportService();
