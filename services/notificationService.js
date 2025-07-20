const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    logger.info('Firebase Admin SDK initialized successfully');
  } else {
    logger.warn('Firebase credentials not provided. Push notifications will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK:', error);
}

/**
 * Send push notification to device tokens
 * @param {Array|string} tokens - Device tokens (array or single token)
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {object} - Send result
 */
async function sendPushNotification(tokens, notification, data = {}) {
  if (!firebaseApp) {
    logger.warn('Push notification service not available');
    return { success: false, error: 'Service not initialized' };
  }

  if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
    return { success: false, error: 'No tokens provided' };
  }

  // Ensure tokens is an array
  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
  
  // Filter out invalid tokens
  const validTokens = tokenArray.filter(token => 
    token && typeof token === 'string' && token.trim().length > 0
  );

  if (validTokens.length === 0) {
    return { success: false, error: 'No valid tokens provided' };
  }

  try {
    const message = {
      notification: {
        title: notification.title || 'ChatzOne',
        body: notification.body || '',
        imageUrl: notification.imageUrl || null
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'chatzone_messages'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: data.badge || 1,
            'content-available': 1
          }
        }
      }
    };

    let result;
    if (validTokens.length === 1) {
      // Send to single token
      message.token = validTokens[0];
      result = await admin.messaging().send(message);
      
      return {
        success: true,
        messageId: result,
        tokensProcessed: 1,
        successCount: 1,
        failureCount: 0
      };
    } else {
      // Send to multiple tokens
      message.tokens = validTokens;
      result = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      const failedTokens = [];
      if (result.failureCount > 0) {
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: validTokens[idx],
              error: resp.error?.code || 'Unknown error'
            });
          }
        });
      }

      return {
        success: result.successCount > 0,
        tokensProcessed: validTokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
        failedTokens
      };
    }

  } catch (error) {
    logger.error('Push notification error:', error);
    return {
      success: false,
      error: error.message,
      tokensProcessed: validTokens.length,
      successCount: 0,
      failureCount: validTokens.length
    };
  }
}

/**
 * Send notification to specific user
 * @param {string} userId - User ID
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {object} - Send result
 */
async function sendNotificationToUser(userId, notification, data = {}) {
  try {
    const { db } = require('../config/database');
    
    const user = await db('users')
      .where('id', userId)
      .select('device_tokens')
      .first();

    if (!user || !user.device_tokens) {
      return { success: false, error: 'User has no device tokens' };
    }

    const deviceTokens = JSON.parse(user.device_tokens);
    return await sendPushNotification(deviceTokens, notification, data);

  } catch (error) {
    logger.error('Error sending notification to user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {object} - Send result
 */
async function sendNotificationToUsers(userIds, notification, data = {}) {
  try {
    const { db } = require('../config/database');
    
    const users = await db('users')
      .whereIn('id', userIds)
      .whereNotNull('device_tokens')
      .select('device_tokens');

    if (users.length === 0) {
      return { success: false, error: 'No users with device tokens found' };
    }

    const allTokens = [];
    users.forEach(user => {
      if (user.device_tokens) {
        const tokens = JSON.parse(user.device_tokens);
        allTokens.push(...tokens);
      }
    });

    return await sendPushNotification(allTokens, notification, data);

  } catch (error) {
    logger.error('Error sending notification to users:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe token to topic
 * @param {Array|string} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {object} - Subscription result
 */
async function subscribeToTopic(tokens, topic) {
  if (!firebaseApp) {
    return { success: false, error: 'Service not initialized' };
  }

  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    const result = await admin.messaging().subscribeToTopic(tokenArray, topic);
    
    return {
      success: result.successCount > 0,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors
    };

  } catch (error) {
    logger.error('Topic subscription error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe token from topic
 * @param {Array|string} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {object} - Unsubscription result
 */
async function unsubscribeFromTopic(tokens, topic) {
  if (!firebaseApp) {
    return { success: false, error: 'Service not initialized' };
  }

  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    const result = await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
    
    return {
      success: result.successCount > 0,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors
    };

  } catch (error) {
    logger.error('Topic unsubscription error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to topic
 * @param {string} topic - Topic name
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload
 * @returns {object} - Send result
 */
async function sendNotificationToTopic(topic, notification, data = {}) {
  if (!firebaseApp) {
    return { success: false, error: 'Service not initialized' };
  }

  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title || 'ChatzOne',
        body: notification.body || '',
        imageUrl: notification.imageUrl || null
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'chatzone_general'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            'content-available': 1
          }
        }
      }
    };

    const result = await admin.messaging().send(message);
    
    return {
      success: true,
      messageId: result
    };

  } catch (error) {
    logger.error('Topic notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate and clean device tokens
 * @param {Array} tokens - Array of device tokens to validate
 * @returns {Array} - Array of valid tokens
 */
async function validateTokens(tokens) {
  if (!firebaseApp || !tokens || !Array.isArray(tokens)) {
    return [];
  }

  const validTokens = [];
  
  try {
    // Send a dry-run message to validate tokens
    const message = {
      tokens: tokens,
      notification: {
        title: 'Test',
        body: 'Test'
      },
      dryRun: true
    };

    const result = await admin.messaging().sendMulticast(message);
    
    result.responses.forEach((resp, idx) => {
      if (resp.success) {
        validTokens.push(tokens[idx]);
      }
    });

  } catch (error) {
    logger.error('Token validation error:', error);
  }

  return validTokens;
}

/**
 * Create notification templates
 */
const NotificationTemplates = {
  NEW_MESSAGE: (senderName, messagePreview) => ({
    title: `New message from ${senderName}`,
    body: messagePreview,
    imageUrl: null
  }),

  NEW_MATCH: (matchName) => ({
    title: 'New Match! 🎉',
    body: `You matched with ${matchName}`,
    imageUrl: null
  }),

  INCOMING_CALL: (callerName, callType) => ({
    title: `Incoming ${callType} call`,
    body: `${callerName} is calling you`,
    imageUrl: null
  }),

  DAILY_REWARD: (coins) => ({
    title: 'Daily Reward! 🪙',
    body: `You earned ${coins} coins for logging in today`,
    imageUrl: null
  }),

  PROFILE_VIEW: (viewerName) => ({
    title: 'Profile View',
    body: `${viewerName} viewed your profile`,
    imageUrl: null
  }),

  SUPER_MATCH: (matchName) => ({
    title: 'Super Match! ⭐',
    body: `${matchName} super liked you!`,
    imageUrl: null
  })
};

/**
 * Send templated notification
 * @param {Array|string} tokens - Device tokens
 * @param {string} templateName - Template name
 * @param {Array} templateArgs - Template arguments
 * @param {object} data - Additional data payload
 * @returns {object} - Send result
 */
async function sendTemplatedNotification(tokens, templateName, templateArgs = [], data = {}) {
  const template = NotificationTemplates[templateName];
  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  const notification = template(...templateArgs);
  return await sendPushNotification(tokens, notification, data);
}

module.exports = {
  sendPushNotification,
  sendNotificationToUser,
  sendNotificationToUsers,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendNotificationToTopic,
  validateTokens,
  sendTemplatedNotification,
  NotificationTemplates
};