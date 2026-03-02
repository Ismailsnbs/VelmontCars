import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.string().min(1).max(500),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
