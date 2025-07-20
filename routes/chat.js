const express = require('express');
const { body, validationResult } = require('express-validator');

const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const conversations = await db('conversations')
      .leftJoin('users as user1', 'conversations.user1_id', 'user1.id')
      .leftJoin('users as user2', 'conversations.user2_id', 'user2.id')
      .leftJoin('users as last_sender', 'conversations.last_message_by', 'last_sender.id')
      .where(function() {
        this.where('conversations.user1_id', req.user.id)
          .orWhere('conversations.user2_id', req.user.id);
      })
      .where('conversations.status', 'active')
      .where('conversations.is_blocked', false)
      .select([
        'conversations.*',
        'user1.id as user1_id',
        'user1.username as user1_username',
        'user1.display_name as user1_display_name',
        'user1.profile_picture_url as user1_profile_picture',
        'user2.id as user2_id',
        'user2.username as user2_username',
        'user2.display_name as user2_display_name',
        'user2.profile_picture_url as user2_profile_picture',
        'last_sender.display_name as last_sender_name'
      ])
      .orderBy('conversations.last_message_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Process conversations for response
    const processedConversations = conversations.map(conv => {
      const otherUser = conv.user1_id === req.user.id ? {
        id: conv.user2_id,
        username: conv.user2_username,
        display_name: conv.user2_display_name,
        profile_picture_url: conv.user2_profile_picture
      } : {
        id: conv.user1_id,
        username: conv.user1_username,
        display_name: conv.user1_display_name,
        profile_picture_url: conv.user1_profile_picture
      };

      const unreadCount = conv.user1_id === req.user.id ? 
        conv.unread_count_user1 : conv.unread_count_user2;

      const isMuted = conv.user1_id === req.user.id ? 
        conv.is_muted_user1 : conv.is_muted_user2;

      return {
        id: conv.id,
        match_id: conv.match_id,
        other_user: otherUser,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        last_sender_name: conv.last_sender_name,
        unread_count: unreadCount,
        is_muted: isMuted,
        total_calls: conv.total_calls,
        last_call_at: conv.last_call_at,
        created_at: conv.created_at
      };
    });

    res.json({
      conversations: processedConversations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: processedConversations.length
      }
    });

  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0, before } = req.query;

    // Verify user has access to conversation
    const conversation = await db('conversations')
      .where('id', conversationId)
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .first();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.is_blocked) {
      return res.status(403).json({ error: 'Conversation is blocked' });
    }

    let query = db('messages')
      .leftJoin('users as sender', 'messages.sender_id', 'sender.id')
      .where('messages.conversation_id', conversationId)
      .where('messages.is_deleted', false)
      .select([
        'messages.*',
        'sender.username as sender_username',
        'sender.display_name as sender_display_name',
        'sender.profile_picture_url as sender_profile_picture'
      ]);

    // Add before filter for pagination
    if (before) {
      query = query.where('messages.created_at', '<', before);
    }

    const messages = await query
      .orderBy('messages.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Process messages for response
    const processedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender: {
        id: msg.sender_id,
        username: msg.sender_username,
        display_name: msg.sender_display_name,
        profile_picture_url: msg.sender_profile_picture
      },
      recipient_id: msg.recipient_id,
      content: msg.content,
      type: msg.type,
      media_urls: msg.media_urls ? JSON.parse(msg.media_urls) : null,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
      status: msg.status,
      delivered_at: msg.delivered_at,
      read_at: msg.read_at,
      is_translated: msg.is_translated,
      original_content: msg.original_content,
      translated_language: msg.translated_language,
      reactions: msg.reactions ? JSON.parse(msg.reactions) : {},
      is_edited: msg.is_edited,
      edited_at: msg.edited_at,
      coins_cost: msg.coins_cost,
      created_at: msg.created_at
    }));

    res.json({
      messages: processedMessages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: processedMessages.length,
        before: processedMessages.length > 0 ? processedMessages[0].created_at : null
      }
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Create conversation (usually happens automatically on match)
router.post('/conversations', authenticateToken, [
  body('match_id').isUUID(),
  body('initial_message').optional().isString().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { match_id, initial_message } = req.body;

    // Verify match exists and user is part of it
    const match = await db('matches')
      .where('id', match_id)
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .where('status', 'matched')
      .first();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if conversation already exists
    const existingConversation = await db('conversations')
      .where('match_id', match_id)
      .first();

    if (existingConversation) {
      return res.status(409).json({ 
        error: 'Conversation already exists',
        conversation_id: existingConversation.id
      });
    }

    const otherUserId = match.user1_id === req.user.id ? match.user2_id : match.user1_id;

    // Create conversation
    const [conversation] = await db('conversations')
      .insert({
        match_id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        status: 'active'
      })
      .returning('*');

    // Send initial message if provided
    if (initial_message) {
      const [message] = await db('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: req.user.id,
          recipient_id: otherUserId,
          content: initial_message,
          type: 'text',
          status: 'sent'
        })
        .returning('*');

      // Update conversation with last message
      await db('conversations')
        .where('id', conversation.id)
        .update({
          last_message: initial_message.substring(0, 100),
          last_message_at: new Date(),
          last_message_by: req.user.id,
          [`unread_count_user${match.user1_id === req.user.id ? '2' : '1'}`]: 1
        });
    }

    logger.info(`Conversation created: ${conversation.id} for match ${match_id}`);

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: {
        id: conversation.id,
        match_id: conversation.match_id,
        created_at: conversation.created_at
      }
    });

  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Mute/unmute conversation
