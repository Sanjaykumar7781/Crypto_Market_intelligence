import mongoose from 'mongoose';

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || getStatusCode(error);

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Unexpected server error',
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });
}

function getStatusCode(error) {
  if (error instanceof mongoose.Error.ValidationError) return 400;
  if (error instanceof mongoose.Error.CastError) return 400;
  if (error?.code === 11000) return 409;
  return 500;
}
