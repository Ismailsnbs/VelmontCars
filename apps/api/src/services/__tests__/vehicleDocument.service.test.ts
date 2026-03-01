import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VehicleDocumentService } from '../vehicleDocument.service';
import { NotFoundError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Mocks
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    vehicle: {
      findFirst: vi.fn(),
    },
    vehicleDocument: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-abc';
const OTHER_GALLERY_ID = 'gallery-xyz';
const VEHICLE_ID = 'vehicle-001';
const DOCUMENT_ID = 'doc-001';

const mockVehicle = {
  id: VEHICLE_ID,
  galleryId: GALLERY_ID,
  brand: 'Toyota',
  model: 'Corolla',
};

const mockDocument = {
  id: DOCUMENT_ID,
  type: 'INVOICE',
  fileName: 'invoice.pdf',
  fileUrl: 'https://cloudinary.com/invoice.pdf',
  fileSize: 204800,
  vehicleId: VEHICLE_ID,
  uploadedBy: 'user-1',
  uploadedAt: new Date('2024-06-01T10:00:00Z'),
};

const mockDocumentWithVehicle = {
  ...mockDocument,
  vehicle: {
    id: VEHICLE_ID,
    galleryId: GALLERY_ID,
  },
};

const createInput = {
  type: 'INVOICE' as const,
  fileName: 'invoice.pdf',
  fileUrl: 'https://cloudinary.com/invoice.pdf',
  fileSize: 204800,
  uploadedBy: 'user-1',
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('VehicleDocumentService', () => {
  let service: VehicleDocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VehicleDocumentService();
  });

  // ---------------------------------------------------------------- //
  // getByVehicleId
  // ---------------------------------------------------------------- //
  describe('getByVehicleId', () => {
    it('should return documents when vehicle belongs to gallery', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.findMany).mockResolvedValue([mockDocument] as any);

      const result = await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual([mockDocument]);
    });

    it('should return empty array when vehicle has no documents', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.findMany).mockResolvedValue([]);

      const result = await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundError when vehicle does not exist', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId('nonexistent-vehicle', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include vehicleId in the NotFoundError message', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId('nonexistent-vehicle', GALLERY_ID)).rejects.toThrow(
        'nonexistent-vehicle',
      );
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery', async () => {
      // vehicle.findFirst returns null because galleryId does not match
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should filter vehicle lookup by both vehicleId and galleryId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
      });
    });

    it('should query documents ordered by uploadedAt descending', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { uploadedAt: 'desc' },
        }),
      );
    });

    it('should scope the document query to the given vehicleId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicleId: VEHICLE_ID },
        }),
      );
    });

    it('should not call findMany when vehicle is not found', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId(VEHICLE_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleDocument.findMany).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    it('should create and return the new document', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.create).mockResolvedValue(mockDocument as any);

      const result = await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundError when vehicle does not exist', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, 'nonexistent-vehicle', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when vehicle belongs to a different gallery', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include vehicleId in the NotFoundError message on create', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, 'missing-vehicle', GALLERY_ID)).rejects.toThrow(
        'missing-vehicle',
      );
    });

    it('should pass all input fields to prisma.vehicleDocument.create', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.create).mockResolvedValue(mockDocument as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleDocument.create).toHaveBeenCalledWith({
        data: {
          type: createInput.type,
          fileName: createInput.fileName,
          fileUrl: createInput.fileUrl,
          fileSize: createInput.fileSize,
          vehicleId: VEHICLE_ID,
          uploadedBy: createInput.uploadedBy,
        },
      });
    });

    it('should link document to the vehicleId provided as argument', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.create).mockResolvedValue(mockDocument as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      const callData = vi.mocked(prisma.vehicleDocument.create).mock.calls[0][0] as any;
      expect(callData.data.vehicleId).toBe(VEHICLE_ID);
    });

    it('should handle optional fileSize and uploadedBy fields as undefined', async () => {
      const minimalInput = {
        type: 'REGISTRATION' as const,
        fileName: 'reg.pdf',
        fileUrl: 'https://cloudinary.com/reg.pdf',
      };

      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.create).mockResolvedValue({
        ...mockDocument,
        type: 'REGISTRATION',
        fileSize: undefined,
        uploadedBy: undefined,
      } as any);

      const result = await service.create(minimalInput, VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicleDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'REGISTRATION',
          fileSize: undefined,
          uploadedBy: undefined,
        }),
      });
      expect(result).toBeDefined();
    });

    it('should not call prisma.vehicleDocument.create when vehicle is not found', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.create(createInput, VEHICLE_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleDocument.create).not.toHaveBeenCalled();
    });

    it('should verify vehicle gallery ownership with both id and galleryId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleDocument.create).mockResolvedValue(mockDocument as any);

      await service.create(createInput, VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should delete the document and return its id', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(mockDocumentWithVehicle as any);
      vi.mocked(prisma.vehicleDocument.delete).mockResolvedValue(mockDocument as any);

      const result = await service.delete(DOCUMENT_ID, GALLERY_ID);

      expect(result).toEqual({ id: DOCUMENT_ID });
    });

    it('should throw NotFoundError when document does not exist', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(null);

      await expect(service.delete('nonexistent-doc', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include documentId in the NotFoundError message when document is missing', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(null);

      await expect(service.delete('nonexistent-doc', GALLERY_ID)).rejects.toThrow('nonexistent-doc');
    });

    it('should throw NotFoundError when document belongs to a vehicle in a different gallery', async () => {
      const foreignDocument = {
        ...mockDocumentWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(foreignDocument as any);

      await expect(service.delete(DOCUMENT_ID, GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include gallery ownership message in NotFoundError for wrong gallery', async () => {
      const foreignDocument = {
        ...mockDocumentWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(foreignDocument as any);

      await expect(service.delete(DOCUMENT_ID, GALLERY_ID)).rejects.toThrow('does not belong to this gallery');
    });

    it('should call prisma.vehicleDocument.delete with the correct documentId', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(mockDocumentWithVehicle as any);
      vi.mocked(prisma.vehicleDocument.delete).mockResolvedValue(mockDocument as any);

      await service.delete(DOCUMENT_ID, GALLERY_ID);

      expect(prisma.vehicleDocument.delete).toHaveBeenCalledWith({
        where: { id: DOCUMENT_ID },
      });
    });

    it('should not call prisma.vehicleDocument.delete when document is not found', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(null);

      await expect(service.delete(DOCUMENT_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleDocument.delete).not.toHaveBeenCalled();
    });

    it('should not call prisma.vehicleDocument.delete when gallery ownership check fails', async () => {
      const foreignDocument = {
        ...mockDocumentWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(foreignDocument as any);

      await expect(service.delete(DOCUMENT_ID, GALLERY_ID)).rejects.toThrow();
      expect(prisma.vehicleDocument.delete).not.toHaveBeenCalled();
    });

    it('should fetch document with vehicle galleryId included for ownership check', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(mockDocumentWithVehicle as any);
      vi.mocked(prisma.vehicleDocument.delete).mockResolvedValue(mockDocument as any);

      await service.delete(DOCUMENT_ID, GALLERY_ID);

      expect(prisma.vehicleDocument.findFirst).toHaveBeenCalledWith({
        where: { id: DOCUMENT_ID },
        include: {
          vehicle: {
            select: { id: true, galleryId: true },
          },
        },
      });
    });

    it('should succeed when galleryId matches the vehicle owner gallery exactly', async () => {
      vi.mocked(prisma.vehicleDocument.findFirst).mockResolvedValue(mockDocumentWithVehicle as any);
      vi.mocked(prisma.vehicleDocument.delete).mockResolvedValue(mockDocument as any);

      await expect(service.delete(DOCUMENT_ID, GALLERY_ID)).resolves.toEqual({ id: DOCUMENT_ID });
    });
  });
});
