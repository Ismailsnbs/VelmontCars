import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requireMasterAdmin,
  requireGalleryAccess,
  requireFinanceAccess,
  requireUserManagement,
} from '../role.middleware';
import { UnauthorizedError, ForbiddenError } from '../error.middleware';

// Yardimci: kullanici mock'u olustur
function createAuthReq(role: string, galleryId: string | null = null): Partial<Request> {
  return {
    user: { userId: 'u1', email: 'a@b.com', role, galleryId },
  } as any;
}

function createNoUserReq(): Partial<Request> {
  return { user: undefined } as any;
}

// ------------------------------------------------------------------ //
// requireRole
// ------------------------------------------------------------------ //
describe('requireRole', () => {
  it('should allow access when user has a matching role', () => {
    const req = createAuthReq('GALLERY_OWNER');
    const next = vi.fn();

    requireRole('GALLERY_OWNER', 'GALLERY_MANAGER')(
      req as Request,
      {} as Response,
      next as NextFunction
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('should allow access for second role in the list', () => {
    const req = createAuthReq('GALLERY_MANAGER');
    const next = vi.fn();

    requireRole('GALLERY_OWNER', 'GALLERY_MANAGER')(
      req as Request,
      {} as Response,
      next as NextFunction
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('should deny access when user role is not in the allowed list', () => {
    const req = createAuthReq('STAFF');
    const next = vi.fn();

    requireRole('GALLERY_OWNER')(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should pass ForbiddenError when role does not match', () => {
    const req = createAuthReq('ACCOUNTANT');
    const next = vi.fn();

    requireRole('GALLERY_OWNER', 'GALLERY_MANAGER')(
      req as Request,
      {} as Response,
      next as NextFunction
    );

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('should deny and pass UnauthorizedError when req.user is not set', () => {
    const req = createNoUserReq();
    const next = vi.fn();

    requireRole('GALLERY_OWNER')(req as Request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it('should deny SALES role when only GALLERY_OWNER is required', () => {
    const req = createAuthReq('SALES');
    const next = vi.fn();

    requireRole('GALLERY_OWNER')(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should allow MASTER_ADMIN when explicitly listed', () => {
    const req = createAuthReq('MASTER_ADMIN');
    const next = vi.fn();

    requireRole('MASTER_ADMIN', 'GALLERY_OWNER')(
      req as Request,
      {} as Response,
      next as NextFunction
    );

    expect(next).toHaveBeenCalledWith();
  });
});

// ------------------------------------------------------------------ //
// requireMasterAdmin
// ------------------------------------------------------------------ //
describe('requireMasterAdmin', () => {
  it('should allow MASTER_ADMIN role', () => {
    const req = createAuthReq('MASTER_ADMIN');
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('should deny GALLERY_OWNER with ForbiddenError', () => {
    const req = createAuthReq('GALLERY_OWNER');
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('should deny GALLERY_MANAGER with ForbiddenError', () => {
    const req = createAuthReq('GALLERY_MANAGER');
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should deny SALES with ForbiddenError', () => {
    const req = createAuthReq('SALES');
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should deny STAFF with ForbiddenError', () => {
    const req = createAuthReq('STAFF');
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should deny ACCOUNTANT with ForbiddenError', () => {
    const req = createAuthReq('ACCOUNTANT');
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should deny when req.user is not set with UnauthorizedError', () => {
    const req = createNoUserReq();
    const next = vi.fn();

    requireMasterAdmin(req as Request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });
});

// ------------------------------------------------------------------ //
// requireGalleryAccess
// ------------------------------------------------------------------ //
describe('requireGalleryAccess', () => {
  it('should allow MASTER_ADMIN without galleryId', () => {
    const req = createAuthReq('MASTER_ADMIN', null);
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('should allow GALLERY_OWNER with a valid galleryId', () => {
    const req = createAuthReq('GALLERY_OWNER', 'gallery-1');
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('should allow GALLERY_MANAGER with a valid galleryId', () => {
    const req = createAuthReq('GALLERY_MANAGER', 'gallery-1');
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('should allow SALES with a valid galleryId', () => {
    const req = createAuthReq('SALES', 'gallery-1');
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('should allow STAFF with a valid galleryId', () => {
    const req = createAuthReq('STAFF', 'gallery-1');
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('should deny GALLERY_OWNER without galleryId with ForbiddenError', () => {
    const req = createAuthReq('GALLERY_OWNER', null);
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should deny when req.user is not set with UnauthorizedError', () => {
    const req = createNoUserReq();
    const next = vi.fn();

    requireGalleryAccess(req as Request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });
});

// ------------------------------------------------------------------ //
// requireFinanceAccess
// ------------------------------------------------------------------ //
describe('requireFinanceAccess', () => {
  const allowedRoles = ['MASTER_ADMIN', 'GALLERY_OWNER', 'GALLERY_MANAGER', 'ACCOUNTANT'];
  const deniedRoles = ['SALES', 'STAFF'];

  allowedRoles.forEach((role) => {
    it(`should allow ${role}`, () => {
      const req = createAuthReq(role, role === 'MASTER_ADMIN' ? null : 'gallery-1');
      const next = vi.fn();

      requireFinanceAccess(req as Request, {} as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });
  });

  deniedRoles.forEach((role) => {
    it(`should deny ${role} with ForbiddenError`, () => {
      const req = createAuthReq(role, 'gallery-1');
      const next = vi.fn();

      requireFinanceAccess(req as Request, {} as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  it('should deny when req.user is not set with UnauthorizedError', () => {
    const req = createNoUserReq();
    const next = vi.fn();

    requireFinanceAccess(req as Request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });
});

// ------------------------------------------------------------------ //
// requireUserManagement
// ------------------------------------------------------------------ //
describe('requireUserManagement', () => {
  const allowedRoles = ['MASTER_ADMIN', 'GALLERY_OWNER', 'GALLERY_MANAGER'];
  const deniedRoles = ['SALES', 'ACCOUNTANT', 'STAFF'];

  allowedRoles.forEach((role) => {
    it(`should allow ${role}`, () => {
      const req = createAuthReq(role, role === 'MASTER_ADMIN' ? null : 'gallery-1');
      const next = vi.fn();

      requireUserManagement(req as Request, {} as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });
  });

  deniedRoles.forEach((role) => {
    it(`should deny ${role} with ForbiddenError`, () => {
      const req = createAuthReq(role, 'gallery-1');
      const next = vi.fn();

      requireUserManagement(req as Request, {} as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  it('should deny when req.user is not set with UnauthorizedError', () => {
    const req = createNoUserReq();
    const next = vi.fn();

    requireUserManagement(req as Request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });
});
