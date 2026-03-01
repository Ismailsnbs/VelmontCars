import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET environment variable is required');

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  galleryId: string | null;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

function validatePayload(decoded: unknown): TokenPayload {
  if (
    typeof decoded !== 'object' || decoded === null ||
    typeof (decoded as any).userId !== 'string' ||
    typeof (decoded as any).email !== 'string' ||
    typeof (decoded as any).role !== 'string'
  ) {
    throw new Error('Malformed token payload');
  }
  const d = decoded as Record<string, unknown>;
  return {
    userId: d.userId as string,
    email: d.email as string,
    role: d.role as string,
    galleryId: typeof d.galleryId === 'string' ? d.galleryId : null,
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return validatePayload(decoded);
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  return validatePayload(decoded);
}
