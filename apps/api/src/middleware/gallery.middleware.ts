import { Request, Response, NextFunction } from 'express';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from './error.middleware';
import prisma from '../lib/prisma';

/**
 * Multi-tenant izolasyon middleware'i.
 *
 * - MASTER_ADMIN: tüm galerilere erişebilir; params/query'den galleryId alınır
 * - Galeri kullanıcıları: yalnızca kendi galleryId'leri ile eşleşen verilere erişebilir
 *
 * Bu middleware authenticate() ve requireGalleryAccess() sonrası kullanılmalıdır.
 * req.galleryId, controller/service katmanında WHERE koşulu için kullanılır.
 */
export async function galleryTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role === 'MASTER_ADMIN') {
    const galleryId = (req.params.galleryId || req.query.galleryId) as string | undefined;

    if (!galleryId) {
      return next(new BadRequestError('MASTER_ADMIN must specify galleryId parameter for gallery-scoped operations'));
    }

    try {
      const gallery = await prisma.gallery.findUnique({
        where: { id: galleryId },
        select: { id: true },
      });

      if (!gallery) {
        return next(new NotFoundError(`Gallery not found: ${galleryId}`));
      }
    } catch (err) {
      return next(err);
    }

    req.galleryId = galleryId;
    return next();
  }

  if (!req.user.galleryId) {
    return next(new ForbiddenError('No gallery assigned to this user'));
  }

  if (
    req.params.galleryId &&
    req.params.galleryId !== req.user.galleryId
  ) {
    return next(new ForbiddenError('Cannot access other gallery data'));
  }

  req.galleryId = req.user.galleryId;
  next();
}

/**
 * Query parametresindeki galleryId'yi doğrular (opsiyonel parametre akışı için).
 * MASTER_ADMIN herhangi bir galeriye yönlendirebilir.
 * Galeri kullanıcıları yalnızca kendi galleryId'lerini sorgulayabilir.
 */
export function galleryQueryFilter(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role === 'MASTER_ADMIN') {
    return next();
  }

  if (!req.user.galleryId) {
    return next(new ForbiddenError('No gallery assigned to this user'));
  }

  const requestedGalleryId = req.query.galleryId as string | undefined;

  if (requestedGalleryId && requestedGalleryId !== req.user.galleryId) {
    return next(new ForbiddenError('Cannot query other gallery data'));
  }

  req.query.galleryId = req.user.galleryId;
  next();
}
