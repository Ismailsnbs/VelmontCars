import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { UnauthorizedError } from '../error.middleware';

// Mock auth.service so the middleware never touches Redis in unit tests.
// Default: all tokens are NOT blacklisted.
vi.mock('../../services/auth.service', () => ({
  authService: {
    isTokenBlacklisted: vi.fn().mockResolvedValue(false),
  },
}));

// Import AFTER the mock is registered so the module sees the mock.
import { authenticate } from '../auth.middleware';
import { authService } from '../../services/auth.service';

function createMockReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers } as Partial<Request>;
}

function createMockRes(): Partial<Response> {
  return {};
}

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.mocked(authService.isTokenBlacklisted).mockResolvedValue(false);
  });

  describe('happy path — valid token', () => {
    it('should set req.user and call next() without arguments for a valid Bearer token', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-1',
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
      expect((req as any).user).toBeDefined();
    });

    it('should decode and attach correct userId to req.user', async () => {
      const token = generateAccessToken({
        userId: 'user-42',
        email: 'owner@gallery.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-99',
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect((req as any).user.userId).toBe('user-42');
    });

    it('should decode and attach correct email to req.user', async () => {
      const token = generateAccessToken({
        userId: 'user-5',
        email: 'manager@gallery.com',
        role: 'GALLERY_MANAGER',
        galleryId: 'gallery-2',
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect((req as any).user.email).toBe('manager@gallery.com');
    });

    it('should decode and attach correct role to req.user', async () => {
      const token = generateAccessToken({
        userId: 'user-6',
        email: 'admin@system.com',
        role: 'MASTER_ADMIN',
        galleryId: null,
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect((req as any).user.role).toBe('MASTER_ADMIN');
    });

    it('should attach null galleryId when token payload has null galleryId', async () => {
      const token = generateAccessToken({
        userId: 'master-1',
        email: 'master@admin.com',
        role: 'MASTER_ADMIN',
        galleryId: null,
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect((req as any).user.galleryId).toBeNull();
    });
  });

  describe('unhappy path — missing or malformed token', () => {
    it('should call next with an error when Authorization header is absent', async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with UnauthorizedError when Authorization header is absent', async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should call next with an error for an invalid token string', async () => {
      const req = createMockReq({ authorization: 'Bearer invalid-token' });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with UnauthorizedError for an invalid token string', async () => {
      const req = createMockReq({ authorization: 'Bearer invalid-token' });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should call next with an error when Bearer prefix is missing', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'STAFF',
        galleryId: null,
      });

      const req = createMockReq({ authorization: token }); // no "Bearer " prefix
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with an error when token is only whitespace', async () => {
      const req = createMockReq({ authorization: 'Bearer    ' });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with an error when a refresh token is used instead of access token', async () => {
      // Refresh secret ile imzalanmış token, access secret ile verify edilemez
      const refreshToken = generateRefreshToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-1',
      });

      const req = createMockReq({ authorization: `Bearer ${refreshToken}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with an error for a tampered token', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-1',
      });
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}TAMPERED.${parts[2]}`;

      const req = createMockReq({ authorization: `Bearer ${tampered}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not set req.user when token is invalid', async () => {
      const req = createMockReq({ authorization: 'Bearer bad.token.here' });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect((req as any).user).toBeUndefined();
    });
  });

  describe('blacklisted token rejection', () => {
    it('should call next with UnauthorizedError when a valid token is blacklisted', async () => {
      vi.mocked(authService.isTokenBlacklisted).mockResolvedValue(true);

      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-1',
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Token has been revoked');
    });

    it('should not set req.user when token is blacklisted', async () => {
      vi.mocked(authService.isTokenBlacklisted).mockResolvedValue(true);

      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-1',
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect((req as any).user).toBeUndefined();
    });

    it('should pass through when Redis is down (fail-open) — isTokenBlacklisted returns false', async () => {
      // Simulate Redis returning false on error (fail-open behavior in auth.service)
      vi.mocked(authService.isTokenBlacklisted).mockResolvedValue(false);

      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@test.com',
        role: 'GALLERY_OWNER',
        galleryId: 'gallery-1',
      });

      const req = createMockReq({ authorization: `Bearer ${token}` });
      const res = createMockRes();
      const next = vi.fn();

      await authenticate(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect((req as any).user).toBeDefined();
    });
  });
});
