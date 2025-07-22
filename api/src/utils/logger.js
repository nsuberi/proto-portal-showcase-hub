/**
 * Simple structured logging utility
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
    // Add common metadata
    environment: process.env.NODE_ENV || 'development',
    service: 'ai-analysis-api'
  };

  return JSON.stringify(logEntry);
}

function shouldLog(level) {
  return LOG_LEVELS[level] <= currentLogLevel;
}

export const logger = {
  error: (message, meta) => {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, meta));
    }
  },

  warn: (message, meta) => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, meta));
    }
  },

  info: (message, meta) => {
    if (shouldLog('info')) {
      console.info(formatLog('info', message, meta));
    }
  },

  debug: (message, meta) => {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', message, meta));
    }
  }
};