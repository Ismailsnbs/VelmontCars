// Stock Count (Inventory) validation schemas
import { z } from 'zod';

export const stockCountItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  countedQuantity: z.number().min(0, 'Counted quantity must be >= 0'),
});

export const stockCountSchema = z.object({
  items: z
    .array(stockCountItemSchema)
    .min(1, 'At least one item is required for stock count'),
});

export type StockCountItem = z.infer<typeof stockCountItemSchema>;
export type StockCountInput = z.infer<typeof stockCountSchema>;
