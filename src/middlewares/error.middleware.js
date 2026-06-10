import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { isProd } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Normalize common Mongoose errors into ApiError instances.
  if (error instanceof mongoose.Error.ValidationError) {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(', ');
    error = ApiError.badRequest(message);
  } else if (error instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue ?? {})[0] ?? 'field';
    error = ApiError.conflict(`${field} already exists`);
  } else if (!(error instanceof ApiError)) {
    error = new ApiError(500, error.message || 'Internal server error', false);
  }

  if (!error.isOperational) {
    logger.error(error.stack ?? error.message);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.statusCode === 500 && isProd ? 'Internal server error' : error.message,
  });
};
