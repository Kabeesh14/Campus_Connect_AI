const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_campus_connect_2026';

/**
 * Mandatory Verify JWT Token Middleware (For Protected User Routes)
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication token is empty.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token payload.',
      });
    }

    let currentUser = {
      id: decoded.id,
      email: decoded.email || 'user@campus.edu',
      role: decoded.role || 'student',
    };

    try {
      const users = await query('SELECT id, email, role FROM users WHERE id = ?', [decoded.id]);
      if (users && users.length > 0) {
        currentUser = users[0];
      }
    } catch (dbErr) {
      console.warn('Database user query warning in auth middleware:', dbErr.message);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

/**
 * Optional Verify JWT Token Middleware (For Public AI Routes)
 * If valid token present: sets req.user.
 * If token missing, expired, or invalid: sets req.user = null and continues cleanly without 401.
 */
const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token || token === 'undefined' || token === 'null') {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

/**
 * Role Authorization Middleware
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user?.role || 'unknown'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
};
