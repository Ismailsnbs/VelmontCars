import { z } from 'zod';

// Reorder: client sends an ordered array of image IDs (cuid format)
export const reorderSchema = z.object({
  imageIds: z
    .array(z.string().cuid({ message: 'Each imageId must be a valid CUID' }))
    .min(1, { message: 'imageIds must contain at least one ID' }),
});

export type ReorderInput = z.infer<typeof reorderSchema>;

// vehicleId + imageId params used across image sub-routes
export const vehicleImageParamsSchema = z.object({
  vehicleId: z.string().cuid({ message: 'vehicleId must be a valid CUID' }),
  imageId: z.string().cuid({ message: 'imageId must be a valid CUID' }),
});

// vehicleId-only param (used for list, upload, bulk upload, and reorder)
export const vehicleParamSchema = z.object({
  vehicleId: z.string().cuid({ message: 'vehicleId must be a valid CUID' }),
});

export type VehicleImageParams = z.infer<typeof vehicleImageParamsSchema>;
export type VehicleParam = z.infer<typeof vehicleParamSchema>;
