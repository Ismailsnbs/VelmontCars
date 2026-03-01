import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from './error.middleware';

export type UserRole =
  | 'MASTER_ADMIN'
  | 'GALLERY_OWNER'
  | 'GALLERY_MANAGER'
  | 'SALES'
  | 'ACCOUNTANT'
  | 'STAFF';

const GALLERY_ROLES: UserRole[] = [
  'GALLERY_OWNER',
  'GALLERY_MANAGER',
  'SALES',
  'ACCOUNTANT',
  'STAFF',
];

// Roles that can write (create/update/delete) data
export const WRITE_ROLES: UserRole[] = ['GALLERY_OWNER', 'GALLERY_MANAGER', 'SALES'];

/**
 * Belirtilen rollerden en az birine sahip kullanıcılara izin verir.
 * Kullanım: requireRole('GALLERY_OWNER', 'GALLERY_MANAGER')
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

/**
 * Sadece MASTER_ADMIN rolüne izin verir.
 * Master panel route'ları için kullanılır.
 */
export function requireMasterAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'MASTER_ADMIN') {
    return next(new ForbiddenError('Master admin access required'));
  }

  next();
}

/**
 * Herhangi bir galeri rolüne veya MASTER_ADMIN'e izin verir.
 * Galeri paneli route'ları için temel erişim kontrolü.
 */
export function requireGalleryAccess(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role === 'MASTER_ADMIN') {
    return next();
  }

  if (!GALLERY_ROLES.includes(req.user.role as UserRole)) {
    return next(new ForbiddenError('Gallery access required'));
  }

  if (!req.user.galleryId) {
    return next(new ForbiddenError('No gallery assigned to this user'));
  }

  next();
}

/**
 * Finansal verilere erişimi kısıtlar.
 * İzin verilenler: GALLERY_OWNER, GALLERY_MANAGER, ACCOUNTANT
 */
export function requireFinanceAccess(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const allowedRoles: UserRole[] = ['MASTER_ADMIN', 'GALLERY_OWNER', 'GALLERY_MANAGER', 'ACCOUNTANT'];

  if (!allowedRoles.includes(req.user.role as UserRole)) {
    return next(new ForbiddenError('Finance access required'));
  }

  next();
}

/**
 * Kullanıcı yönetimine erişimi kısıtlar.
 * İzin verilenler: GALLERY_OWNER, GALLERY_MANAGER
 */
export function requireUserManagement(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const allowedRoles: UserRole[] = ['MASTER_ADMIN', 'GALLERY_OWNER', 'GALLERY_MANAGER'];

  if (!allowedRoles.includes(req.user.role as UserRole)) {
    return next(new ForbiddenError('User management access required'));
  }

  next();
}
