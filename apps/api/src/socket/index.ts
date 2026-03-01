import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

interface SocketData {
  userId: string;
  email: string;
  galleryId: string | null;
  role: string;
}

type AuthenticatedSocket = Socket & { data: SocketData };

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware — JWT token doğrulama
  io.use((socket: Socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth.token as string | undefined ||
        (socket.handshake.headers.authorization as string | undefined)?.replace('Bearer ', '');

      if (!rawToken) {
        return next(new Error('Authentication required'));
      }

      const decoded: TokenPayload = verifyAccessToken(rawToken);

      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      socket.data.galleryId = decoded.galleryId;
      socket.data.role = decoded.role;

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { userId, galleryId, role } = socket.data;

    // Galeri bazlı room'a katıl (multi-tenant izolasyon)
    if (galleryId) {
      socket.join(`gallery:${galleryId}`);
    }

    // Kullanıcıya özel room
    socket.join(`user:${userId}`);

    // Master admin tüm bildirimleri alır
    if (role === 'MASTER_ADMIN') {
      socket.join('master');
    }

    console.log(`Socket connected: ${userId} (gallery: ${galleryId ?? 'none'}, role: ${role})`);

    socket.on('disconnect', (reason: string) => {
      console.log(`Socket disconnected: ${userId} (reason: ${reason})`);
    });
  });

  return io;
}

// Galeri bazlı event gönder
export function emitToGallery(galleryId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`gallery:${galleryId}`).emit(event, data);
  }
}

// Kullanıcıya özel event gönder
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Master admin'lere event gönder
export function emitToMaster(event: string, data: unknown): void {
  if (io) {
    io.to('master').emit(event, data);
  }
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket() first.');
  }
  return io;
}
