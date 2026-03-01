import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import routes from './routes';
import { startExchangeRateCron } from './jobs/exchangeRate.job';
import { initSocket } from './socket';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());

// CORS — production'da FRONTEND_URL zorunlu
const corsOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');
if (process.env.NODE_ENV === 'production' && !corsOrigin) {
  throw new Error('FRONTEND_URL environment variable is required in production');
}
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes with rate limiting
app.use('/api', apiLimiter, routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// HTTP server wrapper for Socket.io
const httpServer = createServer(app);
initSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  startExchangeRateCron();
});

export default app;
