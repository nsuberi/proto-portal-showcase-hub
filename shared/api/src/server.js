import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { aiAnalysisRoutes } from './routes/ai-analysis.js';
import documentationRoutes from './routes/documentation.js';
import { errorHandler, notFoundHandler } from './middleware/error-handlers.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
// Default to 3004 to avoid conflicts with prototypes
const PORT = process.env.PORT || 3004;

// Trust proxy for Lambda/API Gateway
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
// Use Express CORS in all environments - Lambda Function URL CORS config will be disabled
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:3002', 
  'http://localhost:3004',
  'http://localhost:3005', 
  'http://localhost:8080',
  'http://localhost:8082'
];
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Key'],
  credentials: false // No cookies needed
}));

// Rate limiting with trust proxy handling
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Handle trust proxy by using the leftmost IP in X-Forwarded-For
  keyGenerator: (req) => {
    // In development, use a fixed key to effectively disable rate limiting
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    // Use the leftmost (original client) IP from X-Forwarded-For header
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip;
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/v1', aiAnalysisRoutes);
app.use('/api/v1', documentationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`AI Analysis API Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS origins: ${corsOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default app;