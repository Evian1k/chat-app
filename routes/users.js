const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('display_name').optional().isLength({ min: 1, max: 50 }).trim(),
  body('bio').optional().isLength({ max: 500 }).trim(),
  body('location').optional().isLength({ max: 100 }).trim(),
  body('interests').optional().isArray(),
  body('languages').optional().isArray(),
  body('preferred_language').optional().isLength({ min: 2, max: 5 }),
  body('date_of_birth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      display_name,
      bio,
      location,
      interests,
      languages,
      preferred_language,
      date_of_birth,
      gender,
      latitude,
      longitude
    } = req.body;

    const updateData = {};
    
    if (display_name !== undefined) updateData.display_name = display_name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (interests !== undefined) updateData.interests = JSON.stringify(interests);
    if (languages !== undefined) updateData.languages = JSON.stringify(languages);
    if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gender !== undefined) updateData.gender = gender;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await db('users')
      .where('id', req.user.id)
      .update(updateData)
      .returning([
        'id', 'email', 'username', 'display_name', 'bio',
        'profile_picture_url', 'date_of_birth', 'gender',
        'location', 'interests', 'languages', 'preferred_language',
        'latitude', 'longitude', 'updated_at'
      ]);

    logger.info(`User profile updated: ${req.user.id}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post('/profile-picture', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: 'Image upload service not configured' });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'chatzone/profile_pictures',
          public_id: `user_${req.user.id}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user's profile picture URL
    const [updatedUser] = await db('users')
      .where('id', req.user.id)
      .update({
        profile_picture_url: uploadResult.secure_url,
        updated_at: new Date()
      })
      .returning(['id', 'profile_picture_url']);

    logger.info(`Profile picture updated: ${req.user.id}`);

    res.json({
      message: 'Profile picture updated successfully',
      profile_picture_url: updatedUser.profile_picture_url
    });

  } catch (error) {
    logger.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Update privacy settings
router.put('/privacy', authenticateToken, [
  body('show_location').optional().isBoolean(),
  body('show_age').optional().isBoolean(),
  body('allow_messages').optional().isBoolean(),
  body('allow_video_calls').optional().isBoolean(),
  body('allow_voice_calls').optional().isBoolean(),
  body('profile_visibility').optional().isIn(['public', 'matches_only', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      show_location,
      show_age,
      allow_messages,
      allow_video_calls,
      allow_voice_calls,
      profile_visibility
    } = req.body;

    const updateData = {};
    
    if (show_location !== undefined) updateData.show_location = show_location;
    if (show_age !== undefined) updateData.show_age = show_age;
    if (allow_messages !== undefined) updateData.allow_messages = allow_messages;
    if (allow_video_calls !== undefined) updateData.allow_video_calls = allow_video_calls;
    if (allow_voice_calls !== undefined) updateData.allow_voice_calls = allow_voice_calls;
    if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateData.updated_at = new Date();

    await db('users')
      .where('id', req.user.id)
      .update(updateData);

    logger.info(`Privacy settings updated: ${req.user.id}`);

    res.json({ message: 'Privacy settings updated successfully' });

  } catch (error) {
    logger.error('Privacy settings update error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Update matching preferences
router.put('/preferences', authenticateToken, [
  body('age_range').optional().isObject(),
  body('age_range.min').optional().isInt({ min: 18, max: 99 }),
  body('age_range.max').optional().isInt({ min: 18, max: 99 }),
  body('gender_preference').optional().isArray(),
  body('max_distance_km').optional().isInt({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { age_range, gender_preference, max_distance_km } = req.body;

    const updateData = {};
    
    if (age_range !== undefined) {
      // Validate age range
      if (age_range.min && age_range.max && age_range.min > age_range.max) {
        return res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' });
      }
      updateData.age_range = JSON.stringify(age_range);
    }
    
    if (gender_preference !== undefined) updateData.gender_preference = JSON.stringify(gender_preference);
    if (max_distance_km !== undefined) updateData.max_distance_km = max_distance_km;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateData.updated_at = new Date();

    await db('users')
      .where('id', req.user.id)
      .update(updateData);

    logger.info(`Matching preferences updated: ${req.user.id}`);

    res.json({ message: 'Matching preferences updated successfully' });

  } catch (error) {
    logger.error('Matching preferences update error:', error);
    res.status(500).json({ error: 'Failed to update matching preferences' });
  }
});

// Get user profile by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await db('users')
      .where({ id: userId, is_active: true, is_banned: false })
      .select([
        'id', 'username', 'display_name', 'bio',
        'profile_picture_url', 'date_of_birth', 'gender',
        'location', 'interests', 'languages',
        'show_location', 'show_age', 'profile_visibility',
        'is_verified', 'is_premium', 'last_active', 'created_at'
      ])
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check privacy settings
    if (user.profile_visibility === 'private') {
      return res.status(403).json({ error: 'Profile is private' });
    }

    // Check if users are matched (for matches_only visibility)
    if (user.profile_visibility === 'matches_only') {
      const match = await db('matches')
        .where(function() {
          this.where({ user1_id: req.user.id, user2_id: userId })
            .orWhere({ user1_id: userId, user2_id: req.user.id });
        })
        .where('status', 'matched')
        .first();

      if (!match) {
        return res.status(403).json({ error: 'Profile is only visible to matches' });
      }
    }

    // Filter out sensitive information based on privacy settings
    const publicProfile = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      bio: user.bio,
      profile_picture_url: user.profile_picture_url,
      gender: user.gender,
      interests: user.interests ? JSON.parse(user.interests) : [],
      languages: user.languages ? JSON.parse(user.languages) : [],
      is_verified: user.is_verified,
      is_premium: user.is_premium,
      created_at: user.created_at
    };

    // Add location if user allows it
    if (user.show_location && user.location) {
      publicProfile.location = user.location;
    }

    // Add age if user allows it
    if (user.show_age && user.date_of_birth) {
      const birthDate = new Date(user.date_of_birth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      publicProfile.age = age;
    }

    // Add online status
    const { isUserOnline } = require('../config/redis');
    publicProfile.is_online = await isUserOnline(userId);
    publicProfile.last_active = user.last_active;

    res.json({ user: publicProfile });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      query,
      gender,
      min_age,
      max_age,
      location,
      max_distance,
      interests,
      limit = 20,
      offset = 0
    } = req.query;

    let searchQuery = db('users')
      .where('is_active', true)
      .where('is_banned', false)
      .whereNot('id', req.user.id)
      .where('profile_visibility', 'public');

    // Text search in display name and bio
    if (query) {
      searchQuery = searchQuery.where(function() {
        this.whereILike('display_name', `%${query}%`)
          .orWhereILike('bio', `%${query}%`)
          .orWhereILike('username', `%${query}%`);
      });
    }

    // Gender filter
    if (gender) {
      searchQuery = searchQuery.where('gender', gender);
    }

    // Age filter
    if (min_age || max_age) {
      const currentYear = new Date().getFullYear();
      
      if (max_age) {
        const minBirthYear = currentYear - parseInt(max_age) - 1;
        searchQuery = searchQuery.where('date_of_birth', '>=', `${minBirthYear}-01-01`);
      }
      
      if (min_age) {
        const maxBirthYear = currentYear - parseInt(min_age);
        searchQuery = searchQuery.where('date_of_birth', '<=', `${maxBirthYear}-12-31`);
      }
    }

    // Location filter (basic - you might want to implement proper geo-search)
    if (location) {
      searchQuery = searchQuery.whereILike('location', `%${location}%`);
    }

    // Interests filter
    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      searchQuery = searchQuery.where(function() {
        interestArray.forEach(interest => {
          this.orWhereRaw("interests::text ILIKE ?", [`%${interest}%`]);
        });
      });
    }

    const users = await searchQuery
      .select([
        'id', 'username', 'display_name', 'bio',
        'profile_picture_url', 'date_of_birth', 'gender',
        'location', 'interests', 'show_location', 'show_age',
        'is_verified', 'is_premium', 'last_active'
      ])
      .orderBy('last_active', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Process users for public display
    const processedUsers = users.map(user => {
      const publicUser = {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        profile_picture_url: user.profile_picture_url,
        gender: user.gender,
        interests: user.interests ? JSON.parse(user.interests) : [],
        is_verified: user.is_verified,
        is_premium: user.is_premium
      };

      // Add location if user allows it
      if (user.show_location && user.location) {
        publicUser.location = user.location;
      }

      // Add age if user allows it
      if (user.show_age && user.date_of_birth) {
        const birthDate = new Date(user.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        publicUser.age = age;
      }

      return publicUser;
    });

    res.json({
      users: processedUsers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: processedUsers.length
      }
    });

  } catch (error) {
    logger.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Block user
router.post('/:userId/block', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if user exists
    const targetUser = await db('users')
      .where({ id: userId, is_active: true })
      .first();

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Block in any existing conversations
    await db('conversations')
      .where(function() {
        this.where({ user1_id: req.user.id, user2_id: userId })
          .orWhere({ user1_id: userId, user2_id: req.user.id });
      })
      .update({
        is_blocked: true,
        blocked_by: req.user.id,
        blocked_at: new Date()
      });

    // Update or reject any matches
    await db('matches')
      .where(function() {
        this.where({ user1_id: req.user.id, user2_id: userId })
          .orWhere({ user1_id: userId, user2_id: req.user.id });
      })
      .update({ status: 'blocked' });

    // Create block record (you might want to add a blocks table)
    // For now, we'll just log it
    logger.info(`User ${req.user.id} blocked user ${userId}. Reason: ${reason || 'No reason provided'}`);

    res.json({ message: 'User blocked successfully' });

  } catch (error) {
    logger.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Report user
router.post('/:userId/report', authenticateToken, [
  body('reason').notEmpty().isLength({ max: 500 }),
  body('category').isIn(['spam', 'harassment', 'fake_profile', 'inappropriate_content', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { reason, category } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Check if user exists
    const targetUser = await db('users')
      .where({ id: userId, is_active: true })
      .first();

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create report record (you might want to add a reports table)
    // For now, we'll just log it
    logger.warn(`User reported: ${userId} by ${req.user.id}. Category: ${category}, Reason: ${reason}`);

    res.json({ message: 'User reported successfully. Thank you for helping keep our community safe.' });

  } catch (error) {
    logger.error('Report user error:', error);
    res.status(500).json({ error: 'Failed to report user' });
  }
});

// Update device token for push notifications
router.post('/device-token', authenticateToken, [
  body('token').notEmpty().isString(),
  body('platform').isIn(['ios', 'android', 'web'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, platform } = req.body;

    // Get current device tokens
    const user = await db('users')
      .where('id', req.user.id)
      .select('device_tokens')
      .first();

    let deviceTokens = user.device_tokens ? JSON.parse(user.device_tokens) : [];

    // Remove existing token if it exists
    deviceTokens = deviceTokens.filter(t => t !== token);

    // Add new token
    deviceTokens.push(token);

    // Keep only last 5 tokens per user
    if (deviceTokens.length > 5) {
      deviceTokens = deviceTokens.slice(-5);
    }

    // Update user's device tokens
    await db('users')
      .where('id', req.user.id)
      .update({
        device_tokens: JSON.stringify(deviceTokens),
        updated_at: new Date()
      });

    logger.info(`Device token updated for user ${req.user.id} (${platform})`);

    res.json({ message: 'Device token updated successfully' });

  } catch (error) {
    logger.error('Device token update error:', error);
    res.status(500).json({ error: 'Failed to update device token' });
  }
});

// Delete account
router.delete('/account', authenticateToken, [
  body('password').notEmpty(),
  body('reason').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, reason } = req.body;

    // Verify password for non-OAuth users
    const user = await db('users')
      .where('id', req.user.id)
      .first();

    if (!user.is_oauth_user) {
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Soft delete user account
    await db('users')
      .where('id', req.user.id)
      .update({
        is_active: false,
        email: `deleted_${Date.now()}_${user.email}`,
        username: `deleted_${Date.now()}_${user.username}`,
        deleted_at: new Date(),
        deletion_reason: reason || 'User requested deletion'
      });

    // Delete user session
    const { deleteUserSession } = require('../config/redis');
    await deleteUserSession(req.user.id);

    logger.info(`User account deleted: ${req.user.id}. Reason: ${reason || 'No reason provided'}`);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;