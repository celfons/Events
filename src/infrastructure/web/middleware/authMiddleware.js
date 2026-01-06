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
 * Fetches user's groups and verifies if any group has the required permission
 */
function hasPermission(permission) {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      // Import UserModel here to avoid circular dependencies
      const UserModel = require('../../database/UserModel');
      
      // Fetch user with populated groups
      const user = await UserModel.findById(req.session.userId).populate('groups');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'User account is inactive' });
      }

      // Check if user has the required permission through any of their groups
      const hasRequiredPermission = user.groups.some(group => 
        group.permissions && group.permissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          error: 'Permission denied',
          required: permission,
          message: `You do not have the '${permission}' permission`
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
}

module.exports = {
  isAuthenticated,
  hasPermission
};
