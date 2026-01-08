const jwt = require('jsonwebtoken');
const { ErrorResponse } = require('../dto');

// Get JWT secret from environment
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Please configure it in your .env file.');
  }
  return secret;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const errorResponse = ErrorResponse.unauthorized('Access denied. No token provided.');
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    const errorResponse = ErrorResponse.unauthorized('Invalid or expired token.');
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
};

// Middleware to check if user is a superuser
const requireSuperuser = (req, res, next) => {
  if (!req.user) {
    const errorResponse = ErrorResponse.unauthorized('Authentication required.');
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  if (req.user.role !== 'superuser') {
    const errorResponse = ErrorResponse.insufficientPermissions('Access denied. Superuser role required.');
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  next();
};

// Optional authentication - attaches user if token is present but doesn't fail if missing
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
  } catch (error) {
    // Token is invalid but we don't fail - just continue without user
  }

  next();
};

module.exports = {
  authenticateToken,
  requireSuperuser,
  optionalAuth
};