router.put('/conversations/:conversationId/mute', authenticateToken, [
  body('muted').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId } = req.params;
    const { muted } = req.body;

    // Verify user has access to conversation
    const conversation = await db('conversations')
      .where('id', conversationId)
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .first();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const muteField = conversation.user1_id === req.user.id ? 
      'is_muted_user1' : 'is_muted_user2';

    await db('conversations')
      .where('id', conversationId)
      .update({
        [muteField]: muted,
        updated_at: new Date()
      });

    logger.info(`Conversation ${muted ? 'muted' : 'unmuted'}: ${conversationId} by user ${req.user.id}`);

    res.json({ 
      message: `Conversation ${muted ? 'muted' : 'unmuted'} successfully` 
    });

  } catch (error) {
    logger.error('Mute conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation mute status' });
  }
});

// Archive conversation
router.put('/conversations/:conversationId/archive', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user has access to conversation
    const conversation = await db('conversations')
      .where('id', conversationId)
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .first();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await db('conversations')
      .where('id', conversationId)
      .update({
        status: 'archived',
        updated_at: new Date()
      });

    logger.info(`Conversation archived: ${conversationId} by user ${req.user.id}`);

    res.json({ message: 'Conversation archived successfully' });

  } catch (error) {
    logger.error('Archive conversation error:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Verify user owns the message
    const message = await db('messages')
      .where('id', messageId)
      .where('sender_id', req.user.id)
      .first();

    if (!message) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    // Soft delete the message
    await db('messages')
      .where('id', messageId)
      .update({
        is_deleted: true,
        deleted_at: new Date(),
        content: null,
        media_urls: null
      });

    logger.info(`Message deleted: ${messageId} by user ${req.user.id}`);

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Edit message
router.put('/messages/:messageId', authenticateToken, [
  body('content').notEmpty().isString().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    // Verify user owns the message
    const message = await db('messages')
      .where('id', messageId)
      .where('sender_id', req.user.id)
      .where('is_deleted', false)
      .first();

    if (!message) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    // Check if message is too old to edit (e.g., 1 hour)
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    const maxEditTime = 60 * 60 * 1000; // 1 hour

    if (messageAge > maxEditTime) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    // Store edit history
    let editHistory = [];
    if (message.edit_history) {
      editHistory = JSON.parse(message.edit_history);
    }
    editHistory.push({
      content: message.content,
      edited_at: new Date()
    });

    // Update message
    await db('messages')
      .where('id', messageId)
      .update({
        content,
        is_edited: true,
        edited_at: new Date(),
        edit_history: JSON.stringify(editHistory)
      });

    logger.info(`Message edited: ${messageId} by user ${req.user.id}`);

    res.json({ message: 'Message edited successfully' });

  } catch (error) {
    logger.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', authenticateToken, [
  body('emoji').notEmpty().isString().isLength({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    // Verify user has access to the message
    const message = await db('messages')
      .leftJoin('conversations', 'messages.conversation_id', 'conversations.id')
      .where('messages.id', messageId)
      .where(function() {
        this.where('conversations.user1_id', req.user.id)
          .orWhere('conversations.user2_id', req.user.id);
      })
      .where('messages.is_deleted', false)
      .select('messages.*')
      .first();

    if (!message) {
      return res.status(404).json({ error: 'Message not found or access denied' });
    }

    // Get current reactions
    let reactions = message.reactions ? JSON.parse(message.reactions) : {};

    // Initialize emoji array if it doesn't exist
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    // Check if user already reacted with this emoji
    const userIndex = reactions[emoji].indexOf(req.user.id);

    if (userIndex > -1) {
      // Remove reaction
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji].push(req.user.id);
    }

    // Update message reactions
    await db('messages')
      .where('id', messageId)
      .update({
        reactions: JSON.stringify(reactions),
        updated_at: new Date()
      });

    logger.info(`Message reaction updated: ${messageId} by user ${req.user.id} (${emoji})`);

    res.json({ 
      message: 'Reaction updated successfully',
      reactions 
    });

  } catch (error) {
    logger.error('Message reaction error:', error);
    res.status(500).json({ error: 'Failed to update message reaction' });
  }
});

// Get conversation statistics
router.get('/conversations/:conversationId/stats', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user has access to conversation
    const conversation = await db('conversations')
      .where('id', conversationId)
      .where(function() {
        this.where('user1_id', req.user.id)
          .orWhere('user2_id', req.user.id);
      })
      .first();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get message statistics
    const messageStats = await db('messages')
      .where('conversation_id', conversationId)
      .where('is_deleted', false)
      .select([
        db.raw('COUNT(*) as total_messages'),
        db.raw('COUNT(CASE WHEN sender_id = ? THEN 1 END) as messages_sent', [req.user.id]),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as text_messages', ['text']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as image_messages', ['image']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as voice_messages', ['audio']),
        db.raw('COUNT(CASE WHEN type = ? THEN 1 END) as video_messages', ['video'])
      ])
      .first();

    const stats = {
      conversation_id: conversationId,
      total_messages: parseInt(messageStats.total_messages),
      messages_sent: parseInt(messageStats.messages_sent),
      messages_received: parseInt(messageStats.total_messages) - parseInt(messageStats.messages_sent),
      message_types: {
        text: parseInt(messageStats.text_messages),
        image: parseInt(messageStats.image_messages),
        voice: parseInt(messageStats.voice_messages),
        video: parseInt(messageStats.video_messages)
      },
      total_calls: conversation.total_calls,
      total_call_duration: conversation.total_call_duration,
      last_call_at: conversation.last_call_at,
      created_at: conversation.created_at
    };

    res.json({ stats });

  } catch (error) {
    logger.error('Get conversation stats error:', error);
    res.status(500).json({ error: 'Failed to get conversation statistics' });
  }
});

module.exports = router;