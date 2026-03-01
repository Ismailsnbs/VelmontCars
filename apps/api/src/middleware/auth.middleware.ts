import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError } from './error.middleware';
import { authService } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      galleryId?: string;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];

    if (!token || !token.trim()) {
      throw new UnauthorizedError('Access token required');
    }

    const decoded = verifyAccessToken(token);

    // U-AG1: Reject tokens that have been explicitly revoked (e.g. via logout)
    const blacklisted = await authService.isTokenBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}
