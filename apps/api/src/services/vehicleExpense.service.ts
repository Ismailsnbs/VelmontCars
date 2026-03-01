// VehicleExpense CRUD service — gallery-scoped (multi-tenant)
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotFoundError } from '../middleware/error.middleware';
import { CreateExpenseInput, UpdateExpenseInput } from '../validations/vehicleExpense.validation';

export class VehicleExpenseService {
  // ─── Private helper: calculate total expenses for a vehicle ──────────

  private async calculateTotalExpenses(vehicleId: string): Promise<Prisma.Decimal> {
    const result = await prisma.vehicleExpense.aggregate({
      where: { vehicleId },
      _sum: { amount: true },
    });

    return result._sum.amount || new Prisma.Decimal(0);
  }

  // ─── List expenses by vehicle ─────────────────────────────────────────

  async getByVehicleId(vehicleId: string, galleryId: string) {
    // Verify vehicle exists and belongs to gallery
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, galleryId },
    });

    if (!vehicle) {
      throw new NotFoundError(
        `Vehicle with ID ${vehicleId} not found or does not belong to this gallery`
      );
    }

    const expenses = await prisma.vehicleExpense.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });

    return expenses;
  }

  // ─── Create expense and update vehicle sum ────────────────────────────

  async create(input: CreateExpenseInput, vehicleId: string, galleryId: string) {
    // Verify vehicle exists and belongs to gallery
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, galleryId },
    });

    if (!vehicle) {
      throw new NotFoundError(
        `Vehicle with ID ${vehicleId} not found or does not belong to this gallery`
      );
    }

    const expense = await prisma.vehicleExpense.create({
      data: {
        type: input.type,
        amount: new Prisma.Decimal(input.amount),
        description: input.description,
        date: input.date ? new Date(input.date) : new Date(),
        vehicleId,
        createdBy: input.createdBy,
      },
    });

    // Recalculate and update vehicle's additionalExpenses
    const totalExpenses = await this.calculateTotalExpenses(vehicleId);
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { additionalExpenses: totalExpenses },
    });

    return expense;
  }

  // ─── Update expense and recalculate vehicle sum ───────────────────────

  async update(
    expenseId: string,
    input: UpdateExpenseInput,
    galleryId: string
  ) {
    // Verify expense exists and belongs to this gallery's vehicle
    const expense = await prisma.vehicleExpense.findFirst({
      where: { id: expenseId },
      include: {
        vehicle: {
          select: { id: true, galleryId: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError(`Expense with ID ${expenseId} not found`);
    }

    if (expense.vehicle.galleryId !== galleryId) {
      throw new NotFoundError(`Expense does not belong to this gallery`);
    }

    const updateData: Prisma.VehicleExpenseUpdateInput = {};

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(input.amount);
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.date !== undefined) {
      updateData.date = new Date(input.date);
    }

    if (input.createdBy !== undefined) {
      updateData.createdBy = input.createdBy;
    }

    const updated = await prisma.vehicleExpense.update({
      where: { id: expenseId },
      data: updateData,
    });

    // Recalculate and update vehicle's additionalExpenses
    const totalExpenses = await this.calculateTotalExpenses(expense.vehicle.id);
    await prisma.vehicle.update({
      where: { id: expense.vehicle.id },
      data: { additionalExpenses: totalExpenses },
    });

    return updated;
  }

  // ─── Delete expense and recalculate vehicle sum ───────────────────────

  async delete(expenseId: string, galleryId: string) {
    // Verify expense exists and belongs to this gallery's vehicle
    const expense = await prisma.vehicleExpense.findFirst({
      where: { id: expenseId },
      include: {
        vehicle: {
          select: { id: true, galleryId: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError(`Expense with ID ${expenseId} not found`);
    }

    if (expense.vehicle.galleryId !== galleryId) {
      throw new NotFoundError(`Expense does not belong to this gallery`);
    }

    const vehicleId = expense.vehicle.id;

    await prisma.vehicleExpense.delete({
      where: { id: expenseId },
    });

    // Recalculate and update vehicle's additionalExpenses
    const totalExpenses = await this.calculateTotalExpenses(vehicleId);
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { additionalExpenses: totalExpenses },
    });

    return { id: expenseId };
  }
}

export const vehicleExpenseService = new VehicleExpenseService();
