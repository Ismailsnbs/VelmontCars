// Gallery CRUD service
import prisma from '../lib/prisma';
import { auditService } from './audit.service';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';

interface GetAllParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  subscription?: string;
}

interface CreateGalleryInput {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logo?: string;
  subscription?: string;
}

interface UpdateGalleryInput {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logo?: string;
  subscription?: string;
  isActive?: boolean;
  subscriptionEnds?: string;
}

export class GalleryService {
  // Helper: generate slug from name (sanitizes Turkish chars and special characters)
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async getAll(params: GetAllParams) {
    const where: any = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.subscription) {
      where.subscription = params.subscription as any;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          _count: {
            select: {
              users: true,
              vehicles: true,
              products: true,
              customers: true,
            },
          },
        },
      }),
      prisma.gallery.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: string) {
    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    if (!gallery) {
      throw new NotFoundError(`Gallery with ID ${id} not found`);
    }

    return gallery;
  }

  async create(input: CreateGalleryInput, performedBy: string, ipAddress?: string) {
    const slug = this.generateSlug(input.name);

    // Check if slug already exists
    const existingSlug = await prisma.gallery.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictError(`Gallery with slug '${slug}' already exists`);
    }

    const gallery = await prisma.gallery.create({
      data: {
        name: input.name,
        slug,
        address: input.address,
        city: input.city,
        phone: input.phone,
        email: input.email,
        logo: input.logo,
        subscription: (input.subscription || 'BASIC') as any,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    await auditService.log({
      action: 'CREATE',
      entityType: 'Gallery',
      entityId: gallery.id,
      newValues: gallery,
      performedBy,
      ipAddress,
    });

    return gallery;
  }

  async update(id: string, input: UpdateGalleryInput, performedBy: string, ipAddress?: string) {
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Gallery with ID ${id} not found`);
    }

    // If name is being updated, regenerate slug and check uniqueness
    let newSlug = existing.slug;
    if (input.name && input.name !== existing.name) {
      newSlug = this.generateSlug(input.name);
      const slugExists = await prisma.gallery.findUnique({
        where: { slug: newSlug },
      });
      if (slugExists && slugExists.id !== id) {
        throw new ConflictError(`Gallery with slug '${newSlug}' already exists`);
      }
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name, slug: newSlug }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.logo !== undefined && { logo: input.logo }),
        ...(input.subscription && { subscription: input.subscription as any }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.subscriptionEnds && { subscriptionEnds: new Date(input.subscriptionEnds) }),
      } as any,
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    await auditService.log({
      action: 'UPDATE',
      entityType: 'Gallery',
      entityId: id,
      oldValues: existing,
      newValues: updated,
      performedBy,
      ipAddress,
    });

    return updated;
  }

  async delete(id: string, performedBy: string, ipAddress?: string) {
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Gallery with ID ${id} not found`);
    }

    // Soft delete: set isActive = false
    const deleted = await prisma.gallery.update({
      where: { id },
      data: { isActive: false },
    });

    await auditService.log({
      action: 'DELETE',
      entityType: 'Gallery',
      entityId: id,
      oldValues: existing,
      performedBy,
      ipAddress,
    });

    return { id: deleted.id, isActive: deleted.isActive };
  }

  async getStats(id: string) {
    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    if (!gallery) {
      throw new NotFoundError(`Gallery with ID ${id} not found`);
    }

    return {
      id: gallery.id,
      name: gallery.name,
      usersCount: gallery._count.users,
      vehiclesCount: gallery._count.vehicles,
      productsCount: gallery._count.products,
      customersCount: gallery._count.customers,
    };
  }
}

export const galleryService = new GalleryService();
