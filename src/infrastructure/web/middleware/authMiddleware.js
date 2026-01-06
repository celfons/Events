/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // For API requests, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // For page requests, redirect to login
  res.redirect('/login');
}

/**
 * Middleware to check if user has specific permission
 */
function hasPermission(permission) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // TODO: Check user's groups and permissions
    // For now, allow all authenticated users
    next();
  };
}

module.exports = {
  isAuthenticated,
  hasPermission
};
