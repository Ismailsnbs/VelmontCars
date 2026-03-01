// VehicleDocument CRUD service — gallery-scoped (multi-tenant)
import prisma from '../lib/prisma';
import { NotFoundError } from '../middleware/error.middleware';
import { CreateDocumentInput } from '../validations/vehicleDocument.validation';

export class VehicleDocumentService {
  // ─── List documents by vehicle ────────────────────────────────────────

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

    const documents = await prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  }

  // ─── Create document ─────────────────────────────────────────────────

  async create(input: CreateDocumentInput, vehicleId: string, galleryId: string) {
    // Verify vehicle exists and belongs to gallery
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, galleryId },
    });

    if (!vehicle) {
      throw new NotFoundError(
        `Vehicle with ID ${vehicleId} not found or does not belong to this gallery`
      );
    }

    const document = await prisma.vehicleDocument.create({
      data: {
        type: input.type,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        vehicleId,
        uploadedBy: input.uploadedBy,
      },
    });

    return document;
  }

  // ─── Delete document ─────────────────────────────────────────────────

  async delete(documentId: string, galleryId: string) {
    // Verify document exists and belongs to this gallery's vehicle
    const document = await prisma.vehicleDocument.findFirst({
      where: { id: documentId },
      include: {
        vehicle: {
          select: { id: true, galleryId: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundError(`Document with ID ${documentId} not found`);
    }

    if (document.vehicle.galleryId !== galleryId) {
      throw new NotFoundError(
        `Document does not belong to this gallery`
      );
    }

    await prisma.vehicleDocument.delete({
      where: { id: documentId },
    });

    return { id: documentId };
  }
}

export const vehicleDocumentService = new VehicleDocumentService();
