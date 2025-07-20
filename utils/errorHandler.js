const logger = require('./logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    message: error.message || 'Something went wrong',
    error: {
      status: error.status || 'error',
      statusCode: error.statusCode || 500
    }
  };

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

// Database error handler
const handleDatabaseError = (error) => {
  logger.error('Database error:', error);

  // PostgreSQL specific errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new ConflictError('Resource already exists');
      case '23503': // Foreign key violation
        return new ValidationError('Invalid reference to related resource');
      case '23502': // Not null violation
        return new ValidationError('Required field is missing');
      case '23514': // Check violation
        return new ValidationError('Invalid data format');
      case '42P01': // Undefined table
        return new InternalServerError('Database table not found');
      case '42703': // Undefined column
        return new InternalServerError('Database column not found');
      case '28P01': // Invalid password
        return new InternalServerError('Database authentication failed');
      case '3D000': // Invalid catalog name
        return new InternalServerError('Database does not exist');
      default:
        return new InternalServerError('Database operation failed');
    }
  }

  // Knex specific errors
  if (error.message.includes('connect ECONNREFUSED')) {
    return new ServiceUnavailableError('Database connection failed');
  }

  if (error.message.includes('timeout')) {
    return new ServiceUnavailableError('Database operation timed out');
  }

  return new InternalServerError('Database error occurred');
};

// Redis error handler
const handleRedisError = (error) => {
  logger.error('Redis error:', error);

  if (error.message.includes('connect ECONNREFUSED')) {
    return new ServiceUnavailableError('Cache service unavailable');
  }

  if (error.message.includes('timeout')) {
    return new ServiceUnavailableError('Cache operation timed out');
  }

  return new InternalServerError('Cache service error');
};

// JWT error handler
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }

  return new AuthenticationError('Token verification failed');
};

// Validation error handler
const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return new ValidationError(messages.join(', '));
  }

  return new ValidationError('Validation failed');
};

// Third-party service error handler
const handleServiceError = (error, service) => {
  logger.error(`${service} service error:`, error);

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || `${service} service error`;

    if (status >= 400 && status < 500) {
      return new ValidationError(message);
    }

    if (status >= 500) {
      return new ServiceUnavailableError(`${service} service temporarily unavailable`);
    }
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ServiceUnavailableError(`${service} service unavailable`);
  }

  if (error.code === 'ETIMEDOUT') {
    return new ServiceUnavailableError(`${service} service timeout`);
  }

  return new InternalServerError(`${service} service error`);
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  let appError = error;

  // Convert known errors to AppError instances
  if (!(error instanceof AppError)) {
    if (error.code && (error.code.startsWith('23') || error.code.startsWith('42'))) {
      appError = handleDatabaseError(error);
    } else if (error.name && error.name.includes('JWT')) {
      appError = handleJWTError(error);
    } else if (error.name === 'ValidationError') {
      appError = handleValidationError(error);
    } else if (error.message && error.message.includes('Redis')) {
      appError = handleRedisError(error);
    } else {
      appError = new InternalServerError();
    }
  }

  // Log error
  if (appError.statusCode >= 500) {
    logger.error('Server error:', {
      message: appError.message,
      stack: appError.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    logger.warn('Client error:', {
      message: appError.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  // Send error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = formatErrorResponse(appError, isDevelopment);

  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Unhandled promise rejection handler
const handleUnhandledRejection = (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // Optionally exit the process
  // process.exit(1);
};

// Uncaught exception handler
const handleUncaughtException = (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
};

// Setup global error handlers
const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,

  // Error handlers
  handleDatabaseError,
  handleRedisError,
  handleJWTError,
  handleValidationError,
  handleServiceError,

  // Middleware
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,

  // Utilities
  formatErrorResponse,
  setupGlobalErrorHandlers
};