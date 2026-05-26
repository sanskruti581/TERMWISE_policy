export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  const isMulterError = err.name === 'MulterError';
  const statusCode = err.statusCode || (isMulterError ? 400 : res.statusCode === 200 ? 500 : res.statusCode);

  console.error('API error:', {
    message: err.message,
    statusCode,
    code: err.code,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  res.status(statusCode).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
