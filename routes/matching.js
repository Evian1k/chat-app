const express = require('express');
const { body, validationResult } = require('express-validator');

const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { deductCoins } = require('../services/coinService');
const logger = require('../utils/logger');

const router = express.Router();

// Get potential matches for user
router.get('/discover', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    // Get current user's preferences
    const currentUser = await db('users')
      .where('id', req.user.id)
      .select([
        'age_range', 'gender_preference', 'max_distance_km',
        'latitude', 'longitude', 'date_of_birth', 'gender'
      ])
      .first();

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ageRange = currentUser.age_range ? JSON.parse(currentUser.age_range) : { min: 18, max: 99 };
    const genderPreference = currentUser.gender_preference ? JSON.parse(currentUser.gender_preference) : ['male', 'female', 'other'];

    // Get users that current user has already interacted with
    const interactedUsers = await db('matches')
      .where(function() {
        this.where('user1_id', req.user.id).orWhere('user2_id', req.user.id);
      })
      .select(['user1_id', 'user2_id']);

    const excludedUserIds = [req.user.id];
    interactedUsers.forEach(match => {
      const otherUserId = match.user1_id === req.user.id ? match.user2_id : match.user1_id;
      if (!excludedUserIds.includes(otherUserId)) {
        excludedUserIds.push(otherUserId);
      }
    });

    // Build discovery query
    let query = db('users')
      .where('is_active', true)
      .where('is_banned', false)
      .whereNotIn('id', excludedUserIds)
      .where('profile_visibility', 'public');

    // Apply gender preference filter
    if (genderPreference.length > 0) {
      query = query.whereIn('gender', genderPreference);
    }

    // Apply age filter
    if (ageRange.min || ageRange.max) {
      const currentYear = new Date().getFullYear();
      
      if (ageRange.max) {
        const minBirthYear = currentYear - ageRange.max - 1;
        query = query.where('date_of_birth', '>=', `${minBirthYear}-01-01`);
      }
      
      if (ageRange.min) {
        const maxBirthYear = currentYear - ageRange.min;
        query = query.where('date_of_birth', '<=', `${maxBirthYear}-12-31`);
      }
    }

    // Apply distance filter if user has location
    if (currentUser.latitude && currentUser.longitude && currentUser.max_distance_km) {
      // Simple distance filter (you might want to use PostGIS for more accurate geo queries)
      const latRange = currentUser.max_distance_km / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngRange = currentUser.max_distance_km / (111 * Math.cos(currentUser.latitude * Math.PI / 180));
      
      query = query
        .whereBetween('latitude', [
          currentUser.latitude - latRange,
          currentUser.latitude + latRange
        ])
        .whereBetween('longitude', [
          currentUser.longitude - lngRange,
          currentUser.longitude + lngRange
        ]);
    }

    const potentialMatches = await query
      .select([
        'id', 'username', 'display_name', 'bio',
        'profile_picture_url', 'date_of_birth', 'gender',
        'location', 'interests', 'show_location', 'show_age',
        'is_verified', 'is_premium', 'last_active'
      ])
      .orderBy('last_active', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Process matches for response
    const processedMatches = potentialMatches.map(user => {
      const match = {
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
        match.location = user.location;
      }

      // Add age if user allows it
      if (user.show_age && user.date_of_birth) {
        const birthDate = new Date(user.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        match.age = age;
      }

      // Calculate compatibility score (simple example)
      match.compatibility_score = calculateCompatibilityScore(currentUser, user);

      return match;
    });

    // Sort by compatibility score
    processedMatches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    res.json({
      matches: processedMatches,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: processedMatches.length
      }
    });

  } catch (error) {
    logger.error('Discover matches error:', error);
    res.status(500).json({ error: 'Failed to discover matches' });
  }
});

