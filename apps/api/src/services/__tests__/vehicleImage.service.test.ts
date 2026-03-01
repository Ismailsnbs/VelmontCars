import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VehicleImageService } from '../vehicleImage.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    vehicleImage: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    vehicle: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((ops) =>
      Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(ops)
    ),
  },
}));

// ------------------------------------------------------------------ //
// Cloudinary mock
// The service uses upload_stream (not upload). We mock the entire
// config module so cloudinaryConfigured can be toggled per-test.
// ------------------------------------------------------------------ //

vi.mock('../../config/cloudinary', () => ({
  cloudinaryConfigured: true,
  cloudinary: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

import prisma from '../../lib/prisma';
import * as cloudinaryConfig from '../../config/cloudinary';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const VEHICLE_ID = 'vehicle-ccc-333';
const IMAGE_ID_1 = 'image-ddd-444';
const IMAGE_ID_2 = 'image-eee-555';
const IMAGE_ID_3 = 'image-fff-666';

const mockVehicle = {
  id: VEHICLE_ID,
  galleryId: GALLERY_ID,
};

const mockImage = {
  id: IMAGE_ID_1,
  url: 'https://res.cloudinary.com/demo/image/upload/v1/gallery/vehicles/vehicle-ccc-333/abc.jpg',
  publicId: 'gallery/vehicles/vehicle-ccc-333/abc',
  isMain: false,
  order: 0,
  vehicleId: VEHICLE_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockMainImage = {
  ...mockImage,
  id: IMAGE_ID_2,
  isMain: true,
  order: 1,
};

const mockImageWithVehicle = {
  ...mockImage,
  vehicle: { id: VEHICLE_ID, galleryId: GALLERY_ID },
};

const mockMainImageWithVehicle = {
  ...mockMainImage,
  vehicle: { id: VEHICLE_ID, galleryId: GALLERY_ID },
};

/**
 * Creates a minimal Express.Multer.File-compatible object.
 */
function makeFile(name = 'photo.jpg'): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 16,
    // The remaining fields are not used by the service but satisfy the type
    stream: null as any,
    destination: '',
    filename: name,
    path: '',
  };
}

/**
 * Configures the upload_stream mock to call its callback with a successful
 * Cloudinary-like result, then returns a writable stream stub.
 */
function mockSuccessfulUpload(url: string, publicId: string) {
  (vi.mocked(cloudinaryConfig.cloudinary.uploader.upload_stream).mockImplementation as any)(
    (_options: any, callback: any) => {
      // Call the callback asynchronously (simulates stream completion)
      process.nextTick(() => callback(null, { secure_url: url, public_id: publicId }));

      // Return a writable stream stub that accepts data
      const { Writable } = require('stream');
      const ws = new Writable({ write(_chunk: any, _enc: any, done: any) { done(); } });
      return ws;
    }
  );
}

/**
 * Configures the upload_stream mock to call its callback with an error.
 */
function mockFailedUpload(message: string) {
  (vi.mocked(cloudinaryConfig.cloudinary.uploader.upload_stream).mockImplementation as any)(
    (_options: any, callback: any) => {
      process.nextTick(() => callback({ message }, undefined));

      const { Writable } = require('stream');
      const ws = new Writable({ write(_chunk: any, _enc: any, done: any) { done(); } });
      return ws;
    }
  );
}

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('VehicleImageService', () => {
  let service: VehicleImageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VehicleImageService();
  });

  // ---------------------------------------------------------------- //
  // getByVehicleId
  // ---------------------------------------------------------------- //
  describe('getByVehicleId', () => {
    it('should return images ordered by isMain desc then order asc when vehicle belongs to gallery', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findMany).mockResolvedValue([mockMainImage, mockImage] as any);

      const result = await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual([mockMainImage, mockImage]);
      expect(prisma.vehicleImage.findMany).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID },
        orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
      });
    });

    it('should return empty array when vehicle has no images', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findMany).mockResolvedValue([]);

      const result = await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(result).toEqual([]);
    });

    it('should verify ownership by querying vehicle with both vehicleId and galleryId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findMany).mockResolvedValue([]);

      await service.getByVehicleId(VEHICLE_ID, GALLERY_ID);

      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
        select: { id: true },
      });
    });

    it('should throw NotFoundError when vehicle does not belong to gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.vehicleImage.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when vehicle does not exist', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId('non-existent', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include vehicleId in the NotFoundError message when ownership fails', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(service.getByVehicleId(VEHICLE_ID, OTHER_GALLERY_ID)).rejects.toThrow(VEHICLE_ID);
    });
  });

  // ---------------------------------------------------------------- //
  // uploadAndCreate
  // ---------------------------------------------------------------- //
  describe('uploadAndCreate', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1/gallery/vehicles/vehicle-ccc-333/xyz.jpg';
    const cloudinaryPublicId = 'gallery/vehicles/vehicle-ccc-333/xyz';

    it('should upload to Cloudinary and create a DB record with returned url and publicId', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null); // no existing images
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue(mockImage as any);
      mockSuccessfulUpload(cloudinaryUrl, cloudinaryPublicId);

      const result = await service.uploadAndCreate(makeFile(), VEHICLE_ID, GALLERY_ID, false);

      expect(result).toEqual(mockImage);
      expect(prisma.vehicleImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: cloudinaryUrl,
            publicId: cloudinaryPublicId,
            vehicleId: VEHICLE_ID,
          }),
        })
      );
    });

    it('should set order to 0 when there are no existing images', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue(mockImage as any);
      mockSuccessfulUpload(cloudinaryUrl, cloudinaryPublicId);

      await service.uploadAndCreate(makeFile(), VEHICLE_ID, GALLERY_ID, false);

      const call = vi.mocked(prisma.vehicleImage.create).mock.calls[0][0] as any;
      expect(call.data.order).toBe(0);
    });

    it('should set order to lastImage.order + 1 when images already exist', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue({ order: 4 } as any);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue({ ...mockImage, order: 5 } as any);
      mockSuccessfulUpload(cloudinaryUrl, cloudinaryPublicId);

      await service.uploadAndCreate(makeFile(), VEHICLE_ID, GALLERY_ID, false);

      const call = vi.mocked(prisma.vehicleImage.create).mock.calls[0][0] as any;
      expect(call.data.order).toBe(5);
    });

    it('should clear existing main flags and set isMain true when isMain param is true', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue({ ...mockImage, isMain: true } as any);
      mockSuccessfulUpload(cloudinaryUrl, cloudinaryPublicId);

      await service.uploadAndCreate(makeFile(), VEHICLE_ID, GALLERY_ID, true);

      expect(prisma.vehicleImage.updateMany).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID, isMain: true },
        data: { isMain: false },
      });
      const call = vi.mocked(prisma.vehicleImage.create).mock.calls[0][0] as any;
      expect(call.data.isMain).toBe(true);
    });

    it('should not call updateMany when isMain is false', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue(mockImage as any);
      mockSuccessfulUpload(cloudinaryUrl, cloudinaryPublicId);

      await service.uploadAndCreate(makeFile(), VEHICLE_ID, GALLERY_ID, false);

      expect(prisma.vehicleImage.updateMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when Cloudinary upload fails', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      mockFailedUpload('Cloudinary upload failed: bad credentials');

      await expect(service.uploadAndCreate(makeFile(), VEHICLE_ID, GALLERY_ID)).rejects.toThrow(
        BadRequestError
      );
      expect(prisma.vehicleImage.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when vehicle does not belong to gallery', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(
        service.uploadAndCreate(makeFile(), VEHICLE_ID, OTHER_GALLERY_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------- //
  // bulkUpload
  // ---------------------------------------------------------------- //
  describe('bulkUpload', () => {
    const url1 = 'https://res.cloudinary.com/demo/image/upload/v1/bulk/img1.jpg';
    const url2 = 'https://res.cloudinary.com/demo/image/upload/v1/bulk/img2.jpg';
    const pid1 = 'gallery/vehicles/vehicle-ccc-333/img1';
    const pid2 = 'gallery/vehicles/vehicle-ccc-333/img2';

    it('should throw BadRequestError immediately when files array is empty', async () => {
      await expect(service.bulkUpload([], VEHICLE_ID, GALLERY_ID)).rejects.toThrow(BadRequestError);
      expect(prisma.vehicle.findFirst).not.toHaveBeenCalled();
    });

    it('should include descriptive message in BadRequestError for empty files array', async () => {
      await expect(service.bulkUpload([], VEHICLE_ID, GALLERY_ID)).rejects.toThrow(
        'No files provided for bulk upload'
      );
    });

    it('should verify gallery ownership before processing files', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(
        service.bulkUpload([makeFile()], VEHICLE_ID, OTHER_GALLERY_ID)
      ).rejects.toThrow(NotFoundError);
    });

    it('should upload all files and return an array of created images', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      // No existing main, no existing images
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 0 } as any);

      const created1 = { ...mockImage, id: IMAGE_ID_1, order: 0, isMain: true };
      const created2 = { ...mockImage, id: IMAGE_ID_2, order: 1, isMain: false };
      vi.mocked(prisma.vehicleImage.create)
        .mockResolvedValueOnce(created1 as any)
        .mockResolvedValueOnce(created2 as any);

      // Alternate upload results per call
      const uploadMock = vi.mocked(cloudinaryConfig.cloudinary.uploader.upload_stream) as any;
      uploadMock
        .mockImplementationOnce((_opts: any, cb: any) => {
          process.nextTick(() => cb(null, { secure_url: url1, public_id: pid1 }));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        })
        .mockImplementationOnce((_opts: any, cb: any) => {
          process.nextTick(() => cb(null, { secure_url: url2, public_id: pid2 }));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        });

      const result = await service.bulkUpload([makeFile('a.jpg'), makeFile('b.jpg')], VEHICLE_ID, GALLERY_ID);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(created1);
      expect(result[1]).toEqual(created2);
    });

    it('should set isMain true on the first file when no existing main image', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null); // no existing main
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue({ ...mockImage, isMain: true } as any);
      mockSuccessfulUpload(url1, pid1);

      await service.bulkUpload([makeFile()], VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleImage.create).mock.calls[0][0] as any;
      expect(call.data.isMain).toBe(true);
    });

    it('should NOT set isMain on the first file when a main image already exists', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      // First findFirst call = existingMain check, second = lastImage check
      vi.mocked(prisma.vehicleImage.findFirst)
        .mockResolvedValueOnce({ id: IMAGE_ID_2 } as any) // existing main found
        .mockResolvedValueOnce({ order: 3 } as any);      // lastImage
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue(mockImage as any);
      mockSuccessfulUpload(url1, pid1);

      await service.bulkUpload([makeFile()], VEHICLE_ID, GALLERY_ID);

      const call = vi.mocked(prisma.vehicleImage.create).mock.calls[0][0] as any;
      expect(call.data.isMain).toBe(false);
    });

    it('should assign incrementing order values across bulk files', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.vehicleImage.create)
        .mockResolvedValueOnce({ ...mockImage, order: 0 } as any)
        .mockResolvedValueOnce({ ...mockImage, order: 1 } as any);

      const uploadMock2 = vi.mocked(cloudinaryConfig.cloudinary.uploader.upload_stream) as any;
      uploadMock2
        .mockImplementationOnce((_opts: any, cb: any) => {
          process.nextTick(() => cb(null, { secure_url: url1, public_id: pid1 }));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        })
        .mockImplementationOnce((_opts: any, cb: any) => {
          process.nextTick(() => cb(null, { secure_url: url2, public_id: pid2 }));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        });

      await service.bulkUpload([makeFile('a.jpg'), makeFile('b.jpg')], VEHICLE_ID, GALLERY_ID);

      const firstCall = vi.mocked(prisma.vehicleImage.create).mock.calls[0][0] as any;
      const secondCall = vi.mocked(prisma.vehicleImage.create).mock.calls[1][0] as any;
      expect(firstCall.data.order).toBe(0);
      expect(secondCall.data.order).toBe(1);
    });

    it('should skip individual file and continue when one upload fails in bulk', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.vehicleImage.create).mockResolvedValue(mockImage as any);

      // First file fails, second succeeds
      const uploadMock3 = vi.mocked(cloudinaryConfig.cloudinary.uploader.upload_stream) as any;
      uploadMock3
        .mockImplementationOnce((_opts: any, cb: any) => {
          process.nextTick(() => cb({ message: 'upload error' }, undefined));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        })
        .mockImplementationOnce((_opts: any, cb: any) => {
          process.nextTick(() => cb(null, { secure_url: url2, public_id: pid2 }));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        });

      const result = await service.bulkUpload([makeFile('fail.jpg'), makeFile('ok.jpg')], VEHICLE_ID, GALLERY_ID);

      // Only the successful file creates a DB record
      expect(result).toHaveLength(1);
      expect(prisma.vehicleImage.create).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when all individual uploads fail', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);

      (vi.mocked(cloudinaryConfig.cloudinary.uploader.upload_stream).mockImplementation as any)(
        (_opts: any, cb: any) => {
          process.nextTick(() => cb({ message: 'network failure' }, undefined));
          const { Writable } = require('stream');
          return new Writable({ write(_c: any, _e: any, d: any) { d(); } });
        }
      );

      const result = await service.bulkUpload([makeFile(), makeFile()], VEHICLE_ID, GALLERY_ID);

      expect(result).toHaveLength(0);
      expect(prisma.vehicleImage.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- //
  // delete
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    // The service calls prisma.vehicleImage.findFirst TWICE when wasMain=true:
    //   1st call → fetch image by id (with vehicle relation)
    //   2nd call → find next image to promote (after delete)
    // When wasMain=false the 2nd call is not made.

    it('should delete the image from DB and return its id', async () => {
      // non-main image: wasMain=false → no 2nd findFirst call
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(mockImageWithVehicle as any);
      vi.mocked(prisma.vehicleImage.delete).mockResolvedValue(mockImage as any);

      const result = await service.delete(IMAGE_ID_1, GALLERY_ID);

      expect(result).toEqual({ id: IMAGE_ID_1 });
      expect(prisma.vehicleImage.delete).toHaveBeenCalledWith({ where: { id: IMAGE_ID_1 } });
    });

    it('should call Cloudinary destroy when image has a publicId', async () => {
      // non-main, so only one findFirst call needed
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(mockImageWithVehicle as any);
      vi.mocked(prisma.vehicleImage.delete).mockResolvedValue(mockImage as any);
      vi.mocked(cloudinaryConfig.cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      await service.delete(IMAGE_ID_1, GALLERY_ID);

      expect(cloudinaryConfig.cloudinary.uploader.destroy).toHaveBeenCalledWith(
        mockImage.publicId,
        { resource_type: 'image' }
      );
    });

    it('should NOT call Cloudinary destroy when image has no publicId', async () => {
      const imageWithoutPublicId = { ...mockImageWithVehicle, publicId: null };
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(imageWithoutPublicId as any);
      vi.mocked(prisma.vehicleImage.delete).mockResolvedValue({ ...mockImage, publicId: null } as any);

      await service.delete(IMAGE_ID_1, GALLERY_ID);

      expect(cloudinaryConfig.cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should promote the next image (lowest order) to main when deleted image was main', async () => {
      const nextImage = { ...mockImage, id: IMAGE_ID_3, order: 2 };

      // 1st call: fetch the image (isMain: true)
      // 2nd call: find next image to promote
      vi.mocked(prisma.vehicleImage.findFirst)
        .mockResolvedValueOnce(mockMainImageWithVehicle as any)
        .mockResolvedValueOnce(nextImage as any);

      vi.mocked(prisma.vehicleImage.delete).mockResolvedValue(mockMainImage as any);
      vi.mocked(prisma.vehicleImage.update).mockResolvedValue({ ...nextImage, isMain: true } as any);
      vi.mocked(cloudinaryConfig.cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      await service.delete(IMAGE_ID_2, GALLERY_ID);

      expect(prisma.vehicleImage.update).toHaveBeenCalledWith({
        where: { id: IMAGE_ID_3 },
        data: { isMain: true },
      });
    });

    it('should NOT promote any image when no remaining images exist after deleting main', async () => {
      // 1st call: fetch main image
      // 2nd call: no next image (vehicle had only one image)
      vi.mocked(prisma.vehicleImage.findFirst)
        .mockResolvedValueOnce(mockMainImageWithVehicle as any)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.vehicleImage.delete).mockResolvedValue(mockMainImage as any);
      vi.mocked(cloudinaryConfig.cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      await service.delete(IMAGE_ID_2, GALLERY_ID);

      expect(prisma.vehicleImage.update).not.toHaveBeenCalled();
    });

    it('should NOT promote any image when deleted image was NOT main', async () => {
      // isMain: false → 2nd findFirst never called
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(mockImageWithVehicle as any);
      vi.mocked(prisma.vehicleImage.delete).mockResolvedValue(mockImage as any);
      vi.mocked(cloudinaryConfig.cloudinary.uploader.destroy).mockResolvedValue({ result: 'ok' } as any);

      await service.delete(IMAGE_ID_1, GALLERY_ID);

      expect(prisma.vehicleImage.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when image does not exist', async () => {
      // findFirst returns null → image not found
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);

      await expect(service.delete('non-existent', GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.vehicleImage.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when image belongs to a different gallery (tenant isolation)', async () => {
      const imageFromOtherGallery = {
        ...mockImageWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(imageFromOtherGallery as any);

      await expect(service.delete(IMAGE_ID_1, GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.vehicleImage.delete).not.toHaveBeenCalled();
    });

    it('should include imageId in NotFoundError message when image does not exist', async () => {
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);

      await expect(service.delete('bad-image-id', GALLERY_ID)).rejects.toThrow('bad-image-id');
    });

    it('should delete DB record BEFORE calling Cloudinary destroy', async () => {
      const callOrder: string[] = [];

      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(mockImageWithVehicle as any);
      (vi.mocked(prisma.vehicleImage.delete).mockImplementation as any)(async () => {
        callOrder.push('db-delete');
        return mockImage as any;
      });
      vi.mocked(cloudinaryConfig.cloudinary.uploader.destroy).mockImplementation(async () => {
        callOrder.push('cloudinary-destroy');
        return { result: 'ok' };
      });

      await service.delete(IMAGE_ID_1, GALLERY_ID);

      expect(callOrder).toEqual(['db-delete', 'cloudinary-destroy']);
    });
  });

  // ---------------------------------------------------------------- //
  // setMain
  // ---------------------------------------------------------------- //
  describe('setMain', () => {
    // setMain uses prisma.vehicleImage.findFirst (not prisma.vehicle.findFirst).
    // The $transaction receives an array of already-constructed Prisma promises.
    // We configure $transaction to resolve the array via Promise.all so the
    // underlying updateMany / update mocks are actually invoked.

    function setupSetMainMocks(imageRecord: typeof mockImageWithVehicle) {
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(imageRecord as any);
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.vehicleImage.update).mockResolvedValue({ ...imageRecord, isMain: true } as any);
      vi.mocked(prisma.vehicleImage.findUniqueOrThrow).mockResolvedValue({
        ...imageRecord,
        isMain: true,
      } as any);
      vi.mocked(prisma.$transaction).mockImplementation((ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(ops)
      );
    }

    it('should execute a $transaction to atomically swap main flags', async () => {
      setupSetMainMocks(mockImageWithVehicle);

      await service.setMain(IMAGE_ID_1, GALLERY_ID);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // The argument must be an array (two Prisma operations)
      const txArg = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown;
      expect(Array.isArray(txArg)).toBe(true);
      expect((txArg as unknown[]).length).toBe(2);
    });

    it('should call updateMany to clear existing main flags for the vehicle', async () => {
      setupSetMainMocks(mockImageWithVehicle);

      await service.setMain(IMAGE_ID_1, GALLERY_ID);

      expect(prisma.vehicleImage.updateMany).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID, isMain: true },
        data: { isMain: false },
      });
    });

    it('should call update to mark target image as main', async () => {
      setupSetMainMocks(mockImageWithVehicle);

      await service.setMain(IMAGE_ID_1, GALLERY_ID);

      expect(prisma.vehicleImage.update).toHaveBeenCalledWith({
        where: { id: IMAGE_ID_1 },
        data: { isMain: true },
      });
    });

    it('should return the final state of the image via findUniqueOrThrow', async () => {
      const finalState = { ...mockImageWithVehicle, isMain: true };
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(mockImageWithVehicle as any);
      vi.mocked(prisma.vehicleImage.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.vehicleImage.update).mockResolvedValue(finalState as any);
      vi.mocked(prisma.vehicleImage.findUniqueOrThrow).mockResolvedValue(finalState as any);
      vi.mocked(prisma.$transaction).mockImplementation((ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(ops)
      );

      const result = await service.setMain(IMAGE_ID_1, GALLERY_ID);

      expect(prisma.vehicleImage.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: IMAGE_ID_1 },
      });
      expect(result).toEqual(finalState);
    });

    it('should return image with isMain true after successful setMain', async () => {
      setupSetMainMocks(mockImageWithVehicle);

      const result = await service.setMain(IMAGE_ID_1, GALLERY_ID);

      expect(result.isMain).toBe(true);
    });

    it('should throw NotFoundError when image does not exist', async () => {
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);

      await expect(service.setMain('non-existent', GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when image belongs to a different gallery (tenant isolation)', async () => {
      const imageFromOtherGallery = {
        ...mockImageWithVehicle,
        vehicle: { id: VEHICLE_ID, galleryId: OTHER_GALLERY_ID },
      };
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(imageFromOtherGallery as any);

      await expect(service.setMain(IMAGE_ID_1, GALLERY_ID)).rejects.toThrow(NotFoundError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should include imageId in the NotFoundError message when image is missing', async () => {
      vi.mocked(prisma.vehicleImage.findFirst).mockResolvedValue(null);

      await expect(service.setMain('missing-image-id', GALLERY_ID)).rejects.toThrow(
        'missing-image-id'
      );
    });
  });

  // ---------------------------------------------------------------- //
  // reorder
  // ---------------------------------------------------------------- //
  describe('reorder', () => {
    const imageIds = [IMAGE_ID_2, IMAGE_ID_1, IMAGE_ID_3];

    beforeEach(() => {
      // Ownership check passes
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(mockVehicle as any);
    });

    it('should update sortOrder for each image according to its position in imageIds array', async () => {
      vi.mocked(prisma.vehicleImage.findMany)
        .mockResolvedValueOnce([
          { id: IMAGE_ID_1 },
          { id: IMAGE_ID_2 },
          { id: IMAGE_ID_3 },
        ] as any)          // existing images for validation
        .mockResolvedValueOnce([mockMainImage, mockImage] as any); // final sorted list

      vi.mocked(prisma.vehicleImage.update).mockResolvedValue(mockImage as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : ops
      );

      await service.reorder(VEHICLE_ID, GALLERY_ID, imageIds);

      // $transaction receives one update per imageId
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object), // Prisma promise stubs — we verify via update calls below
        ])
      );
    });

    it('should call prisma.vehicleImage.update once per imageId with correct order index', async () => {
      vi.mocked(prisma.vehicleImage.findMany)
        .mockResolvedValueOnce([
          { id: IMAGE_ID_1 },
          { id: IMAGE_ID_2 },
          { id: IMAGE_ID_3 },
        ] as any)
        .mockResolvedValueOnce([mockImage] as any);
      vi.mocked(prisma.vehicleImage.update).mockResolvedValue(mockImage as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : ops
      );

      await service.reorder(VEHICLE_ID, GALLERY_ID, imageIds);

      expect(prisma.vehicleImage.update).toHaveBeenCalledTimes(imageIds.length);
      expect(prisma.vehicleImage.update).toHaveBeenNthCalledWith(1, {
        where: { id: IMAGE_ID_2 },
        data: { order: 0 },
      });
      expect(prisma.vehicleImage.update).toHaveBeenNthCalledWith(2, {
        where: { id: IMAGE_ID_1 },
        data: { order: 1 },
      });
      expect(prisma.vehicleImage.update).toHaveBeenNthCalledWith(3, {
        where: { id: IMAGE_ID_3 },
        data: { order: 2 },
      });
    });

    it('should return the final image list ordered by isMain desc then order asc', async () => {
      const sortedImages = [mockMainImage, mockImage];
      vi.mocked(prisma.vehicleImage.findMany)
        .mockResolvedValueOnce([{ id: IMAGE_ID_1 }, { id: IMAGE_ID_2 }] as any)
        .mockResolvedValueOnce(sortedImages as any);
      vi.mocked(prisma.vehicleImage.update).mockResolvedValue(mockImage as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : ops
      );

      const result = await service.reorder(VEHICLE_ID, GALLERY_ID, [IMAGE_ID_2, IMAGE_ID_1]);

      expect(result).toEqual(sortedImages);
      const lastFindManyCall = vi.mocked(prisma.vehicleImage.findMany).mock.calls[1][0] as any;
      expect(lastFindManyCall.orderBy).toEqual([{ isMain: 'desc' }, { order: 'asc' }]);
    });

    it('should throw BadRequestError when imageIds contain an ID not belonging to the vehicle', async () => {
      vi.mocked(prisma.vehicleImage.findMany).mockResolvedValueOnce([
        { id: IMAGE_ID_1 },
        { id: IMAGE_ID_2 },
      ] as any); // only two images exist

      const foreignId = 'image-from-another-vehicle';
      await expect(
        service.reorder(VEHICLE_ID, GALLERY_ID, [IMAGE_ID_1, foreignId])
      ).rejects.toThrow(BadRequestError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should include the offending imageId in the BadRequestError message', async () => {
      vi.mocked(prisma.vehicleImage.findMany).mockResolvedValueOnce([
        { id: IMAGE_ID_1 },
      ] as any);

      const foreignId = 'foreign-image-id';
      await expect(
        service.reorder(VEHICLE_ID, GALLERY_ID, [IMAGE_ID_1, foreignId])
      ).rejects.toThrow(foreignId);
    });

    it('should throw NotFoundError when vehicle does not belong to gallery (tenant isolation)', async () => {
      vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null);

      await expect(
        service.reorder(VEHICLE_ID, OTHER_GALLERY_ID, [IMAGE_ID_1])
      ).rejects.toThrow(NotFoundError);
      expect(prisma.vehicleImage.findMany).not.toHaveBeenCalled();
    });

    it('should handle single-image reorder without error', async () => {
      vi.mocked(prisma.vehicleImage.findMany)
        .mockResolvedValueOnce([{ id: IMAGE_ID_1 }] as any)
        .mockResolvedValueOnce([mockImage] as any);
      vi.mocked(prisma.vehicleImage.update).mockResolvedValue(mockImage as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : ops
      );

      const result = await service.reorder(VEHICLE_ID, GALLERY_ID, [IMAGE_ID_1]);

      expect(result).toHaveLength(1);
      expect(prisma.vehicleImage.update).toHaveBeenCalledWith({
        where: { id: IMAGE_ID_1 },
        data: { order: 0 },
      });
    });
  });
});
