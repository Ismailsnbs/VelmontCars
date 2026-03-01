// Vehicle Document validation schemas
import { z } from 'zod';

const DOCUMENT_TYPES = [
  'REGISTRATION',
  'INVOICE',
  'CUSTOMS',
  'INSPECTION',
  'INSURANCE',
  'SHIPPING',
  'OTHER',
] as const;

export const vehicleIdParamSchema = z.object({
  vehicleId: z.string().cuid(),
});

export const documentIdParamSchema = z.object({
  vehicleId: z.string().cuid(),
  documentId: z.string().cuid(),
});

export const createDocumentSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().optional(),
  uploadedBy: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
