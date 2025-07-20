const { db } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Deduct coins from user's balance and create transaction record
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deduct
 * @param {string} type - Transaction type
 * @param {object} metadata - Additional transaction data
 * @returns {boolean} - Success status
 */
async function deductCoins(userId, amount, type, metadata = {}) {
  const trx = await db.transaction();
  
  try {
    // Get current user balance
    const user = await trx('users')
      .where('id', userId)
      .select('coin_balance')
      .first()
      .forUpdate();

    if (!user) {
      await trx.rollback();
      return false;
    }

    if (user.coin_balance < amount) {
      await trx.rollback();
      return false;
    }

    const newBalance = user.coin_balance - amount;

    // Update user balance
    await trx('users')
      .where('id', userId)
      .update({
        coin_balance: newBalance,
        total_coins_spent: db.raw('total_coins_spent + ?', [amount])
      });

    // Create transaction record
    await trx('coin_transactions').insert({
      user_id: userId,
      type,
      amount: -amount,
      balance_before: user.coin_balance,
      balance_after: newBalance,
      description: getTransactionDescription(type, amount, metadata),
      metadata: JSON.stringify(metadata),
      related_user_id: metadata.recipientId || null,
      related_message_id: metadata.messageId || null,
      related_match_id: metadata.matchId || null
    });

    await trx.commit();
    
    logger.info(`Coins deducted: ${amount} from user ${userId} for ${type}`);
    return true;

  } catch (error) {
    await trx.rollback();
    logger.error('Error deducting coins:', error);
    return false;
  }
}

/**
 * Add coins to user's balance and create transaction record
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add
 * @param {string} type - Transaction type
 * @param {object} metadata - Additional transaction data
 * @returns {boolean} - Success status
 */
async function addCoins(userId, amount, type, metadata = {}) {
  const trx = await db.transaction();
  
  try {
    // Get current user balance
    const user = await trx('users')
      .where('id', userId)
      .select('coin_balance')
      .first()
      .forUpdate();

    if (!user) {
      await trx.rollback();
      return false;
    }

    const newBalance = user.coin_balance + amount;

    // Update user balance
    await trx('users')
      .where('id', userId)
      .update({
        coin_balance: newBalance,
        total_coins_earned: db.raw('total_coins_earned + ?', [amount])
      });

    // Create transaction record
    await trx('coin_transactions').insert({
      user_id: userId,
      type,
      amount,
      balance_before: user.coin_balance,
      balance_after: newBalance,
      description: getTransactionDescription(type, amount, metadata),
      metadata: JSON.stringify(metadata),
      related_user_id: metadata.recipientId || null,
      payment_provider: metadata.paymentProvider || null,
      payment_transaction_id: metadata.paymentTransactionId || null,
      payment_status: metadata.paymentStatus || null,
      payment_amount: metadata.paymentAmount || null,
      payment_currency: metadata.paymentCurrency || 'USD'
    });

    await trx.commit();
    
    logger.info(`Coins added: ${amount} to user ${userId} for ${type}`);
    return true;

  } catch (error) {
    await trx.rollback();
    logger.error('Error adding coins:', error);
    return false;
  }
}

/**
 * Get user's coin balance
 * @param {string} userId - User ID
 * @returns {number|null} - Coin balance or null if user not found
 */
async function getCoinBalance(userId) {
  try {
    const user = await db('users')
      .where('id', userId)
      .select('coin_balance')
      .first();

    return user ? user.coin_balance : null;
  } catch (error) {
    logger.error('Error getting coin balance:', error);
    return null;
  }
}

/**
 * Get user's transaction history
 * @param {string} userId - User ID
 * @param {number} limit - Number of transactions to return
 * @param {number} offset - Offset for pagination
 * @returns {Array} - Array of transactions
 */
async function getTransactionHistory(userId, limit = 50, offset = 0) {
  try {
    const transactions = await db('coin_transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select([
        'id', 'type', 'amount', 'description', 'created_at',
        'payment_provider', 'payment_amount', 'payment_currency',
        'balance_before', 'balance_after'
      ]);

    return transactions;
  } catch (error) {
    logger.error('Error getting transaction history:', error);
    return [];
  }
}

/**
 * Process coin purchase
 * @param {string} userId - User ID
 * @param {number} coinAmount - Number of coins to purchase
 * @param {number} paymentAmount - Payment amount in real currency
 * @param {string} paymentProvider - Payment provider (stripe, google_play, app_store)
 * @param {string} transactionId - Payment transaction ID
 * @param {string} currency - Payment currency
 * @returns {boolean} - Success status
 */
