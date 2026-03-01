// Stock Alert service for low stock monitoring
import prisma from '../lib/prisma';
import { NotFoundError } from '../middleware/error.middleware';
import { emitToGallery } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  deficit: number;
}

export class StockAlertService {
  /**
   * Get all low stock products for a gallery
   * Multi-tenant: filtered by galleryId
   * Returns products where currentStock < minStockLevel with deficit amount
   */
  async getLowStockProducts(galleryId: string): Promise<LowStockProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        galleryId,
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minStockLevel: true,
      },
    });

    // Filter and calculate deficit for products below minimum stock
    const lowStock = products
      .filter(p => p.currentStock < p.minStockLevel)
      .map(p => ({
        id: p.id,
        name: p.name,
        currentStock: Number(p.currentStock),
        minStockLevel: Number(p.minStockLevel),
        deficit: Number(p.minStockLevel) - Number(p.currentStock),
      }))
      .sort((a, b) => b.deficit - a.deficit); // Sort by deficit descending

    return lowStock;
  }

  /**
   * Check for low stock products and create notification if any found
   * Multi-tenant: filtered by galleryId
   * Creates a GENERAL_ANNOUNCEMENT notification for the gallery
   */
  async checkAndAlert(galleryId: string): Promise<{ alerted: boolean, count: number }> {
    // Get low stock products
    const lowStockProducts = await this.getLowStockProducts(galleryId);

    if (lowStockProducts.length === 0) {
      return { alerted: false, count: 0 };
    }

    // Get gallery for name
    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { name: true },
    });

    if (!gallery) {
      throw new NotFoundError(`Gallery with ID ${galleryId} not found`);
    }

    // Build notification message
    const productList = lowStockProducts
      .map(p => `${p.name} (Current: ${p.currentStock}, Min: ${p.minStockLevel})`)
      .join('\n');

    const title = `Low Stock Alert - ${lowStockProducts.length} product(s)`;
    const message = `The following products in ${gallery.name} are below minimum stock levels:\n\n${productList}`;

    // Create notification
    await prisma.platformNotification.create({
      data: {
        type: 'GENERAL_ANNOUNCEMENT',
        title,
        message,
        priority: 'HIGH',
        targetType: 'GALLERY',
        targetIds: [galleryId],
        sentBy: 'SYSTEM',
      },
    });

    try {
      for (const product of lowStockProducts) {
        emitToGallery(galleryId, SOCKET_EVENTS.STOCK_LOW, {
          productId: product.id,
          productName: product.name,
          currentStock: product.currentStock,
          minStockLevel: product.minStockLevel,
          deficit: product.deficit,
        });
      }
    } catch (emitError) {
      console.error('[StockAlertService] Socket emit error (checkAndAlert):', emitError);
    }

    return {
      alerted: true,
      count: lowStockProducts.length,
    };
  }
}

export const stockAlertService = new StockAlertService();
