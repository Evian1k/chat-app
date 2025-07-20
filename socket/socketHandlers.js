const { db } = require('../config/database');
const { 
  setUserOnline, 
  setUserOffline, 
  joinRoom, 
  leaveRoom, 
  getRoomUsers,
  isUserOnline 
} = require('../config/redis');
const logger = require('../utils/logger');
const { translateText } = require('../services/translationService');
const { deductCoins } = require('../services/coinService');
const { sendPushNotification } = require('../services/notificationService');

module.exports = (io, socket) => {
  const userId = socket.userId;
  const user = socket.user;

  // Set user online when connected
  setUserOnline(userId, socket.id);
  socket.join(`user_${userId}`);

  logger.info(`User ${user.username} connected with socket ${socket.id}`);

  // Join user's active conversations
  socket.on('join_conversations', async () => {
    try {
      const conversations = await db('conversations')
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .where('status', 'active')
        .select('id');

      for (const conv of conversations) {
        socket.join(`conversation_${conv.id}`);
        await joinRoom(userId, conv.id);
      }

      socket.emit('conversations_joined', { count: conversations.length });
    } catch (error) {
      logger.error('Error joining conversations:', error);
      socket.emit('error', { message: 'Failed to join conversations' });
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text', mediaUrls, metadata } = data;

      // Validate conversation access
      const conversation = await db('conversations')
        .where('id', conversationId)
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .where('is_blocked', false)
        .first();

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found or access denied' });
      }

      const recipientId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;

      // Check if user has enough coins
      const messageCost = parseInt(process.env.MESSAGE_COST_COINS) || 1;
      if (type !== 'system') {
        const coinsDeducted = await deductCoins(userId, messageCost, 'message_cost', {
          conversationId,
          recipientId
        });

        if (!coinsDeducted) {
          return socket.emit('error', { 
            message: 'Insufficient coins',
            required: messageCost,
            type: 'insufficient_coins'
          });
        }
      }

      // Create message
      const [message] = await db('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: recipientId,
          content,
          type,
          media_urls: mediaUrls ? JSON.stringify(mediaUrls) : null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          coins_cost: type !== 'system' ? messageCost : 0,
          status: 'sent'
        })
        .returning('*');

      // Update conversation
      await db('conversations')
        .where('id', conversationId)
        .update({
          last_message: content.substring(0, 100),
          last_message_at: new Date(),
          last_message_by: userId,
          [`unread_count_user${conversation.user1_id === userId ? '2' : '1'}`]: db.raw('?? + 1', 
            [`unread_count_user${conversation.user1_id === userId ? '2' : '1'}`])
        });

      // Get sender info for the message
      const messageWithSender = await db('messages')
        .leftJoin('users as sender', 'messages.sender_id', 'sender.id')
        .where('messages.id', message.id)
        .select(
          'messages.*',
          'sender.username as sender_username',
          'sender.display_name as sender_display_name',
          'sender.profile_picture_url as sender_profile_picture'
        )
        .first();

      // Emit to conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', messageWithSender);

      // Send push notification if recipient is offline
      const isRecipientOnline = await isUserOnline(recipientId);
      if (!isRecipientOnline) {
        const recipient = await db('users')
          .where('id', recipientId)
          .select('device_tokens', 'display_name')
          .first();

        if (recipient && recipient.device_tokens) {
          const deviceTokens = JSON.parse(recipient.device_tokens);
          await sendPushNotification(deviceTokens, {
            title: `New message from ${user.display_name}`,
            body: content.substring(0, 100),
            data: {
              type: 'message',
              conversationId,
              senderId: userId
            }
          });
        }
      }

      // Update message status to delivered
      await db('messages')
        .where('id', message.id)
        .update({ 
          status: 'delivered',
          delivered_at: new Date()
        });

      socket.emit('message_sent', { messageId: message.id, status: 'delivered' });

    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { conversationId, messageIds } = data;

      // Validate conversation access
      const conversation = await db('conversations')
        .where('id', conversationId)
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .first();

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      // Update messages to read
      await db('messages')
        .whereIn('id', messageIds)
        .where('recipient_id', userId)
        .where('status', '!=', 'read')
        .update({
          status: 'read',
          read_at: new Date()
        });

      // Reset unread count for this user
      const unreadCountField = conversation.user1_id === userId ? 'unread_count_user1' : 'unread_count_user2';
      await db('conversations')
        .where('id', conversationId)
        .update({ [unreadCountField]: 0 });

      // Notify sender that messages were read
      const senderId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
      io.to(`user_${senderId}`).emit('messages_read', {
        conversationId,
        messageIds,
        readBy: userId
      });

      socket.emit('messages_marked_read', { conversationId, messageIds });

    } catch (error) {
      logger.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Translate message
  socket.on('translate_message', async (data) => {
    try {
      const { messageId, targetLanguage } = data;

      const message = await db('messages')
        .where('id', messageId)
        .where(function() {
          this.where('sender_id', userId).orWhere('recipient_id', userId);
        })
        .first();

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (!message.content) {
        return socket.emit('error', { message: 'No content to translate' });
      }

      const translatedText = await translateText(message.content, targetLanguage);

      if (translatedText) {
        // Update message with translation
        await db('messages')
          .where('id', messageId)
          .update({
            original_content: message.original_content || message.content,
            original_language: message.original_language || 'auto',
            translated_language: targetLanguage,
            is_translated: true,
            content: translatedText
          });

        socket.emit('message_translated', {
          messageId,
          translatedText,
          targetLanguage,
          originalText: message.original_content || message.content
        });
      } else {
        socket.emit('error', { message: 'Translation failed' });
      }

    } catch (error) {
      logger.error('Error translating message:', error);
      socket.emit('error', { message: 'Translation failed' });
    }
  });

  // Start typing indicator
  socket.on('start_typing', async (data) => {
    try {
      const { conversationId } = data;

      // Validate conversation access
      const conversation = await db('conversations')
        .where('id', conversationId)
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .first();

      if (!conversation) {
        return;
      }

      // Notify other user in conversation
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        username: user.username,
        conversationId
      });

    } catch (error) {
      logger.error('Error handling typing indicator:', error);
    }
  });

  // Stop typing indicator
  socket.on('stop_typing', async (data) => {
    try {
      const { conversationId } = data;

      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId,
        conversationId
      });

    } catch (error) {
      logger.error('Error handling stop typing:', error);
    }
  });

  // Video call events
  socket.on('initiate_video_call', async (data) => {
    try {
      const { conversationId, callType = 'video' } = data; // 'video' or 'voice'

      const conversation = await db('conversations')
        .where('id', conversationId)
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .where('is_blocked', false)
        .first();

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      const recipientId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;

      // Check if recipient allows calls
      const recipient = await db('users')
        .where('id', recipientId)
        .first();

      const allowsCalls = callType === 'video' ? recipient.allow_video_calls : recipient.allow_voice_calls;
      if (!allowsCalls) {
        return socket.emit('call_rejected', { 
          reason: `Recipient doesn't allow ${callType} calls` 
        });
      }

      // Check coins
      const callCost = callType === 'video' ? 
        parseInt(process.env.VIDEO_CALL_COST_COINS) || 5 : 
        parseInt(process.env.VOICE_CALL_COST_COINS) || 3;

      const userBalance = await db('users')
        .where('id', userId)
        .select('coin_balance')
        .first();

      if (userBalance.coin_balance < callCost) {
        return socket.emit('error', { 
          message: 'Insufficient coins for call',
          required: callCost,
          current: userBalance.coin_balance,
          type: 'insufficient_coins'
        });
      }

      // Generate call ID
      const callId = require('uuid').v4();

      // Emit call invitation to recipient
      io.to(`user_${recipientId}`).emit('incoming_call', {
        callId,
        callType,
        conversationId,
        from: {
          id: userId,
          username: user.username,
          display_name: user.display_name,
          profile_picture_url: user.profile_picture_url
        }
      });

      // Store call initiation
      socket.callId = callId;
      socket.callType = callType;
      socket.callCost = callCost;

      socket.emit('call_initiated', { callId, callType });

    } catch (error) {
      logger.error('Error initiating call:', error);
      socket.emit('error', { message: 'Failed to initiate call' });
    }
  });

  // Accept call
  socket.on('accept_call', async (data) => {
    try {
      const { callId } = data;

      // Find the caller's socket
      const callerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.callId === callId);

      if (!callerSocket) {
        return socket.emit('error', { message: 'Call not found' });
      }

      // Deduct coins from caller
      const coinsDeducted = await deductCoins(
        callerSocket.userId, 
        callerSocket.callCost, 
        callerSocket.callType === 'video' ? 'video_call_cost' : 'voice_call_cost'
      );

      if (!coinsDeducted) {
        callerSocket.emit('call_rejected', { reason: 'Insufficient coins' });
        return socket.emit('call_ended', { reason: 'Caller has insufficient coins' });
      }

      // Join call room
      const callRoom = `call_${callId}`;
      socket.join(callRoom);
      callerSocket.join(callRoom);

      // Notify both parties
      io.to(callRoom).emit('call_accepted', { 
        callId,
        participants: [callerSocket.userId, userId]
      });

    } catch (error) {
      logger.error('Error accepting call:', error);
      socket.emit('error', { message: 'Failed to accept call' });
    }
  });

  // Reject call
  socket.on('reject_call', (data) => {
    try {
      const { callId, reason = 'rejected' } = data;

      // Find the caller's socket
      const callerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.callId === callId);

      if (callerSocket) {
        callerSocket.emit('call_rejected', { reason });
        delete callerSocket.callId;
        delete callerSocket.callType;
        delete callerSocket.callCost;
      }

    } catch (error) {
      logger.error('Error rejecting call:', error);
    }
  });

  // End call
  socket.on('end_call', (data) => {
    try {
      const { callId } = data;
      const callRoom = `call_${callId}`;

      // Notify all participants
      io.to(callRoom).emit('call_ended', { 
        endedBy: userId,
        reason: 'ended_by_user'
      });

      // Remove all sockets from call room
      const socketsInRoom = io.sockets.adapter.rooms.get(callRoom);
      if (socketsInRoom) {
        socketsInRoom.forEach(socketId => {
          const sock = io.sockets.sockets.get(socketId);
          if (sock) {
            sock.leave(callRoom);
            delete sock.callId;
            delete sock.callType;
            delete sock.callCost;
          }
        });
      }

    } catch (error) {
      logger.error('Error ending call:', error);
    }
  });

  // WebRTC signaling
  socket.on('webrtc_offer', (data) => {
    const { callId, offer } = data;
    socket.to(`call_${callId}`).emit('webrtc_offer', { offer, from: userId });
  });

  socket.on('webrtc_answer', (data) => {
    const { callId, answer } = data;
    socket.to(`call_${callId}`).emit('webrtc_answer', { answer, from: userId });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    const { callId, candidate } = data;
    socket.to(`call_${callId}`).emit('webrtc_ice_candidate', { candidate, from: userId });
  });

  // User presence
  socket.on('get_user_status', async (data) => {
    try {
      const { userIds } = data;
      const statuses = {};

      for (const uid of userIds) {
        statuses[uid] = await isUserOnline(uid);
      }

      socket.emit('user_statuses', statuses);

    } catch (error) {
      logger.error('Error getting user statuses:', error);
    }
  });

  // Join specific conversation
  socket.on('join_conversation', async (data) => {
    try {
      const { conversationId } = data;

      // Validate access
      const conversation = await db('conversations')
        .where('id', conversationId)
        .where(function() {
          this.where('user1_id', userId).orWhere('user2_id', userId);
        })
        .first();

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      socket.join(`conversation_${conversationId}`);
      await joinRoom(userId, conversationId);

      socket.emit('conversation_joined', { conversationId });

    } catch (error) {
      logger.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Leave conversation
  socket.on('leave_conversation', async (data) => {
    try {
      const { conversationId } = data;

      socket.leave(`conversation_${conversationId}`);
      await leaveRoom(userId, conversationId);

      socket.emit('conversation_left', { conversationId });

    } catch (error) {
      logger.error('Error leaving conversation:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async (reason) => {
    try {
      logger.info(`User ${user.username} disconnected: ${reason}`);

      // Set user offline
      await setUserOffline(userId);

      // End any active calls
      if (socket.callId) {
        const callRoom = `call_${socket.callId}`;
        io.to(callRoom).emit('call_ended', { 
          endedBy: userId,
          reason: 'disconnected'
        });
      }

      // Leave all rooms
      const rooms = socket.rooms;
      for (const room of rooms) {
        if (room.startsWith('conversation_')) {
          const conversationId = room.replace('conversation_', '');
          await leaveRoom(userId, conversationId);
        }
      }

    } catch (error) {
      logger.error('Error handling disconnect:', error);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${userId}:`, error);
  });
};