import prisma from '../lib/prisma';
import { redis } from '../lib/redis';
import { hashPassword, comparePassword } from '../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../middleware/error.middleware';
import { UserRole } from '@prisma/client';

// Refresh token lifetime in seconds (7 days — must match JWT_REFRESH_EXPIRES_IN)
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// Access token lifetime in seconds (15 minutes — must match JWT_EXPIRES_IN)
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

const BLACKLIST_PREFIX = 'blacklist:';

const ALLOWED_REGISTER_ROLES: UserRole[] = [
  UserRole.GALLERY_OWNER,
  UserRole.GALLERY_MANAGER,
  UserRole.SALES,
  UserRole.ACCOUNTANT,
  UserRole.STAFF,
];

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: string;
  galleryId?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    galleryId: string | null;
    galleryName: string | undefined;
  };
}

export class AuthService {
  // ---------------------------------------------------------------------------
  // Redis blacklist helpers
  // ---------------------------------------------------------------------------

  /**
   * Adds a token to the Redis blacklist with an expiry so entries are
   * automatically cleaned up after the token's natural lifetime.
   *
   * Fails open: if Redis is unavailable we log the error and continue.
   * The token will eventually expire via JWT verification anyway.
   */
  async blacklistToken(token: string, ttlSeconds: number = REFRESH_TOKEN_TTL_SECONDS): Promise<void> {
    try {
      await redis.setex(BLACKLIST_PREFIX + token, ttlSeconds, '1');
    } catch (err) {
      console.error('[Auth] Failed to blacklist token in Redis:', (err as Error).message);
    }
  }

  /**
   * Returns true if the token is present in the Redis blacklist.
   *
   * Fails open: if Redis is unavailable we log and return false so that
   * a Redis outage does not lock all users out.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await redis.get(BLACKLIST_PREFIX + token);
      return result !== null;
    } catch (err) {
      console.error('[Auth] Failed to check token blacklist in Redis:', (err as Error).message);
      return false; // fail-open — prefer availability over strict revocation during Redis outage
    }
  }

  // ---------------------------------------------------------------------------
  // Auth operations
  // ---------------------------------------------------------------------------

  async register(input: RegisterInput): Promise<AuthResult> {
    if (input.role && !ALLOWED_REGISTER_ROLES.includes(input.role as UserRole)) {
      throw new ForbiddenError('Cannot register with this role');
    }

    // K-AG3: Validate galleryId if provided
    if (input.galleryId) {
      const gallery = await prisma.gallery.findUnique({
        where: { id: input.galleryId },
        select: { id: true, isActive: true },
      });
      if (!gallery) throw new NotFoundError('Gallery not found');
      if (!gallery.isActive) throw new BadRequestError('Gallery is not active');
    }

    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: (input.role as UserRole) || UserRole.STAFF,
        galleryId: input.galleryId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        galleryId: true,
        gallery: {
          select: { name: true },
        },
      },
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      galleryId: user.galleryId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        galleryId: user.galleryId,
        galleryName: user.gallery?.name,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        gallery: { select: { name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      galleryId: user.galleryId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        galleryId: user.galleryId,
        galleryName: user.gallery?.name,
      },
    };
  }

  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    // Blacklist refresh token with refresh TTL
    if (refreshToken) {
      await this.blacklistToken(refreshToken, REFRESH_TOKEN_TTL_SECONDS);
    }
    // Blacklist access token with access TTL so it cannot be reused
    if (accessToken) {
      await this.blacklistToken(accessToken, ACCESS_TOKEN_TTL_SECONDS);
    }
  }

  async refresh(refreshTokenStr: string): Promise<AuthResult> {
    try {
      // K-AG1 + K-AG2: check blacklist before doing anything else
      const isBlacklisted = await this.isTokenBlacklisted(refreshTokenStr);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      const decoded = verifyRefreshToken(refreshTokenStr);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          gallery: { select: { name: true } },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // K-AG2: Rotate — blacklist the consumed refresh token so it cannot be
      // reused. A stolen token can therefore only be used once before being
      // invalidated by the legitimate owner's next refresh.
      await this.blacklistToken(refreshTokenStr, REFRESH_TOKEN_TTL_SECONDS);

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        galleryId: user.galleryId,
      };

      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          galleryId: user.galleryId,
          galleryName: user.gallery?.name,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        galleryId: true,
        gallery: { select: { name: true } },
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      galleryId: user.galleryId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      galleryName: user.gallery?.name,
    };
  }
}

export const authService = new AuthService();
