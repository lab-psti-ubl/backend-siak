import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware untuk memverifikasi JWT token
 * Allows requests with isInitialSetup: true to pass without authentication
 */
export const authenticateToken = (req, res, next) => {
  // Allow initial setup requests without authentication (similar to jenjang setup)
  if (req.body && req.body.isInitialSetup === true) {
    // For initial setup, skip authentication
    req.user = null; // No user for initial setup
    return next();
  }

  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kedaluwarsa. Silakan login kembali.',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid. Silakan login kembali.',
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Gagal memverifikasi token.',
      });
    }
  }
};

/**
 * Middleware untuk memverifikasi role tertentu
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
      });
    }

    next();
  };
};

/**
 * Helper function untuk generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  // Token expires in 24 hours
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export default { authenticateToken, authorizeRoles, generateToken };

