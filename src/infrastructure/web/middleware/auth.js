const jwt = require('jsonwebtoken');

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
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to check if user is a superuser
const requireSuperuser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'superuser') {
    return res.status(403).json({ error: 'Access denied. Superuser role required.' });
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