// Like or pass on a user
router.post('/action', authenticateToken, [
  body('target_user_id').isUUID(),
  body('action').isIn(['like', 'pass', 'super_like'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { target_user_id, action } = req.body;

    if (target_user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot perform action on yourself' });
    }

    // Check if target user exists and is active
    const targetUser = await db('users')
      .where({ id: target_user_id, is_active: true, is_banned: false })
      .first();

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Check if action already exists
    const existingMatch = await db('matches')
      .where(function() {
        this.where({ user1_id: req.user.id, user2_id: target_user_id })
          .orWhere({ user1_id: target_user_id, user2_id: req.user.id });
      })
      .first();

    if (existingMatch) {
      return res.status(409).json({ error: 'Action already taken on this user' });
    }

    // Handle super like cost
    if (action === 'super_like') {
      const superLikeCost = parseInt(process.env.SUPER_MATCH_COST_COINS) || 10;
      const coinsDeducted = await deductCoins(req.user.id, superLikeCost, 'super_match_cost', {
        targetUserId: target_user_id
      });

      if (!coinsDeducted) {
        return res.status(402).json({ 
          error: 'Insufficient coins for super like',
          required: superLikeCost,
          type: 'insufficient_coins'
        });
      }
    }

    // Check if target user has already liked current user
    const reciprocalMatch = await db('matches')
      .where({ user1_id: target_user_id, user2_id: req.user.id, status: 'pending' })
      .first();

    let matchStatus = 'pending';
    let isMatch = false;

    if (action === 'like' || action === 'super_like') {
      if (reciprocalMatch) {
        // It's a match!
        matchStatus = 'matched';
        isMatch = true;

        // Update the existing match
        await db('matches')
          .where('id', reciprocalMatch.id)
          .update({
            status: 'matched',
            matched_at: new Date(),
            is_super_match: action === 'super_like' || reciprocalMatch.is_super_match
          });
      }

      // Create new match record
      const [newMatch] = await db('matches')
        .insert({
          user1_id: req.user.id,
          user2_id: target_user_id,
          status: matchStatus,
          initiated_by: req.user.id,
          is_super_match: action === 'super_like',
          matched_at: isMatch ? new Date() : null,
          compatibility_score: calculateCompatibilityScore(
            await db('users').where('id', req.user.id).first(),
            targetUser
          )
        })
        .returning('*');

      // If it's a match, create conversation
      if (isMatch) {
        const [conversation] = await db('conversations')
          .insert({
            match_id: reciprocalMatch ? reciprocalMatch.id : newMatch.id,
            user1_id: Math.min(req.user.id, target_user_id),
            user2_id: Math.max(req.user.id, target_user_id),
            status: 'active'
          })
          .returning('*');

        // Send match notification
        const { sendNotificationToUser, NotificationTemplates } = require('../services/notificationService');
        const currentUser = await db('users').where('id', req.user.id).first();
        
        await sendNotificationToUser(
          target_user_id,
          action === 'super_like' ? 
            NotificationTemplates.SUPER_MATCH(currentUser.display_name) :
            NotificationTemplates.NEW_MATCH(currentUser.display_name),
          {
            type: 'match',
            matchId: reciprocalMatch ? reciprocalMatch.id : newMatch.id,
            conversationId: conversation.id,
            userId: req.user.id
          }
        );

        logger.info(`New match created between ${req.user.id} and ${target_user_id}`);
      }

    } else if (action === 'pass') {
      // Create pass record
      await db('matches')
        .insert({
          user1_id: req.user.id,
          user2_id: target_user_id,
          status: 'rejected',
          initiated_by: req.user.id
        });
    }

    const response = {
      action,
      target_user_id,
      is_match: isMatch,
      message: isMatch ? 
        "It's a match! 🎉" : 
        `${action === 'super_like' ? 'Super like' : action.charAt(0).toUpperCase() + action.slice(1)} sent successfully`
    };

    if (isMatch) {
      response.conversation_id = (await db('conversations')
        .where(function() {
          this.where({ user1_id: req.user.id, user2_id: target_user_id })
            .orWhere({ user1_id: target_user_id, user2_id: req.user.id });
        })
        .first()).id;
    }

    res.json(response);

  } catch (error) {
    logger.error('Match action error:', error);
    res.status(500).json({ error: 'Failed to perform match action' });
  }
});

// Get user's matches
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'matched' } = req.query;

    const matches = await db('matches')
      .leftJoin('users as user1', 'matches.user1_id', 'user1.id')
      .leftJoin('users as user2', 'matches.user2_id', 'user2.id')
      .leftJoin('conversations', 'matches.id', 'conversations.match_id')
      .where(function() {
        this.where('matches.user1_id', req.user.id)
          .orWhere('matches.user2_id', req.user.id);
      })
      .where('matches.status', status)
      .select([
        'matches.*',
        'user1.id as user1_id',
        'user1.username as user1_username',
        'user1.display_name as user1_display_name',
        'user1.profile_picture_url as user1_profile_picture',
        'user2.id as user2_id',
        'user2.username as user2_username',
        'user2.display_name as user2_display_name',
        'user2.profile_picture_url as user2_profile_picture',
        'conversations.id as conversation_id',
        'conversations.last_message',
        'conversations.last_message_at',
        'conversations.unread_count_user1',
        'conversations.unread_count_user2'
      ])
      .orderBy('matches.matched_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Process matches for response
    const processedMatches = matches.map(match => {
      const otherUser = match.user1_id === req.user.id ? {
        id: match.user2_id,
        username: match.user2_username,
        display_name: match.user2_display_name,
        profile_picture_url: match.user2_profile_picture
      } : {
        id: match.user1_id,
        username: match.user1_username,
        display_name: match.user1_display_name,
        profile_picture_url: match.user1_profile_picture
      };

      const unreadCount = match.user1_id === req.user.id ? 
        match.unread_count_user1 : match.unread_count_user2;

      return {
        id: match.id,
        other_user: otherUser,
        compatibility_score: match.compatibility_score,
        is_super_match: match.is_super_match,
        matched_at: match.matched_at,
        conversation: match.conversation_id ? {
          id: match.conversation_id,
          last_message: match.last_message,
          last_message_at: match.last_message_at,
          unread_count: unreadCount || 0
        } : null,
        created_at: match.created_at
      };
    });

    res.json({
      matches: processedMatches,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: processedMatches.length
      }
    });

  } catch (error) {
    logger.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

// Unmatch with a user
router.delete('/matches/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Verify user is part of this match
    const match = await db('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .where('status', 'matched')
      .first();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update match status
    await db('matches')
      .where('id', matchId)
      .update({
        status: 'rejected',
        updated_at: new Date()
      });

    // Archive the conversation
    await db('conversations')
      .where('match_id', matchId)
      .update({
        status: 'archived',
        updated_at: new Date()
      });

    logger.info(`Match unmatched: ${matchId} by user ${req.user.id}`);

    res.json({ message: 'Successfully unmatched' });

  } catch (error) {
    logger.error('Unmatch error:', error);
    res.status(500).json({ error: 'Failed to unmatch' });
  }
});

