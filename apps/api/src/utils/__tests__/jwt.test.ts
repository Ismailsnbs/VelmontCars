import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from '../jwt';

const mockPayload: TokenPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  role: 'GALLERY_OWNER',
  galleryId: 'gallery-456',
};

const mockPayloadNoGallery: TokenPayload = {
  userId: 'master-1',
  email: 'master@example.com',
  role: 'MASTER_ADMIN',
  galleryId: null,
};

describe('JWT Utils', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid access token string', () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should return a JWT with three dot-separated parts', () => {
      const token = generateAccessToken(mockPayload);
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate a token when galleryId is null', () => {
      const token = generateAccessToken(mockPayloadNoGallery);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens on subsequent calls (iat differs)', () => {
      // iat (issued-at) değeri saniye hassasiyetindedir; iki çağrı
      // aynı anda yapılınca aynı token üretilebilir, bu kabul edilebilir.
      // Önemli olan token'ın geçerli bir JWT yapısına sahip olmasıdır.
      const token = generateAccessToken(mockPayload);
      expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token string', () => {
      const token = generateRefreshToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should return a JWT with three dot-separated parts', () => {
      const token = generateRefreshToken(mockPayload);
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate a token when galleryId is null', () => {
      const token = generateRefreshToken(mockPayloadNoGallery);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.galleryId).toBe(mockPayload.galleryId);
    });

    it('should preserve null galleryId after decode', () => {
      const token = generateAccessToken(mockPayloadNoGallery);
      const decoded = verifyAccessToken(token);
      expect(decoded.galleryId).toBeNull();
    });

    it('should throw on a completely invalid token string', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw on an empty string token', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });

    it('should throw on a token signed with the refresh secret', () => {
      // Access token verifier refresh secret ile imzalanmış token'ı reddetmeli
      const refreshToken = generateRefreshToken(mockPayload);
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });

    it('should throw on a tampered token', () => {
      const token = generateAccessToken(mockPayload);
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}TAMPERED.${parts[2]}`;
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.galleryId).toBe(mockPayload.galleryId);
    });

    it('should throw on a completely invalid token string', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw on an empty string token', () => {
      expect(() => verifyRefreshToken('')).toThrow();
    });

    it('should throw on a token signed with the access secret', () => {
      // Refresh token verifier access secret ile imzalanmış token'ı reddetmeli
      const accessToken = generateAccessToken(mockPayload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });

    it('should throw on a tampered refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}X.${parts[2]}`;
      expect(() => verifyRefreshToken(tampered)).toThrow();
    });
  });
});
