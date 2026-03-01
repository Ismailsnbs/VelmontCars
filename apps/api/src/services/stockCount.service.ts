// Stock Count (Inventory) Service
// Batch stok sayımı — fark hesaplama ve ADJUSTMENT hareketleri
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { StockCountItem } from '../validations/stockCount.validation';

// ─── Tipler ────────────────────────────────────────────────────────────────────

export interface ProductForCount {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
  barcode: string | null;
}

export interface StockCountResult {
  productId: string;
  productName: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  adjusted: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class StockCountService {
  /**
   * Sayım başlatmak için galeri ürünlerini ve mevcut stok miktarlarını döndür.
   * Multi-tenant: yalnızca galleryId'ye ait ürünler listelenir.
   */
  async getProductsForCount(galleryId: string): Promise<ProductForCount[]> {
    const products = await prisma.product.findMany({
      where: { galleryId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        currentStock: true,
        minStockLevel: true,
        unitPrice: true,
        barcode: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      currentStock: Number(p.currentStock),
      minStockLevel: Number(p.minStockLevel),
      unitPrice: Number(p.unitPrice),
      barcode: p.barcode,
    }));
  }

  /**
   * Sayımı önizle — farkları hesapla ama veritabanına kaydetme.
   * Multi-tenant: tüm productId'lerin galleryId'ye ait olduğu doğrulanır.
   */
  async previewCount(
    items: StockCountItem[],
    galleryId: string,
  ): Promise<StockCountResult[]> {
    const productIds = items.map((i) => i.productId);

    // Duplicate productId kontrolü
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      throw new BadRequestError('Duplicate product IDs are not allowed in stock count');
    }

    // Tüm ürünleri tek sorguda çek
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        galleryId,
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
      },
    });

    // Multi-tenant doğrulama: bulunan ürün sayısı istek sayısıyla eşleşmeli
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(
        `Products not found or do not belong to this gallery: ${missingIds.join(', ')}`,
      );
    }

    // Ürünleri hızlı erişim için map'e al
    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId)!;
      const systemQuantity = Number(product.currentStock);
      const difference = item.countedQuantity - systemQuantity;

      return {
        productId: item.productId,
        productName: product.name,
        systemQuantity,
        countedQuantity: item.countedQuantity,
        difference,
        adjusted: false, // preview — henüz kayıt yok
      };
    });
  }

  /**
   * Sayımı onayla ve farklar için ADJUSTMENT hareketleri oluştur.
   * Multi-tenant: tüm productId'lerin galleryId'ye ait olduğu doğrulanır.
   * Atomik: $transaction içinde tüm stok güncellemeleri ve hareketler birlikte yazılır.
   */
  async applyCount(
    items: StockCountItem[],
    galleryId: string,
    userId: string,
  ): Promise<StockCountResult[]> {
    const productIds = items.map((i) => i.productId);

    // Duplicate productId kontrolü
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      throw new BadRequestError('Duplicate product IDs are not allowed in stock count');
    }

    // Tüm ürünleri tek sorguda çek — multi-tenant doğrulama
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        galleryId,
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
      },
    });

    // Multi-tenant doğrulama
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(
        `Products not found or do not belong to this gallery: ${missingIds.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Sadece fark olan ürünler için işlem yapılır
    const itemsWithDiff = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const systemQuantity = Number(product.currentStock);
      const difference = item.countedQuantity - systemQuantity;
      return { item, product, systemQuantity, difference };
    });

    const adjustedItems = itemsWithDiff.filter((entry) => entry.difference !== 0);

    // Fark yoksa transaction'a gerek yok
    if (adjustedItems.length > 0) {
      // Tüm güncelleme ve hareketleri atomik olarak uygula
      await prisma.$transaction(async (tx) => {
        for (const { item, product, difference } of adjustedItems) {
          // StockMovement oluştur — ADJUSTMENT tipi
          await tx.stockMovement.create({
            data: {
              type: 'ADJUSTMENT',
              quantity: new Prisma.Decimal(item.countedQuantity),
              note: `Stock count adjustment — difference: ${difference > 0 ? '+' : ''}${difference}`,
              productId: item.productId,
              createdBy: userId,
            },
          });

          // Product.currentStock'u sayılan miktara güncelle
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: new Prisma.Decimal(item.countedQuantity),
            },
          });

          void product; // kullanıldığını işaretle (lint)
        }
      });
    }

    // Tüm ürünler için sonuç döndür
    return itemsWithDiff.map(({ item, product, systemQuantity, difference }) => ({
      productId: item.productId,
      productName: product.name,
      systemQuantity,
      countedQuantity: item.countedQuantity,
      difference,
      adjusted: difference !== 0,
    }));
  }
}

export const stockCountService = new StockCountService();
