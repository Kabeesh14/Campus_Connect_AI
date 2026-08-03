/**
 * Global Error Handling Middleware
 */

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Handle Multer upload errors or file filter rejection
  if (err.name === 'MulterError' || (err.message && err.message.includes('Invalid file type'))) {
    statusCode = 400;
  }

  console.error(`[Error] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
