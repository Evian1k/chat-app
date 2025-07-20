const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');

const { db } = require('../config/database');
const { setUserSession, deleteUserSession } = require('../config/redis');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('display_name').isLength({ min: 1, max: 50 }).trim(),
  body('date_of_birth').isISO8601().custom(value => {
    const age = new Date().getFullYear() - new Date(value).getFullYear();
    if (age < 18) throw new Error('Must be at least 18 years old');
    return true;
  }),
  body('gender').isIn(['male', 'female', 'other', 'prefer_not_to_say'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Helper function to create user session
async function createUserSession(user) {
  const tokenId = uuidv4();
  const token = generateToken(user.id, tokenId);
  const refreshToken = generateRefreshToken(user.id, tokenId);
  
  const sessionData = {
    tokenId,
    userId: user.id,
    loginTime: new Date().toISOString(),
    refreshToken
  };
  
  await setUserSession(user.id, sessionData, 7 * 24 * 60 * 60); // 7 days
  
  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      profile_picture_url: user.profile_picture_url,
      is_premium: user.is_premium,
      coin_balance: user.coin_balance,
      is_verified: user.is_verified
    }
  };
}

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      username,
      display_name,
      date_of_birth,
      gender,
      location,
      interests = [],
      bio = ''
    } = req.body;

    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .first();

    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        username,
        display_name,
        date_of_birth,
        gender,
        location,
        interests: JSON.stringify(interests),
        bio,
        coin_balance: 100, // Welcome bonus
        total_coins_earned: 100,
        last_login: new Date(),
        last_active: new Date()
      })
      .returning('*');

    // Create welcome coin transaction
    await db('coin_transactions').insert({
      user_id: newUser.id,
      type: 'daily_reward',
      amount: 100,
      balance_before: 0,
      balance_after: 100,
      description: 'Welcome bonus'
    });

    // Create session and return tokens
    const sessionData = await createUserSession(newUser);
    
    logger.info(`New user registered: ${newUser.email}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      ...sessionData
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user || user.is_banned) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (skip for OAuth users)
    if (!user.is_oauth_user) {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Update login info
    const now = new Date();
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const isConsecutiveDay = lastLogin && 
      (now.getTime() - lastLogin.getTime()) < 48 * 60 * 60 * 1000 && 
      (now.getTime() - lastLogin.getTime()) > 20 * 60 * 60 * 1000;

    const loginStreak = isConsecutiveDay ? user.login_streak + 1 : 1;

    await db('users')
      .where({ id: user.id })
      .update({
        last_login: now,
        last_active: now,
        login_streak: loginStreak
      });

    // Check for daily reward
    const lastDailyReward = user.last_daily_reward ? new Date(user.last_daily_reward) : null;
    const canClaimDailyReward = !lastDailyReward || 
      (now.getTime() - lastDailyReward.getTime()) > 20 * 60 * 60 * 1000;

    if (canClaimDailyReward) {
      const dailyCoins = parseInt(process.env.DAILY_LOGIN_COINS) || 10;
      const bonusCoins = Math.min(loginStreak * 2, 50); // Streak bonus, max 50
      const totalCoins = dailyCoins + bonusCoins;

      await db.transaction(async (trx) => {
        await trx('users')
          .where({ id: user.id })
          .update({
            coin_balance: user.coin_balance + totalCoins,
            total_coins_earned: user.total_coins_earned + totalCoins,
            last_daily_reward: now
          });

        await trx('coin_transactions').insert({
          user_id: user.id,
          type: 'daily_reward',
          amount: totalCoins,
          balance_before: user.coin_balance,
          balance_after: user.coin_balance + totalCoins,
          description: `Daily login reward (${dailyCoins} + ${bonusCoins} streak bonus)`,
          metadata: JSON.stringify({ streak: loginStreak })
        });
      });

      user.coin_balance += totalCoins;
    }

    // Create session and return tokens
    const sessionData = await createUserSession(user);
    
    logger.info(`User logged in: ${user.email}`);
    
    res.json({
      message: 'Login successful',
      dailyReward: canClaimDailyReward ? {
        coins: parseInt(process.env.DAILY_LOGIN_COINS) || 10,
        streak: loginStreak,
        bonusCoins: Math.min(loginStreak * 2, 50)
      } : null,
      ...sessionData
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token required' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await db('users')
      .where('google_id', googleId)
      .orWhere('email', email)
      .first();

    if (user) {
      // Update Google ID if user exists but doesn't have it
      if (!user.google_id) {
        await db('users')
          .where({ id: user.id })
          .update({ 
            google_id: googleId,
            is_oauth_user: true,
            profile_picture_url: picture || user.profile_picture_url
          });
        user.google_id = googleId;
        user.is_oauth_user = true;
      }
    } else {
      // Create new user
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);
      
      [user] = await db('users')
        .insert({
          email,
          google_id: googleId,
          username,
          display_name: name,
          profile_picture_url: picture,
          is_oauth_user: true,
          is_verified: true,
          gender: 'prefer_not_to_say', // Default, user can update later
          coin_balance: 100,
          total_coins_earned: 100,
          last_login: new Date(),
          last_active: new Date()
        })
        .returning('*');

      // Create welcome coin transaction
      await db('coin_transactions').insert({
        user_id: user.id,
        type: 'daily_reward',
        amount: 100,
        balance_before: 0,
        balance_after: 100,
        description: 'Welcome bonus (Google signup)'
      });

      logger.info(`New Google user registered: ${user.email}`);
    }

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({
        last_login: new Date(),
        last_active: new Date()
      });

    // Create session and return tokens
    const sessionData = await createUserSession(user);
    
    res.json({
      message: 'Google login successful',
      ...sessionData
    });

  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user and session
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true, is_banned: false })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const session = await getUserSession(user.id);
    if (!session || session.tokenId !== decoded.tokenId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Generate new tokens
    const newTokenId = uuidv4();
    const newToken = generateToken(user.id, newTokenId);
    const newRefreshToken = generateRefreshToken(user.id, newTokenId);

    // Update session
    const newSessionData = {
      ...session,
      tokenId: newTokenId,
      refreshToken: newRefreshToken,
      refreshTime: new Date().toISOString()
    };

    await setUserSession(user.id, newSessionData, 7 * 24 * 60 * 60);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await deleteUserSession(req.user.id);
    
    logger.info(`User logged out: ${req.user.email}`);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select([
        'id', 'email', 'username', 'display_name', 'bio',
        'profile_picture_url', 'date_of_birth', 'gender',
        'location', 'interests', 'languages', 'preferred_language',
        'is_verified', 'is_premium', 'coin_balance',
        'show_location', 'show_age', 'allow_messages',
        'allow_video_calls', 'allow_voice_calls', 'profile_visibility',
        'age_range', 'gender_preference', 'max_distance_km',
        'login_streak', 'last_active', 'created_at'
      ])
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token (implement email sending logic here)
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db('users')
      .where({ id: user.id })
      .update({
        reset_token: resetToken,
        reset_expires: resetExpires
      });

    // TODO: Send email with reset link
    logger.info(`Password reset requested for: ${email}`);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

module.exports = router;