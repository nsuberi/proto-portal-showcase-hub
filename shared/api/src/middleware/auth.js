import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Simple API key authentication middleware
 * This provides basic access control without requiring user accounts
 */
export function authMiddleware(req, res, next) {
  // Generate a request ID for tracking
  req.requestId = crypto.randomUUID();

  // For development, skip auth if no auth is configured
  if (process.env.NODE_ENV === 'development' && !process.env.API_KEY_SALT && !process.env.JWT_SECRET) {
    logger.info('Development mode: skipping authentication', { requestId: req.requestId });
    return next();
  }

  // Skip auth for AI analysis endpoints that use client-provided API keys
  if (req.path.includes('/ai-analysis/')) {
    logger.info('Skipping auth for AI analysis endpoint (client provides API keys)', { requestId: req.requestId });
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    logger.warn('Missing API key in request', {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY',
      requestId: req.requestId
    });
  }

  // Validate API key format (basic check)
  if (!isValidApiKeyFormat(apiKey)) {
    logger.warn('Invalid API key format', {
      requestId: req.requestId,
      ip: req.ip
    });
    
    return res.status(401).json({
      error: 'Invalid API key format',
      code: 'INVALID_API_KEY',
      requestId: req.requestId
    });
  }

  // In a production system, you would:
  // 1. Validate against a database of registered API keys
  // 2. Check rate limits per API key
  // 3. Track usage analytics per key
  // 4. Implement key rotation
  
  // For now, we use a simple shared secret approach
  const expectedKey = generateApiKey();
  if (apiKey !== expectedKey) {
    logger.warn('Invalid API key provided', {
      requestId: req.requestId,
      ip: req.ip
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY', 
      requestId: req.requestId
    });
  }

  logger.info('Request authenticated', {
    requestId: req.requestId,
    ip: req.ip
  });

  next();
}

/**
 * Generate the expected API key based on environment configuration
 */
function generateApiKey() {
  const salt = process.env.API_KEY_SALT || 'default-development-salt-change-in-production';
  const secret = process.env.JWT_SECRET || 'default-development-secret';
  
  // Generate a deterministic API key from salt and secret
  return crypto
    .createHmac('sha256', secret)
    .update(salt)
    .digest('hex')
    .substring(0, 32); // 32 character API key
}

/**
 * Validate API key format
 */
function isValidApiKeyFormat(apiKey) {
  // Check if it's a hexadecimal string of expected length
  return /^[a-f0-9]{32}$/i.test(apiKey);
}

/**
 * Generate an API key for clients (utility function)
 * This would be called by an admin endpoint or setup script
 */
export function createClientApiKey() {
  return generateApiKey();
}

/**
 * Get the current API key (for setup/testing purposes)
 */
export function getCurrentApiKey() {
  return generateApiKey();
}