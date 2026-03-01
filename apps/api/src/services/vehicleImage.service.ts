// VehicleImage service — Cloudinary upload + gallery-scoped DB operations
import { Readable } from 'stream';
import { UploadApiResponse } from 'cloudinary';
import prisma from '../lib/prisma';
import { cloudinary, cloudinaryConfigured } from '../config/cloudinary';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';

const DEV_PLACEHOLDER_URL = 'https://placehold.co/800x600?text=No+Image';

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Verify that a vehicle exists and belongs to the given gallery.
 * Throws NotFoundError when the check fails.
 */
async function assertVehicleOwnership(
  vehicleId: string,
  galleryId: string
): Promise<void> {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, galleryId },
    select: { id: true },
  });

  if (!vehicle) {
    throw new NotFoundError(
      `Vehicle with ID ${vehicleId} not found or does not belong to this gallery`
    );
  }
}

/**
 * Upload a raw file buffer to Cloudinary and return url + publicId.
 * Falls back to a deterministic placeholder URL when Cloudinary is not
 * configured (development mode).
 */
async function uploadBufferToCloudinary(
  buffer: Buffer,
  vehicleId: string
): Promise<{ url: string; publicId: string | null }> {
  if (!cloudinaryConfigured) {
    // Dev fallback — return a placeholder so the rest of the flow still works
    return { url: DEV_PLACEHOLDER_URL, publicId: null };
  }

  return new Promise((resolve, reject) => {
    const folder = `gallery/vehicles/${vehicleId}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Automatically detect format and optimise quality
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(
            new Error(`Cloudinary upload failed: ${error.message ?? 'unknown error'}`)
          );
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary returned an empty response'));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Pipe the in-memory buffer into the upload stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an asset from Cloudinary by its publicId.
 * Errors are swallowed and logged — a Cloudinary failure must never block the
 * DB delete path.
 */
async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!cloudinaryConfigured) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error(
      `[VehicleImage] Failed to delete Cloudinary asset "${publicId}":`,
      error
    );
  }
}

// ─── Service ──────────────────────────────────────────────────────────────

export class VehicleImageService {
  // ── List ──────────────────────────────────────────────────────────────

  async getByVehicleId(vehicleId: string, galleryId: string) {
    await assertVehicleOwnership(vehicleId, galleryId);

    return prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
    });
  }

  // ── Create (manual — when url is already known) ────────────────────────

  async create(
    input: { url: string; publicId?: string; isMain?: boolean; order?: number },
    vehicleId: string,
    galleryId: string
  ) {
    await assertVehicleOwnership(vehicleId, galleryId);

    // If the new image is to be main, clear the flag on all existing ones first
    if (input.isMain) {
      await prisma.vehicleImage.updateMany({
        where: { vehicleId, isMain: true },
        data: { isMain: false },
      });
    }

    return prisma.vehicleImage.create({
      data: {
        url: input.url,
        publicId: input.publicId ?? null,
        isMain: input.isMain ?? false,
        order: input.order ?? 0,
        vehicleId,
      },
    });
  }

  // ── Upload to Cloudinary + create DB record ───────────────────────────

  async uploadAndCreate(
    file: Express.Multer.File,
    vehicleId: string,
    galleryId: string,
    isMain = false
  ) {
    await assertVehicleOwnership(vehicleId, galleryId);

    let uploadResult: { url: string; publicId: string | null };

    try {
      uploadResult = await uploadBufferToCloudinary(file.buffer, vehicleId);
    } catch (error) {
      // Cloudinary error — do not crash; surface as BadRequestError so the
      // client receives a meaningful message.
      throw new BadRequestError(
        error instanceof Error ? error.message : 'Image upload failed'
      );
    }

    // Determine the next order value
    const lastImage = await prisma.vehicleImage.findFirst({
      where: { vehicleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = lastImage ? lastImage.order + 1 : 0;

    // Unset existing main if needed
    if (isMain) {
      await prisma.vehicleImage.updateMany({
        where: { vehicleId, isMain: true },
        data: { isMain: false },
      });
    }

    return prisma.vehicleImage.create({
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId ?? null,
        isMain,
        order: nextOrder,
        vehicleId,
      },
    });
  }

  // ── Bulk upload ────────────────────────────────────────────────────────

  async bulkUpload(
    files: Express.Multer.File[],
    vehicleId: string,
    galleryId: string
  ) {
    if (files.length === 0) {
      throw new BadRequestError('No files provided for bulk upload');
    }

    await assertVehicleOwnership(vehicleId, galleryId);

    // Determine whether there is already a main image
    const existingMain = await prisma.vehicleImage.findFirst({
      where: { vehicleId, isMain: true },
      select: { id: true },
    });

    // Determine starting order value
    const lastImage = await prisma.vehicleImage.findFirst({
      where: { vehicleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = lastImage ? lastImage.order + 1 : 0;

    const results: Awaited<ReturnType<typeof prisma.vehicleImage.create>>[] = [];
    let firstInBatch = true;

    for (const file of files) {
      let uploadResult: { url: string; publicId: string | null };

      try {
        uploadResult = await uploadBufferToCloudinary(file.buffer, vehicleId);
      } catch (error) {
        // Skip failed individual uploads in bulk — log and continue
        console.error(
          `[VehicleImage] Bulk upload: skipping file "${file.originalname}":`,
          error
        );
        continue;
      }

      // Make the first image of this batch the main image if none exists yet
      const shouldBeMain = firstInBatch && !existingMain;

      if (shouldBeMain) {
        // Clear any remnant main flags just to be safe
        await prisma.vehicleImage.updateMany({
          where: { vehicleId, isMain: true },
          data: { isMain: false },
        });
      }

      const image = await prisma.vehicleImage.create({
        data: {
          url: uploadResult.url,
          publicId: uploadResult.publicId ?? null,
          isMain: shouldBeMain,
          order: nextOrder,
          vehicleId,
        },
      });

      results.push(image);
      nextOrder += 1;
      firstInBatch = false;
    }

    return results;
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async delete(imageId: string, galleryId: string) {
    // Fetch the image and verify gallery ownership via the vehicle relation
    const image = await prisma.vehicleImage.findFirst({
      where: { id: imageId },
      include: {
        vehicle: { select: { id: true, galleryId: true } },
      },
    });

    if (!image) {
      throw new NotFoundError(`Image with ID ${imageId} not found`);
    }

    if (image.vehicle.galleryId !== galleryId) {
      throw new NotFoundError(
        `Image with ID ${imageId} does not belong to this gallery`
      );
    }

    const wasMain = image.isMain;
    const vehicleId = image.vehicleId;

    // Remove from DB first
    await prisma.vehicleImage.delete({ where: { id: imageId } });

    // Remove from Cloudinary asynchronously — errors are swallowed inside helper
    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }

    // If the deleted image was the main one, promote the next image (lowest order)
    if (wasMain) {
      const next = await prisma.vehicleImage.findFirst({
        where: { vehicleId },
        orderBy: { order: 'asc' },
      });

      if (next) {
        await prisma.vehicleImage.update({
          where: { id: next.id },
          data: { isMain: true },
        });
      }
    }

    return { id: imageId };
  }

  // ── Set main image ─────────────────────────────────────────────────────

  async setMain(imageId: string, galleryId: string) {
    // Verify image exists and belongs to this gallery's vehicle
    const image = await prisma.vehicleImage.findFirst({
      where: { id: imageId },
      include: {
        vehicle: { select: { id: true, galleryId: true } },
      },
    });

    if (!image) {
      throw new NotFoundError(`Image with ID ${imageId} not found`);
    }

    if (image.vehicle.galleryId !== galleryId) {
      throw new NotFoundError(
        `Image with ID ${imageId} does not belong to this gallery`
      );
    }

    const vehicleId = image.vehicleId;

    // Unset all existing main flags for this vehicle, then set the target
    await prisma.$transaction([
      prisma.vehicleImage.updateMany({
        where: { vehicleId, isMain: true },
        data: { isMain: false },
      }),
      prisma.vehicleImage.update({
        where: { id: imageId },
        data: { isMain: true },
      }),
    ]);

    return prisma.vehicleImage.findUniqueOrThrow({ where: { id: imageId } });
  }

  // ── Reorder ────────────────────────────────────────────────────────────

  async reorder(vehicleId: string, galleryId: string, imageIds: string[]) {
    await assertVehicleOwnership(vehicleId, galleryId);

    // Verify all supplied IDs actually belong to this vehicle
    const existing = await prisma.vehicleImage.findMany({
      where: { vehicleId },
      select: { id: true },
    });

    const existingSet = new Set(existing.map((img) => img.id));

    for (const id of imageIds) {
      if (!existingSet.has(id)) {
        throw new BadRequestError(
          `Image ID ${id} does not belong to vehicle ${vehicleId}`
        );
      }
    }

    // Update order in a transaction
    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.vehicleImage.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Return the updated list sorted by the new order
    return prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
    });
  }
}

export const vehicleImageService = new VehicleImageService();
