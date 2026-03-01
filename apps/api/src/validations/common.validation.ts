import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const codeParamSchema = z.object({
  code: z.string().min(1).max(10),
});