async function processCoinPurchase(userId, coinAmount, paymentAmount, paymentProvider, transactionId, currency = 'USD') {
  try {
    const success = await addCoins(userId, coinAmount, 'purchase', {
      paymentProvider,
      paymentTransactionId: transactionId,
      paymentStatus: 'completed',
      paymentAmount,
      paymentCurrency: currency
    });

    if (success) {
      logger.info(`Coin purchase processed: ${coinAmount} coins for user ${userId}`);
    }

    return success;
  } catch (error) {
    logger.error('Error processing coin purchase:', error);
    return false;
  }
}

/**
 * Check if user has enough coins for an action
 * @param {string} userId - User ID
 * @param {number} requiredAmount - Required coin amount
 * @returns {boolean} - Whether user has enough coins
 */
async function hasEnoughCoins(userId, requiredAmount) {
  try {
    const balance = await getCoinBalance(userId);
    return balance !== null && balance >= requiredAmount;
  } catch (error) {
    logger.error('Error checking coin balance:', error);
    return false;
  }
}

/**
 * Get coin costs for different actions
 * @returns {object} - Object with action costs
 */
function getCoinCosts() {
  return {
    message: parseInt(process.env.MESSAGE_COST_COINS) || 1,
    videoCall: parseInt(process.env.VIDEO_CALL_COST_COINS) || 5,
    voiceCall: parseInt(process.env.VOICE_CALL_COST_COINS) || 3,
    superMatch: parseInt(process.env.SUPER_MATCH_COST_COINS) || 10,
    profileBoost: parseInt(process.env.PROFILE_BOOST_COST_COINS) || 20,
    gift: parseInt(process.env.GIFT_COST_COINS) || 5
  };
}

/**
 * Get daily reward amount
 * @param {number} loginStreak - User's login streak
 * @returns {number} - Daily reward amount
 */
function getDailyRewardAmount(loginStreak = 1) {
  const baseReward = parseInt(process.env.DAILY_LOGIN_COINS) || 10;
  const streakBonus = Math.min(loginStreak * 2, 50); // Max 50 bonus coins
  return baseReward + streakBonus;
}

/**
 * Generate transaction description based on type
 * @param {string} type - Transaction type
 * @param {number} amount - Transaction amount
 * @param {object} metadata - Transaction metadata
 * @returns {string} - Transaction description
 */
function getTransactionDescription(type, amount, metadata) {
  const absAmount = Math.abs(amount);
  
  switch (type) {
    case 'purchase':
      return `Purchased ${absAmount} coins`;
    case 'daily_reward':
      return `Daily login reward (${absAmount} coins)`;
    case 'referral_bonus':
      return `Referral bonus (${absAmount} coins)`;
    case 'ad_reward':
      return `Advertisement reward (${absAmount} coins)`;
    case 'message_cost':
      return `Message sent (${absAmount} coins)`;
    case 'video_call_cost':
      return `Video call (${absAmount} coins)`;
    case 'voice_call_cost':
      return `Voice call (${absAmount} coins)`;
    case 'super_match_cost':
      return `Super match (${absAmount} coins)`;
    case 'profile_boost_cost':
      return `Profile boost (${absAmount} coins)`;
    case 'gift_cost':
      return `Gift sent (${absAmount} coins)`;
    case 'refund':
      return `Refund (${absAmount} coins)`;
    case 'admin_adjustment':
      return `Admin adjustment (${absAmount} coins)`;
    default:
      return `Transaction (${absAmount} coins)`;
  }
}

/**
 * Get user's coin statistics
 * @param {string} userId - User ID
 * @returns {object} - Coin statistics
 */
async function getCoinStatistics(userId) {
  try {
    const user = await db('users')
      .where('id', userId)
      .select('coin_balance', 'total_coins_earned', 'total_coins_spent', 'login_streak')
      .first();

    if (!user) {
      return null;
    }

    const transactionCounts = await db('coin_transactions')
      .where('user_id', userId)
      .select('type')
      .count('* as count')
      .groupBy('type');

    const stats = {
      currentBalance: user.coin_balance,
      totalEarned: user.total_coins_earned,
      totalSpent: user.total_coins_spent,
      loginStreak: user.login_streak,
      transactionCounts: {}
    };

    transactionCounts.forEach(row => {
      stats.transactionCounts[row.type] = parseInt(row.count);
    });

    return stats;
  } catch (error) {
    logger.error('Error getting coin statistics:', error);
    return null;
  }
}

module.exports = {
  deductCoins,
  addCoins,
  getCoinBalance,
  getTransactionHistory,
  processCoinPurchase,
  hasEnoughCoins,
  getCoinCosts,
  getDailyRewardAmount,
  getCoinStatistics
};