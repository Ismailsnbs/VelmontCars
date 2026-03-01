// Dashboard stats service — gallery-scoped analytics
import prisma from '../lib/prisma';

interface DashboardStats {
  vehicleStats: {
    total: number;
    transit: number;
    inStock: number;
    sold: number;
  };
  productStats: {
    total: number;
    lowStock: number;
  };
  recentVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number;
    status: string;
    createdAt: Date;
  }>;
}

export interface MonthlyVehicleIntakeItem {
  month: string;
  count: number;
}

export interface VehicleStatusDistributionItem {
  status: string;
  count: number;
}

export interface BrandDistributionItem {
  brand: string;
  count: number;
}

export interface MonthlyCostTrendItem {
  month: string;
  totalCost: number;
  avgCost: number;
}

export interface ProductCategoryDistributionItem {
  category: string;
  count: number;
  value: number;
}

export interface DashboardCharts {
  monthlyIntake: MonthlyVehicleIntakeItem[];
  statusDist: VehicleStatusDistributionItem[];
  brandDist: BrandDistributionItem[];
  costTrend: MonthlyCostTrendItem[];
  categoryDist: ProductCategoryDistributionItem[];
}

export class DashboardService {
  /**
   * Get all dashboard stats for a gallery (parallelized)
   * Multi-tenant: filtered by galleryId
   */
  async getStats(galleryId: string): Promise<DashboardStats> {
    const [vehicleStats, productStats, recentVehicles] = await Promise.all([
      this.getVehicleStats(galleryId),
      this.getProductStats(galleryId),
      this.getRecentVehicles(galleryId),
    ]);

    return { vehicleStats, productStats, recentVehicles };
  }

  /**
   * Get all chart data for a gallery (parallelized)
   */
  async getCharts(galleryId: string): Promise<DashboardCharts> {
    const [monthlyIntake, statusDist, brandDist, costTrend, categoryDist] = await Promise.all([
      this.getMonthlyVehicleIntake(galleryId),
      this.getVehicleStatusDistribution(galleryId),
      this.getBrandDistribution(galleryId),
      this.getMonthlyCostTrend(galleryId),
      this.getProductCategoryDistribution(galleryId),
    ]);

    return { monthlyIntake, statusDist, brandDist, costTrend, categoryDist };
  }

  /**
   * Get vehicle count stats by status
   */
  private async getVehicleStats(galleryId: string) {
    const [total, transit, inStock, sold] = await Promise.all([
      prisma.vehicle.count({
        where: { galleryId },
      }),
      prisma.vehicle.count({
        where: { galleryId, status: 'TRANSIT' },
      }),
      prisma.vehicle.count({
        where: { galleryId, status: 'IN_STOCK' },
      }),
      prisma.vehicle.count({
        where: { galleryId, status: 'SOLD' },
      }),
    ]);

    return { total, transit, inStock, sold };
  }

  /**
   * Get product stats: total and low stock count
   */
  private async getProductStats(galleryId: string) {
    const products = await prisma.product.findMany({
      where: { galleryId },
      select: {
        currentStock: true,
        minStockLevel: true,
      },
    });

    const total = products.length;
    const lowStock = products.filter(
      (p) => Number(p.currentStock) < Number(p.minStockLevel)
    ).length;

    return { total, lowStock };
  }

  /**
   * Get last 5 added vehicles
   */
  private async getRecentVehicles(galleryId: string) {
    return prisma.vehicle.findMany({
      where: { galleryId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Monthly vehicle intake count (last 12 months)
   */
  private async getMonthlyVehicleIntake(galleryId: string): Promise<MonthlyVehicleIntakeItem[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const vehicles = await prisma.vehicle.findMany({
      where: {
        galleryId,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
    });

    // Build a map of year-month -> count
    const countMap = new Map<string, number>();

    // Pre-populate all 12 months with 0 so empty months appear in chart
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      countMap.set(key, 0);
    }

    for (const v of vehicles) {
      const d = new Date(v.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    return Array.from(countMap.entries()).map(([key, count]) => {
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('tr-TR', {
        month: 'short',
        year: '2-digit',
      });
      return { month: label, count };
    });
  }

  /**
   * Vehicle status distribution for pie chart
   */
  private async getVehicleStatusDistribution(galleryId: string): Promise<VehicleStatusDistributionItem[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { galleryId },
      select: { status: true },
    });

    const countMap = new Map<string, number>();
    for (const v of vehicles) {
      countMap.set(v.status, (countMap.get(v.status) ?? 0) + 1);
    }

    const statusLabels: Record<string, string> = {
      TRANSIT: 'Transit',
      IN_STOCK: 'Stokta',
      RESERVED: 'Rezerve',
      SOLD: 'Satildi',
    };

    return Array.from(countMap.entries()).map(([status, count]) => ({
      status: statusLabels[status] ?? status,
      count,
    }));
  }

  /**
   * Top 10 brands by vehicle count for bar chart
   */
  private async getBrandDistribution(galleryId: string): Promise<BrandDistributionItem[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { galleryId },
      select: { brand: true },
    });

    const countMap = new Map<string, number>();
    for (const v of vehicles) {
      const brand = v.brand.trim();
      countMap.set(brand, (countMap.get(brand) ?? 0) + 1);
    }

    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({ brand, count }));
  }

  /**
   * Monthly cost trend from ImportCalculation (last 12 months)
   */
  private async getMonthlyCostTrend(galleryId: string): Promise<MonthlyCostTrendItem[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const calculations = await prisma.importCalculation.findMany({
      where: {
        galleryId,
        calculatedAt: { gte: twelveMonthsAgo },
      },
      select: {
        calculatedAt: true,
        totalCostUSD: true,
      },
    });

    // Pre-populate all 12 months
    const monthMap = new Map<string, { total: number; count: number; label: string }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('tr-TR', {
        month: 'short',
        year: '2-digit',
      });
      monthMap.set(key, { total: 0, count: 0, label });
    }

    for (const c of calculations) {
      const d = new Date(c.calculatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key);
      if (existing) {
        existing.total += Number(c.totalCostUSD);
        existing.count += 1;
      }
    }

    return Array.from(monthMap.entries()).map(([, val]) => ({
      month: val.label,
      totalCost: Math.round(val.total),
      avgCost: val.count > 0 ? Math.round(val.total / val.count) : 0,
    }));
  }

  /**
   * Product category distribution for pie chart
   */
  private async getProductCategoryDistribution(galleryId: string): Promise<ProductCategoryDistributionItem[]> {
    const products = await prisma.product.findMany({
      where: { galleryId },
      select: {
        category: true,
        currentStock: true,
        unitPrice: true,
      },
    });

    const categoryMap = new Map<string, { count: number; value: number }>();
    for (const p of products) {
      const existing = categoryMap.get(p.category) ?? { count: 0, value: 0 };
      categoryMap.set(p.category, {
        count: existing.count + 1,
        value: existing.value + Number(p.currentStock) * Number(p.unitPrice),
      });
    }

    const categoryLabels: Record<string, string> = {
      CLEANING: 'Temizlik',
      SPRAY: 'Sprey',
      CLOTH: 'Bez',
      BRUSH: 'Firca',
      CHEMICAL: 'Kimyasal',
      OTHER: 'Diger',
    };

    return Array.from(categoryMap.entries()).map(([category, { count, value }]) => ({
      category: categoryLabels[category] ?? category,
      count,
      value: Math.round(value),
    }));
  }
}

export const dashboardService = new DashboardService();
