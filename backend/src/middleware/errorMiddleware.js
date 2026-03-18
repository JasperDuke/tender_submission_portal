/**
 * 404 handler – must be mounted AFTER all routes.
 */
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

/**
 * Centralised error handler.
 * Express recognises this as an error handler because it takes 4 args.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Multer file filter error (non-PDF)
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Multer size limit
  if (err.code === 'LIMIT_FILE_SIZE') {
    const maxMB = Math.round((parseInt(process.env.UPLOAD_MAX_SIZE_BYTES || '10485760', 10) / 1024 / 1024));
    return res.status(400).json({ success: false, message: `File too large. Maximum size is ${maxMB} MB.` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists.` });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
