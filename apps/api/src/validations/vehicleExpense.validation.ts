// Vehicle Expense validation schemas
import { z } from 'zod';

const EXPENSE_TYPES = ['REPAIR', 'PAINT', 'PARTS', 'INSURANCE', 'ADVERTISING', 'OTHER'] as const;

export const vehicleIdParamSchema = z.object({
  vehicleId: z.string().cuid(),
});

export const expenseIdParamSchema = z.object({
  vehicleId: z.string().cuid(),
  expenseId: z.string().cuid(),
});

export const createExpenseSchema = z.object({
  type: z.enum(EXPENSE_TYPES),
  amount: z.number().positive(),
  description: z.string().max(1000).optional(),
  date: z.string().datetime().optional(),
  createdBy: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  type: z.enum(EXPENSE_TYPES).optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(1000).optional(),
  date: z.string().datetime().optional(),
  createdBy: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
