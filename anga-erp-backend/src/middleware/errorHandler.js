const config = require('../config');
const logger = require('../utils/logger');

class ErrorHandler {
  static handleError(err, req, res, next) {
    // Log the error
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.userId || 'anonymous'
    });
    
    // Default error response
    const response = {
      success: false,
      error: 'Internal server error'
    };
    
    // Development mode: include stack trace
    if (config.env === 'development') {
      response.stack = err.stack;
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      response.error = 'Validation failed';
      response.details = err.errors || err.message;
      return res.status(400).json(response);
    }
    
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
      response.error = 'Authentication failed';
      return res.status(401).json(response);
    }
    
    if (err.name === 'ForbiddenError') {
      response.error = 'Insufficient permissions';
      return res.status(403).json(response);
    }
    
    if (err.name === 'NotFoundError') {
      response.error = err.message || 'Resource not found';
      return res.status(404).json(response);
    }
    
    if (err.name === 'ConflictError') {
      response.error = err.message || 'Resource conflict';
      return res.status(409).json(response);
    }
    
    if (err.name === 'BadRequestError') {
      response.error = err.message || 'Bad request';
      return res.status(400).json(response);
    }
    
    // Handle database errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      response.error = 'Duplicate entry';
      response.details = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(409).json(response);
    }
    
    if (err.name === 'SequelizeValidationError') {
      response.error = 'Database validation failed';
      response.details = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json(response);
    }
    
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      response.error = 'Referenced resource not found';
      return res.status(400).json(response);
    }
    
    // Default to 500
    res.status(500).json(response);
  }
  
  static notFound(req, res, next) {
    res.status(404).json({
      success: false,
      error: `Route ${req.originalUrl} not found`
    });
  }
  
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Custom error classes
class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

class BadRequestError extends Error {
  constructor(message = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

module.exports = {
  ErrorHandler,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BadRequestError
};