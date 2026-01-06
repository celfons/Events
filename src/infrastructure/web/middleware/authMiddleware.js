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
 * Note: Basic implementation - checks if user is authenticated.
 * Full permission checking requires fetching user's groups and checking their permissions.
 * This can be enhanced in the future to implement granular permission-based access control.
 */
function hasPermission(permission) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Basic implementation: allow all authenticated users
    // TODO: Implement full permission checking:
    // 1. Fetch user from database with populated groups
    // 2. Check if any of user's groups have the required permission
    // 3. Return 403 if user doesn't have permission
    next();
  };
}

module.exports = {
  isAuthenticated,
  hasPermission
};