// Get match statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await db('matches')
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .select([
        db.raw('COUNT(*) as total_interactions'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as total_matches', ['matched']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as total_likes_sent', ['pending']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as total_passes', ['rejected']),
        db.raw('COUNT(CASE WHEN is_super_match = true THEN 1 END) as super_matches'),
        db.raw('COUNT(CASE WHEN initiated_by = ? THEN 1 END) as actions_initiated', [req.user.id])
      ])
      .first();

    // Get likes received (where current user is user2 and status is pending)
    const likesReceived = await db('matches')
      .where('user2_id', req.user.id)
      .where('status', 'pending')
      .count('* as count')
      .first();

    const processedStats = {
      total_interactions: parseInt(stats.total_interactions),
      total_matches: parseInt(stats.total_matches),
      total_likes_sent: parseInt(stats.total_likes_sent),
      total_passes: parseInt(stats.total_passes),
      super_matches: parseInt(stats.super_matches),
      actions_initiated: parseInt(stats.actions_initiated),
      likes_received: parseInt(likesReceived.count),
      match_rate: stats.total_interactions > 0 ? 
        ((parseInt(stats.total_matches) / parseInt(stats.total_interactions)) * 100).toFixed(1) : 0
    };

    res.json({ stats: processedStats });

  } catch (error) {
    logger.error('Get match stats error:', error);
    res.status(500).json({ error: 'Failed to get match statistics' });
  }
});

