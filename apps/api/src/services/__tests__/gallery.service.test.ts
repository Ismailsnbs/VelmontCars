import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GalleryService } from '../gallery.service';
import { NotFoundError, ConflictError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Mocks
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    gallery: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../audit.service', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const mockGallery = {
  id: 'gallery-1',
  name: 'Test Galerisi',
  slug: 'test-galerisi',
  address: 'Lefkosa Cd. No:1',
  city: 'Lefkosa',
  phone: '+90 392 111 1111',
  email: 'info@testgaleri.com',
  logo: null,
  subscription: 'BASIC',
  isActive: true,
  subscriptionEnds: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  _count: {
    users: 3,
    vehicles: 10,
    products: 5,
    customers: 20,
  },
};

const defaultParams = {
  page: 1,
  limit: 10,
  skip: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('GalleryService', () => {
  let service: GalleryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GalleryService();
  });

  // ---------------------------------------------------------------- //
  // getAll
  // ---------------------------------------------------------------- //
  describe('getAll', () => {
    it('should return data and total with default params', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([mockGallery] as any);
      vi.mocked(prisma.gallery.count).mockResolvedValue(1);

      const result = await service.getAll(defaultParams);

      expect(result.data).toEqual([mockGallery]);
      expect(result.total).toBe(1);
    });

    it('should call findMany with correct skip and take', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, skip: 30, limit: 15 });

      expect(prisma.gallery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 30, take: 15 }),
      );
    });

    it('should filter by isActive when provided', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, isActive: true });

      expect(prisma.gallery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('should filter by subscription when provided', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, subscription: 'PREMIUM' });

      expect(prisma.gallery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ subscription: 'PREMIUM' }) }),
      );
    });

    it('should build OR search clause for name, slug, and city when search is provided', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      await service.getAll({ ...defaultParams, search: 'Test' });

      const call = vi.mocked(prisma.gallery.findMany).mock.calls[0][0] as any;
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(3);
    });

    it('should include _count for users, vehicles, products, customers', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      await service.getAll(defaultParams);

      expect(prisma.gallery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                users: true,
                vehicles: true,
                products: true,
                customers: true,
              }),
            }),
          }),
        }),
      );
    });

    it('should return empty data when no galleries exist', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      const result = await service.getAll(defaultParams);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should not add isActive filter when isActive is undefined', async () => {
      vi.mocked(prisma.gallery.findMany).mockResolvedValue([]);
      vi.mocked(prisma.gallery.count).mockResolvedValue(0);

      await service.getAll(defaultParams);

      const call = vi.mocked(prisma.gallery.findMany).mock.calls[0][0] as any;
      expect(call.where.isActive).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the gallery when found', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      const result = await service.getById('gallery-1');

      expect(result).toEqual(mockGallery);
    });

    it('should call findUnique with the correct id', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      await service.getById('gallery-1');

      expect(prisma.gallery.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'gallery-1' } }),
      );
    });

    it('should throw NotFoundError when gallery does not exist', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should include the id in the error message', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);

      await expect(service.getById('bad-id')).rejects.toThrow('bad-id');
    });

    it('should include _count in the findUnique query', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      await service.getById('gallery-1');

      expect(prisma.gallery.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.any(Object),
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // create
  // ---------------------------------------------------------------- //
  describe('create', () => {
    const createInput = {
      name: 'Yeni Galeri',
      city: 'Gazimağusa',
      phone: '+90 392 222 2222',
    };

    it('should create and return the new gallery', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      const result = await service.create(createInput, 'admin@test.com');

      expect(result).toEqual(mockGallery);
    });

    it('should generate a slug from the gallery name', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      await service.create({ name: 'Yeni Galeri' }, 'admin@test.com');

      expect(prisma.gallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'yeni-galeri' }),
        }),
      );
    });

    it('should replace spaces with hyphens in slug', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      await service.create({ name: 'My Test Gallery Here' }, 'admin@test.com');

      const call = vi.mocked(prisma.gallery.create).mock.calls[0][0] as any;
      expect(call.data.slug).toBe('my-test-gallery-here');
    });

    it('should check if slug already exists before creating', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      await service.create({ name: 'Yeni Galeri' }, 'admin@test.com');

      expect(prisma.gallery.findUnique).toHaveBeenCalledWith({ where: { slug: 'yeni-galeri' } });
    });

    it('should throw ConflictError when a gallery with the same slug already exists', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      await expect(service.create({ name: 'Test Galerisi' }, 'admin@test.com')).rejects.toThrow(ConflictError);
    });

    it('should include the slug in the ConflictError message', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      await expect(service.create({ name: 'Test Galerisi' }, 'admin@test.com')).rejects.toThrow('test-galerisi');
    });

    it('should not call prisma.create when slug conflict exists', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      await expect(service.create({ name: 'Test Galerisi' }, 'admin@test.com')).rejects.toThrow();
      expect(prisma.gallery.create).not.toHaveBeenCalled();
    });

    it('should default subscription to BASIC when not provided', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      await service.create({ name: 'Yeni Galeri' }, 'admin@test.com');

      expect(prisma.gallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subscription: 'BASIC' }),
        }),
      );
    });

    it('should always set isActive to true on creation', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      await service.create({ name: 'Yeni Galeri' }, 'admin@test.com');

      expect(prisma.gallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should use provided subscription plan when specified', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.gallery.create).mockResolvedValue(mockGallery as any);

      await service.create({ name: 'Premium Galeri', subscription: 'PREMIUM' }, 'admin@test.com');

      expect(prisma.gallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subscription: 'PREMIUM' }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // update
  // ---------------------------------------------------------------- //
  describe('update', () => {
    it('should return the updated gallery', async () => {
      const updated = { ...mockGallery, name: 'Güncellenmiş Galeri', slug: 'guncellenmis-galeri' };
      vi.mocked(prisma.gallery.findUnique)
        .mockResolvedValueOnce(mockGallery as any)  // existing
        .mockResolvedValueOnce(null);               // slug uniqueness
      vi.mocked(prisma.gallery.update).mockResolvedValue(updated as any);

      const result = await service.update('gallery-1', { name: 'Güncellenmiş Galeri' }, 'admin@test.com');

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when gallery does not exist', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' }, 'admin@test.com')).rejects.toThrow(NotFoundError);
    });

    it('should regenerate slug when name changes', async () => {
      vi.mocked(prisma.gallery.findUnique)
        .mockResolvedValueOnce(mockGallery as any)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.gallery.update).mockResolvedValue({ ...mockGallery, slug: 'yeni-galeri' } as any);

      await service.update('gallery-1', { name: 'Yeni Galeri' }, 'admin@test.com');

      expect(prisma.gallery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'yeni-galeri' }),
        }),
      );
    });

    it('should check new slug uniqueness when name changes', async () => {
      vi.mocked(prisma.gallery.findUnique)
        .mockResolvedValueOnce(mockGallery as any)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.gallery.update).mockResolvedValue(mockGallery as any);

      await service.update('gallery-1', { name: 'Yeni Galeri' }, 'admin@test.com');

      expect(prisma.gallery.findUnique).toHaveBeenCalledWith({ where: { slug: 'yeni-galeri' } });
    });

    it('should throw ConflictError when new slug conflicts with another gallery', async () => {
      const conflicting = { ...mockGallery, id: 'gallery-2', slug: 'yeni-galeri' };
      vi.mocked(prisma.gallery.findUnique)
        .mockResolvedValueOnce(mockGallery as any)
        .mockResolvedValueOnce(conflicting as any);

      await expect(service.update('gallery-1', { name: 'Yeni Galeri' }, 'admin@test.com')).rejects.toThrow(
        ConflictError,
      );
    });

    it('should allow update when slug belongs to the same gallery', async () => {
      // Same gallery returned in slug check — should not conflict
      vi.mocked(prisma.gallery.findUnique)
        .mockResolvedValueOnce(mockGallery as any)
        .mockResolvedValueOnce({ ...mockGallery, slug: 'test-galerisi' } as any);
      vi.mocked(prisma.gallery.update).mockResolvedValue(mockGallery as any);

      await expect(
        service.update('gallery-1', { name: 'Test Galerisi' }, 'admin@test.com'),
      ).resolves.toBeDefined();
    });

    it('should not check slug when name is not being updated', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);
      vi.mocked(prisma.gallery.update).mockResolvedValue(mockGallery as any);

      await service.update('gallery-1', { city: 'Girne' }, 'admin@test.com');

      // Only one findUnique (existing check) — no slug check
      expect(prisma.gallery.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should pass subscriptionEnds as a Date object when provided as string', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);
      vi.mocked(prisma.gallery.update).mockResolvedValue(mockGallery as any);

      await service.update('gallery-1', { subscriptionEnds: '2025-12-31' }, 'admin@test.com');

      const call = vi.mocked(prisma.gallery.update).mock.calls[0][0] as any;
      expect(call.data.subscriptionEnds).toBeInstanceOf(Date);
    });
  });

  // ---------------------------------------------------------------- //
  // delete (soft delete)
  // ---------------------------------------------------------------- //
  describe('delete', () => {
    it('should soft delete the gallery by setting isActive to false', async () => {
      const deactivated = { ...mockGallery, isActive: false };
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);
      vi.mocked(prisma.gallery.update).mockResolvedValue(deactivated as any);

      const result = await service.delete('gallery-1', 'admin@test.com');

      expect(result).toEqual({ id: 'gallery-1', isActive: false });
    });

    it('should throw NotFoundError when gallery does not exist', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);

      await expect(service.delete('bad-id', 'admin@test.com')).rejects.toThrow(NotFoundError);
    });

    it('should include the id in the NotFoundError message', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);

      await expect(service.delete('bad-id', 'admin@test.com')).rejects.toThrow('bad-id');
    });

    it('should call prisma.gallery.update with isActive: false (not prisma.delete)', async () => {
      const deactivated = { ...mockGallery, isActive: false };
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);
      vi.mocked(prisma.gallery.update).mockResolvedValue(deactivated as any);

      await service.delete('gallery-1', 'admin@test.com');

      expect(prisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 'gallery-1' },
        data: { isActive: false },
      });
      expect(prisma.gallery.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- //
  // getStats
  // ---------------------------------------------------------------- //
  describe('getStats', () => {
    it('should return stats for an existing gallery', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      const result = await service.getStats('gallery-1');

      expect(result).toEqual({
        id: 'gallery-1',
        name: 'Test Galerisi',
        usersCount: 3,
        vehiclesCount: 10,
        productsCount: 5,
        customersCount: 20,
      });
    });

    it('should throw NotFoundError when gallery does not exist', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(null);

      await expect(service.getStats('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('should include the id in the stats result', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      const result = await service.getStats('gallery-1');

      expect(result.id).toBe('gallery-1');
    });

    it('should include the gallery name in the stats result', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      const result = await service.getStats('gallery-1');

      expect(result.name).toBe('Test Galerisi');
    });

    it('should map _count.users to usersCount', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      const result = await service.getStats('gallery-1');

      expect(result.usersCount).toBe(mockGallery._count.users);
    });

    it('should map _count.vehicles to vehiclesCount', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      const result = await service.getStats('gallery-1');

      expect(result.vehiclesCount).toBe(mockGallery._count.vehicles);
    });

    it('should return zero counts when gallery has no related records', async () => {
      const emptyGallery = { ...mockGallery, _count: { users: 0, vehicles: 0, products: 0, customers: 0 } };
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(emptyGallery as any);

      const result = await service.getStats('gallery-1');

      expect(result.usersCount).toBe(0);
      expect(result.vehiclesCount).toBe(0);
      expect(result.productsCount).toBe(0);
      expect(result.customersCount).toBe(0);
    });

    it('should query with _count include for all entity types', async () => {
      vi.mocked(prisma.gallery.findUnique).mockResolvedValue(mockGallery as any);

      await service.getStats('gallery-1');

      expect(prisma.gallery.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                users: true,
                vehicles: true,
                products: true,
                customers: true,
              }),
            }),
          }),
        }),
      );
    });
  });
});
