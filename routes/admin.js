const express = require('express');
const { body, validationResult } = require('express-validator');

const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkDatabaseHealth } = require('../config/database');
const { checkRedisHealth } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken, requireAdmin);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const userStats = await db('users')
      .select([
        db.raw('COUNT(*) as total_users'),
        db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_users'),
        db.raw('COUNT(CASE WHEN is_banned = true THEN 1 END) as banned_users'),
        db.raw('COUNT(CASE WHEN is_premium = true THEN 1 END) as premium_users'),
        db.raw('COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users'),
        db.raw('COUNT(CASE WHEN created_at > NOW() - INTERVAL \'7 days\' THEN 1 END) as new_users_week'),
        db.raw('COUNT(CASE WHEN last_active > NOW() - INTERVAL \'24 hours\' THEN 1 END) as active_24h')
      ])
      .first();

    // Get match statistics
    const matchStats = await db('matches')
      .select([
        db.raw('COUNT(*) as total_matches'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful_matches', ['matched']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_matches', ['pending']),
        db.raw('COUNT(CASE WHEN is_super_match = true THEN 1 END) as super_matches'),
        db.raw('COUNT(CASE WHEN created_at > NOW() - INTERVAL \'7 days\' THEN 1 END) as matches_this_week')
      ])
      .first();

    // Get message statistics
    const messageStats = await db('messages')
      .select([
        db.raw('COUNT(*) as total_messages'),
        db.raw('COUNT(CASE WHEN created_at > NOW() - INTERVAL \'24 hours\' THEN 1 END) as messages_24h'),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as text_messages', ['text']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as image_messages', ['image']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as audio_messages', ['audio']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as video_messages', ['video'])
      ])
      .first();

    // Get coin statistics
    const coinStats = await db('coin_transactions')
      .select([
        db.raw('SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_coins_earned'),
        db.raw('SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_coins_spent'),
        db.raw('SUM(CASE WHEN type = ? THEN payment_amount ELSE 0 END) as total_revenue', ['purchase']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as total_purchases', ['purchase']),
        db.raw('COUNT(CASE WHEN type = ? AND created_at > NOW() - INTERVAL \'7 days\' THEN 1 END) as purchases_this_week', ['purchase'])
      ])
      .first();

    // Get system health
    const dbHealth = await checkDatabaseHealth();
    const redisHealth = await checkRedisHealth();

    const dashboard = {
      users: {
        total: parseInt(userStats.total_users),
        active: parseInt(userStats.active_users),
        banned: parseInt(userStats.banned_users),
        premium: parseInt(userStats.premium_users),
        verified: parseInt(userStats.verified_users),
        new_this_week: parseInt(userStats.new_users_week),
        active_24h: parseInt(userStats.active_24h)
      },
      matches: {
        total: parseInt(matchStats.total_matches),
        successful: parseInt(matchStats.successful_matches),
        pending: parseInt(matchStats.pending_matches),
        super_matches: parseInt(matchStats.super_matches),
        this_week: parseInt(matchStats.matches_this_week)
      },
      messages: {
        total: parseInt(messageStats.total_messages),
        today: parseInt(messageStats.messages_24h),
        by_type: {
          text: parseInt(messageStats.text_messages),
          image: parseInt(messageStats.image_messages),
          audio: parseInt(messageStats.audio_messages),
          video: parseInt(messageStats.video_messages)
        }
      },
      coins: {
        total_earned: parseInt(coinStats.total_coins_earned),
        total_spent: parseInt(coinStats.total_coins_spent),
        total_revenue: parseFloat(coinStats.total_revenue) || 0,
        total_purchases: parseInt(coinStats.total_purchases),
        purchases_this_week: parseInt(coinStats.purchases_this_week)
      },
      system_health: {
        database: dbHealth,
        redis: redisHealth
      }
    };

    res.json({ dashboard });

  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Get all users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      search,
      status,
      is_premium,
      is_verified,
      is_banned,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = db('users');

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.whereILike('username', `%${search}%`)
          .orWhereILike('display_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('is_active', status === 'active');
    }

    if (is_premium !== undefined) {
      query = query.where('is_premium', is_premium === 'true');
    }

    if (is_verified !== undefined) {
      query = query.where('is_verified', is_verified === 'true');
    }

    if (is_banned !== undefined) {
      query = query.where('is_banned', is_banned === 'true');
    }

    const users = await query
      .select([
        'id', 'email', 'username', 'display_name', 'profile_picture_url',
        'date_of_birth', 'gender', 'location', 'is_active', 'is_premium',
        'is_verified', 'is_banned', 'ban_reason', 'banned_until',
        'coin_balance', 'total_coins_earned', 'total_coins_spent',
        'login_streak', 'last_active', 'last_login', 'created_at'
      ])
      .orderBy(sort_by, sort_order)
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count for pagination
    const totalCount = await query.clone().count('* as count').first();

    res.json({
      users,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(totalCount.count)
      }
    });

  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await db('users')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's match statistics
    const matchStats = await db('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .select([
        db.raw('COUNT(*) as total_matches'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful_matches', ['matched']),
        db.raw('COUNT(CASE WHEN initiated_by = ? THEN 1 END) as initiated_matches', [userId])
      ])
      .first();

    // Get user's coin transactions
    const coinTransactions = await db('coin_transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(10)
      .select([
        'id', 'type', 'amount', 'description', 'created_at',
        'payment_provider', 'payment_amount'
      ]);

    // Get user's recent messages count
    const messageCount = await db('messages')
      .where('sender_id', userId)
      .count('* as count')
      .first();

    const userDetails = {
      ...user,
      interests: user.interests ? JSON.parse(user.interests) : [],
      languages: user.languages ? JSON.parse(user.languages) : [],
      age_range: user.age_range ? JSON.parse(user.age_range) : null,
      gender_preference: user.gender_preference ? JSON.parse(user.gender_preference) : [],
      device_tokens: user.device_tokens ? JSON.parse(user.device_tokens) : [],
      statistics: {
        matches: {
          total: parseInt(matchStats.total_matches),
          successful: parseInt(matchStats.successful_matches),
          initiated: parseInt(matchStats.initiated_matches)
        },
        messages_sent: parseInt(messageCount.count)
      },
      recent_transactions: coinTransactions
    };

    res.json({ user: userDetails });

  } catch (error) {
    logger.error('Admin get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user status
router.put('/users/:userId/status', [
  body('is_active').optional().isBoolean(),
  body('is_banned').optional().isBoolean(),
  body('ban_reason').optional().isString(),
  body('banned_until').optional().isISO8601(),
  body('is_premium').optional().isBoolean(),
  body('is_verified').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { is_active, is_banned, ban_reason, banned_until, is_premium, is_verified } = req.body;

    const updateData = {};
    
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_banned !== undefined) {
      updateData.is_banned = is_banned;
      if (is_banned) {
        updateData.ban_reason = ban_reason || 'Banned by admin';
        updateData.banned_until = banned_until ? new Date(banned_until) : null;
      } else {
        updateData.ban_reason = null;
        updateData.banned_until = null;
      }
    }
    if (is_premium !== undefined) updateData.is_premium = is_premium;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await db('users')
      .where('id', userId)
      .update(updateData)
      .returning(['id', 'username', 'is_active', 'is_banned', 'is_premium', 'is_verified']);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Admin ${req.user.id} updated user ${userId} status:`, updateData);

    res.json({
      message: 'User status updated successfully',
      user: updatedUser
    });

  } catch (error) {
    logger.error('Admin update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get reported content
router.get('/reports', async (req, res) => {
  try {
    const { limit = 50, offset = 0, type = 'all' } = req.query;

    // This is a placeholder - you would need to implement a proper reporting system
    // For now, we'll return flagged messages as an example
    let query = db('messages')
      .leftJoin('users as sender', 'messages.sender_id', 'sender.id')
      .leftJoin('users as recipient', 'messages.recipient_id', 'recipient.id')
      .where('messages.is_flagged', true);

    const reports = await query
      .select([
        'messages.id',
        'messages.content',
        'messages.flag_reason',
        'messages.created_at',
        'sender.username as sender_username',
        'sender.display_name as sender_display_name',
        'recipient.username as recipient_username',
        'recipient.display_name as recipient_display_name'
      ])
      .orderBy('messages.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      reports,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: reports.length
      }
    });

  } catch (error) {
    logger.error('Admin get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let interval;
    let dateFormat;
    
    switch (period) {
      case '24h':
        interval = '24 hours';
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        break;
      case '7d':
        interval = '7 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '30d':
        interval = '30 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '90d':
        interval = '90 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      default:
        interval = '7 days';
        dateFormat = 'YYYY-MM-DD';
    }

    // User registrations over time
    const userRegistrations = await db('users')
      .select([
        db.raw(`DATE_TRUNC('day', created_at) as date`),
        db.raw('COUNT(*) as count')
      ])
      .where('created_at', '>', db.raw(`NOW() - INTERVAL '${interval}'`))
      .groupBy(db.raw(`DATE_TRUNC('day', created_at)`))
      .orderBy('date');

    // Active users over time
    const activeUsers = await db('users')
      .select([
        db.raw(`DATE_TRUNC('day', last_active) as date`),
        db.raw('COUNT(DISTINCT id) as count')
      ])
      .where('last_active', '>', db.raw(`NOW() - INTERVAL '${interval}'`))
      .groupBy(db.raw(`DATE_TRUNC('day', last_active)`))
      .orderBy('date');

    // Matches over time
    const matches = await db('matches')
      .select([
        db.raw(`DATE_TRUNC('day', created_at) as date`),
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful', ['matched'])
      ])
      .where('created_at', '>', db.raw(`NOW() - INTERVAL '${interval}'`))
      .groupBy(db.raw(`DATE_TRUNC('day', created_at)`))
      .orderBy('date');

    // Revenue over time
    const revenue = await db('coin_transactions')
      .select([
        db.raw(`DATE_TRUNC('day', created_at) as date`),
        db.raw('SUM(payment_amount) as total'),
        db.raw('COUNT(*) as transactions')
      ])
      .where('type', 'purchase')
      .where('created_at', '>', db.raw(`NOW() - INTERVAL '${interval}'`))
      .groupBy(db.raw(`DATE_TRUNC('day', created_at)`))
      .orderBy('date');

    const analytics = {
      period,
      user_registrations: userRegistrations,
      active_users: activeUsers,
      matches: matches,
      revenue: revenue
    };

    res.json({ analytics });

  } catch (error) {
    logger.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// System configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      coin_costs: {
        message: parseInt(process.env.MESSAGE_COST_COINS) || 1,
        video_call: parseInt(process.env.VIDEO_CALL_COST_COINS) || 5,
        voice_call: parseInt(process.env.VOICE_CALL_COST_COINS) || 3,
        super_match: parseInt(process.env.SUPER_MATCH_COST_COINS) || 10,
        profile_boost: parseInt(process.env.PROFILE_BOOST_COST_COINS) || 20
      },
      daily_reward: parseInt(process.env.DAILY_LOGIN_COINS) || 10,
      rate_limiting: {
        window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      },
      features: {
        google_oauth: !!process.env.GOOGLE_CLIENT_ID,
        facebook_oauth: !!process.env.FACEBOOK_APP_ID,
        stripe_payments: !!process.env.STRIPE_SECRET_KEY,
        cloudinary_uploads: !!process.env.CLOUDINARY_CLOUD_NAME,
        google_translate: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        firebase_notifications: !!process.env.FIREBASE_PROJECT_ID,
        openai_matching: !!process.env.OPENAI_API_KEY
      }
    };

    res.json({ config });

  } catch (error) {
    logger.error('Admin get config error:', error);
    res.status(500).json({ error: 'Failed to get system configuration' });
  }
});

// Export user data (for GDPR compliance)
router.get('/users/:userId/export', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user data
    const user = await db('users').where('id', userId).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's matches
    const matches = await db('matches')
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .select('*');

    // Get user's messages
    const messages = await db('messages')
      .where(function() {
        this.where('sender_id', userId).orWhere('recipient_id', userId);
      })
      .select('*');

    // Get user's transactions
    const transactions = await db('coin_transactions')
      .where('user_id', userId)
      .select('*');

    const exportData = {
      user: {
        ...user,
        password_hash: '[REDACTED]' // Don't export password hash
      },
      matches,
      messages: messages.map(msg => ({
        ...msg,
        content: msg.sender_id === userId ? msg.content : '[REDACTED]' // Only export user's own messages
      })),
      transactions,
      exported_at: new Date().toISOString()
    };

    res.json({ data: exportData });

  } catch (error) {
    logger.error('Admin export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

// System logs (last 100 entries)
router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // This is a placeholder - in a real system, you'd read from log files
    // For now, return a simple response
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'System running normally',
        service: 'api'
      }
    ];

    res.json({ logs });

  } catch (error) {
    logger.error('Admin get logs error:', error);
    res.status(500).json({ error: 'Failed to get system logs' });
  }
});

module.exports = router;