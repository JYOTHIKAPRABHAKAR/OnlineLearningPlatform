const { HTTP_STATUS } = require('../utils/constants');

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Validation Error';
    } else if (err.name === 'CastError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Invalid ID format';
    } else if (err.code === 'SQLITE_CONSTRAINT') {
        statusCode = HTTP_STATUS.CONFLICT;
        message = 'Resource already exists';
    } else if (err.code === 'SQLITE_NOTFOUND') {
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = 'Resource not found';
    } else if (err.message) {
        message = err.message;
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 handler for undefined routes
const notFound = (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
};

module.exports = {
    errorHandler,
    notFound
}; 