const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { getUserSession } = require('../config/redis');
const logger = require('../utils/logger');

// JWT Authentication middleware for HTTP routes
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true, is_banned: false })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Check session in Redis
    const session = await getUserSession(user.id);
    if (!session || session.tokenId !== decoded.tokenId) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Update last active
    await db('users')
      .where({ id: user.id })
      .update({ last_active: new Date() });

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      is_premium: user.is_premium,
      coin_balance: user.coin_balance,
      profile_picture_url: user.profile_picture_url
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    logger.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true, is_banned: false })
      .first();

    if (user) {
      const session = await getUserSession(user.id);
      if (session && session.tokenId === decoded.tokenId) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          is_premium: user.is_premium,
          coin_balance: user.coin_balance,
          profile_picture_url: user.profile_picture_url
        };
        
        // Update last active
        await db('users')
          .where({ id: user.id })
          .update({ last_active: new Date() });
      }
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db('users')
      .where({ id: req.user.id })
      .first();

    // Check if user has admin privileges (you can add an is_admin field)
    // For now, we'll check if user email is in admin list or has admin role
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
    
    if (!adminEmails.includes(user.email) && !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = user;
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return res.status(500).json({ error: 'Admin authentication failed' });
  }
};

// Premium user middleware
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.is_premium) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }

    next();
  } catch (error) {
    logger.error('Premium authentication error:', error);
    return res.status(500).json({ error: 'Premium authentication failed' });
  }
};

// Socket.io authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true, is_banned: false })
      .first();

    if (!user) {
      return next(new Error('Invalid token or user not found'));
    }

    // Check session in Redis
    const session = await getUserSession(user.id);
    if (!session || session.tokenId !== decoded.tokenId) {
      return next(new Error('Session expired or invalid'));
    }

    // Attach user data to socket
    socket.userId = user.id;
    socket.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      is_premium: user.is_premium,
      coin_balance: user.coin_balance,
      profile_picture_url: user.profile_picture_url
    };

    // Update last active
    await db('users')
      .where({ id: user.id })
      .update({ last_active: new Date() });

    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Coin balance check middleware
const requireCoins = (minCoins) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await db('users')
        .where({ id: req.user.id })
        .first();

      if (user.coin_balance < minCoins) {
        return res.status(402).json({ 
          error: 'Insufficient coins',
          required: minCoins,
          current: user.coin_balance
        });
      }

      req.user.coin_balance = user.coin_balance;
      next();
    } catch (error) {
      logger.error('Coin check error:', error);
      return res.status(500).json({ error: 'Coin check failed' });
    }
  };
};

// Generate JWT token
const generateToken = (userId, tokenId) => {
  return jwt.sign(
    { userId, tokenId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId, tokenId) => {
  return jwt.sign(
    { userId, tokenId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requirePremium,
  authenticateSocket,
  requireCoins,
  generateToken,
  generateRefreshToken
};