// Vehicle Expense controller
import { Request, Response, NextFunction } from 'express';
import { vehicleExpenseService } from '../services/vehicleExpense.service';
import { sendSuccess } from '../utils/helpers';

export class VehicleExpenseController {
  async getByVehicleId(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId ?? req.user!.galleryId!;

      const expenses = await vehicleExpenseService.getByVehicleId(
        vehicleId,
        galleryId
      );

      sendSuccess(res, expenses);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const galleryId = req.galleryId ?? req.user!.galleryId!;

      const expense = await vehicleExpenseService.create(
        req.body,
        vehicleId,
        galleryId
      );

      sendSuccess(res, expense, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { expenseId } = req.params as { expenseId: string };
      const galleryId = req.galleryId ?? req.user!.galleryId!;

      const expense = await vehicleExpenseService.update(
        expenseId,
        req.body,
        galleryId
      );

      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { expenseId } = req.params as { expenseId: string };
      const galleryId = req.galleryId ?? req.user!.galleryId!;

      const result = await vehicleExpenseService.delete(expenseId, galleryId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleExpenseController = new VehicleExpenseController();
