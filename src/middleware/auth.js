const jwt = require('jsonwebtoken');
const config = require('../config');
const UserModel = require('../models/User');

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional token verification (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    }
  } catch (error) {
    // Silently fail, user is not authenticated
  }
  next();
};

/**
 * Check if user owns the resource
 */
const checkOwnership = (req, res, next) => {
  const { userId } = req.params;
  
  if (req.user && req.user.userId === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only modify your own profile.'
  });
};

module.exports = {
  verifyToken,
  optionalAuth,
  checkOwnership
};
