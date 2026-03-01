// Dashboard controller — stats and chart endpoints
import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  /**
   * GET /dashboard
   * Get dashboard stats for current gallery
   * Requires: authenticate, requireGalleryAccess, galleryTenant middleware
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const galleryId = req.galleryId as string;

      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery ID not found in request' });
        return;
      }

      const stats = await dashboardService.getStats(galleryId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Dashboard getStats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /dashboard/charts
   * Get all chart data for current gallery
   * Requires: authenticate, requireGalleryAccess, galleryTenant middleware
   */
  async getCharts(req: Request, res: Response): Promise<void> {
    try {
      const galleryId = req.galleryId as string;

      if (!galleryId) {
        res.status(400).json({ success: false, message: 'Gallery ID not found in request' });
        return;
      }

      const charts = await dashboardService.getCharts(galleryId);

      res.json({
        success: true,
        data: charts,
      });
    } catch (error) {
      console.error('Dashboard getCharts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard chart data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const dashboardController = new DashboardController();