// Get users who liked current user
router.get('/likes-received', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const likes = await db('matches')
      .leftJoin('users', 'matches.user1_id', 'users.id')
      .where('matches.user2_id', req.user.id)
      .where('matches.status', 'pending')
      .where('users.is_active', true)
      .where('users.is_banned', false)
      .select([
        'matches.id as match_id',
        'matches.is_super_match',
        'matches.created_at as liked_at',
        'users.id',
        'users.username',
        'users.display_name',
        'users.profile_picture_url',
        'users.bio',
        'users.date_of_birth',
        'users.gender',
        'users.location',
        'users.interests',
        'users.show_location',
        'users.show_age',
        'users.is_verified',
        'users.is_premium'
      ])
      .orderBy('matches.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Process likes for response
    const processedLikes = likes.map(like => {
      const user = {
        id: like.id,
        username: like.username,
        display_name: like.display_name,
        bio: like.bio,
        profile_picture_url: like.profile_picture_url,
        gender: like.gender,
        interests: like.interests ? JSON.parse(like.interests) : [],
        is_verified: like.is_verified,
        is_premium: like.is_premium,
        is_super_match: like.is_super_match,
        liked_at: like.liked_at,
        match_id: like.match_id
      };

      // Add location if user allows it
      if (like.show_location && like.location) {
        user.location = like.location;
      }

      // Add age if user allows it
      if (like.show_age && like.date_of_birth) {
        const birthDate = new Date(like.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        user.age = age;
      }

      return user;
    });

    res.json({
      likes: processedLikes,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: processedLikes.length
      }
    });

  } catch (error) {
    logger.error('Get likes received error:', error);
    res.status(500).json({ error: 'Failed to get likes received' });
  }
});

// Helper function to calculate compatibility score
function calculateCompatibilityScore(user1, user2) {
  let score = 0;

  // Age compatibility (closer ages get higher score)
  if (user1.date_of_birth && user2.date_of_birth) {
    const age1 = new Date().getFullYear() - new Date(user1.date_of_birth).getFullYear();
    const age2 = new Date().getFullYear() - new Date(user2.date_of_birth).getFullYear();
    const ageDiff = Math.abs(age1 - age2);
    
    if (ageDiff <= 2) score += 30;
    else if (ageDiff <= 5) score += 20;
    else if (ageDiff <= 10) score += 10;
  }

  // Interest compatibility
  if (user1.interests && user2.interests) {
    const interests1 = JSON.parse(user1.interests);
    const interests2 = JSON.parse(user2.interests);
    const commonInterests = interests1.filter(interest => 
      interests2.some(i => i.toLowerCase() === interest.toLowerCase())
    );
    score += Math.min(commonInterests.length * 10, 40);
  }

  // Location proximity (if both have location)
  if (user1.latitude && user1.longitude && user2.latitude && user2.longitude) {
    const distance = calculateDistance(
      user1.latitude, user1.longitude,
      user2.latitude, user2.longitude
    );
    
    if (distance <= 10) score += 20;
    else if (distance <= 50) score += 15;
    else if (distance <= 100) score += 10;
    else if (distance <= 500) score += 5;
  }

  // Activity level (recent activity gets bonus)
  if (user2.last_active) {
    const daysSinceActive = (Date.now() - new Date(user2.last_active).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive <= 1) score += 10;
    else if (daysSinceActive <= 7) score += 5;
  }

  // Random factor to add variety
  score += Math.random() * 10;

  return Math.min(Math.round(score), 100);
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;