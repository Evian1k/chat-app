const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  getCoinBalance, 
  getTransactionHistory, 
  processCoinPurchase, 
  getCoinCosts,
  getCoinStatistics,
  addCoins
} = require('../services/coinService');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's coin balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const balance = await getCoinBalance(req.user.id);
    
    if (balance === null) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      coin_balance: balance,
      user_id: req.user.id
    });

  } catch (error) {
    logger.error('Get coin balance error:', error);
    res.status(500).json({ error: 'Failed to get coin balance' });
  }
});

// Get coin transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    let transactions = await db('coin_transactions')
      .where('user_id', req.user.id)
      .modify(function(queryBuilder) {
        if (type) {
          queryBuilder.where('type', type);
        }
      })
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .select([
        'id', 'type', 'amount', 'description', 'created_at',
        'payment_provider', 'payment_amount', 'payment_currency',
        'balance_before', 'balance_after', 'metadata'
      ]);

    // Process transactions for response
    transactions = transactions.map(tx => ({
      ...tx,
      metadata: tx.metadata ? JSON.parse(tx.metadata) : null
    }));

    res.json({
      transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: transactions.length
      }
    });

  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

// Get coin costs for different actions
router.get('/costs', authenticateToken, async (req, res) => {
  try {
    const costs = getCoinCosts();
    res.json({ costs });
  } catch (error) {
    logger.error('Get coin costs error:', error);
    res.status(500).json({ error: 'Failed to get coin costs' });
  }
});

// Get coin statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getCoinStatistics(req.user.id);
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ stats });

  } catch (error) {
    logger.error('Get coin stats error:', error);
    res.status(500).json({ error: 'Failed to get coin statistics' });
  }
});

// Coin packages configuration
const COIN_PACKAGES = {
  small: {
    coins: 100,
    price: 4.99,
    currency: 'USD',
    bonus: 0,
    description: 'Small Coin Pack'
  },
  medium: {
    coins: 250,
    price: 9.99,
    currency: 'USD',
    bonus: 50,
    description: 'Medium Coin Pack (Best Value!)'
  },
  large: {
    coins: 500,
    price: 19.99,
    currency: 'USD',
    bonus: 150,
    description: 'Large Coin Pack'
  },
  mega: {
    coins: 1000,
    price: 34.99,
    currency: 'USD',
    bonus: 400,
    description: 'Mega Coin Pack (Most Popular!)'
  }
};

// Get available coin packages
router.get('/packages', authenticateToken, async (req, res) => {
  try {
    res.json({ packages: COIN_PACKAGES });
  } catch (error) {
    logger.error('Get coin packages error:', error);
    res.status(500).json({ error: 'Failed to get coin packages' });
  }
});

// Create payment intent for coin purchase
router.post('/purchase/intent', authenticateToken, [
  body('package').isIn(['small', 'medium', 'large', 'mega']),
  body('payment_method').isIn(['stripe', 'google_play', 'app_store'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { package: packageName, payment_method } = req.body;
    const coinPackage = COIN_PACKAGES[packageName];

    if (!coinPackage) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    if (payment_method === 'stripe') {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(coinPackage.price * 100), // Convert to cents
        currency: coinPackage.currency.toLowerCase(),
        metadata: {
          user_id: req.user.id,
          package: packageName,
          coins: coinPackage.coins + coinPackage.bonus,
          description: coinPackage.description
        }
      });

      res.json({
        client_secret: paymentIntent.client_secret,
        package: {
          name: packageName,
          ...coinPackage,
          total_coins: coinPackage.coins + coinPackage.bonus
        }
      });

    } else {
      // For mobile payments (Google Play, App Store)
      // Return package info for client-side processing
      res.json({
        package: {
          name: packageName,
          ...coinPackage,
          total_coins: coinPackage.coins + coinPackage.bonus
        },
        payment_method
      });
    }

  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm coin purchase (for mobile payments)
router.post('/purchase/confirm', authenticateToken, [
  body('package').isIn(['small', 'medium', 'large', 'mega']),
  body('payment_method').isIn(['google_play', 'app_store']),
  body('transaction_id').notEmpty(),
  body('receipt_data').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { package: packageName, payment_method, transaction_id, receipt_data } = req.body;
    const coinPackage = COIN_PACKAGES[packageName];

    if (!coinPackage) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Check if transaction already processed
    const existingTransaction = await db('coin_transactions')
      .where('payment_transaction_id', transaction_id)
      .first();

    if (existingTransaction) {
      return res.status(409).json({ error: 'Transaction already processed' });
    }

    // TODO: Verify receipt with Google Play/App Store
    // For now, we'll trust the client (implement proper verification in production)

    const totalCoins = coinPackage.coins + coinPackage.bonus;

    // Process the purchase
    const success = await processCoinPurchase(
      req.user.id,
      totalCoins,
      coinPackage.price,
      payment_method,
      transaction_id,
      coinPackage.currency
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to process purchase' });
    }

    // Get updated balance
    const newBalance = await getCoinBalance(req.user.id);

    logger.info(`Coin purchase confirmed: ${totalCoins} coins for user ${req.user.id} via ${payment_method}`);

    res.json({
      message: 'Purchase confirmed successfully',
      coins_purchased: totalCoins,
      new_balance: newBalance,
      transaction_id
    });

  } catch (error) {
    logger.error('Confirm purchase error:', error);
    res.status(500).json({ error: 'Failed to confirm purchase' });
  }
});

// Stripe webhook handler
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      logger.error('Stripe webhook secret not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { user_id, package: packageName, coins } = paymentIntent.metadata;

      // Check if already processed
      const existingTransaction = await db('coin_transactions')
        .where('payment_transaction_id', paymentIntent.id)
        .first();

      if (!existingTransaction) {
        // Process the purchase
        const success = await processCoinPurchase(
          user_id,
          parseInt(coins),
          paymentIntent.amount / 100, // Convert from cents
          'stripe',
          paymentIntent.id,
          paymentIntent.currency.toUpperCase()
        );

        if (success) {
          logger.info(`Stripe purchase processed: ${coins} coins for user ${user_id}`);
        } else {
          logger.error(`Failed to process Stripe purchase for user ${user_id}`);
        }
      }
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Daily reward claim
router.post('/daily-reward', authenticateToken, async (req, res) => {
  try {
    const user = await db('users')
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if daily reward already claimed today
    const lastDailyReward = user.last_daily_reward ? new Date(user.last_daily_reward) : null;
    const now = new Date();
    const canClaimReward = !lastDailyReward || 
      (now.getTime() - lastDailyReward.getTime()) > 20 * 60 * 60 * 1000; // 20 hours

    if (!canClaimReward) {
      const timeUntilNext = 24 * 60 * 60 * 1000 - (now.getTime() - lastDailyReward.getTime());
      return res.status(400).json({ 
        error: 'Daily reward already claimed',
        time_until_next: Math.ceil(timeUntilNext / (1000 * 60 * 60)) // hours
      });
    }

    // Calculate reward amount
    const baseReward = parseInt(process.env.DAILY_LOGIN_COINS) || 10;
    const streakBonus = Math.min(user.login_streak * 2, 50); // Max 50 bonus coins
    const totalReward = baseReward + streakBonus;

    // Add coins
    const success = await addCoins(req.user.id, totalReward, 'daily_reward', {
      streak: user.login_streak,
      base_reward: baseReward,
      streak_bonus: streakBonus
    });

    if (!success) {
      return res.status(500).json({ error: 'Failed to claim daily reward' });
    }

    // Update last daily reward time
    await db('users')
      .where('id', req.user.id)
      .update({ last_daily_reward: now });

    const newBalance = await getCoinBalance(req.user.id);

    logger.info(`Daily reward claimed: ${totalReward} coins for user ${req.user.id} (streak: ${user.login_streak})`);

    res.json({
      message: 'Daily reward claimed successfully',
      coins_earned: totalReward,
      base_reward: baseReward,
      streak_bonus: streakBonus,
      login_streak: user.login_streak,
      new_balance: newBalance
    });

  } catch (error) {
    logger.error('Daily reward claim error:', error);
    res.status(500).json({ error: 'Failed to claim daily reward' });
  }
});

// Admin: Add coins to user (requires admin auth)
router.post('/admin/add', authenticateToken, [
  body('user_id').isUUID(),
  body('amount').isInt({ min: 1, max: 10000 }),
  body('reason').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check admin permissions (implement proper admin check)
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
    const requestingUser = await db('users').where('id', req.user.id).first();
    
    if (!adminEmails.includes(requestingUser.email) && !requestingUser.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { user_id, amount, reason } = req.body;

    // Check if target user exists
    const targetUser = await db('users').where('id', user_id).first();
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Add coins
    const success = await addCoins(user_id, amount, 'admin_adjustment', {
      admin_id: req.user.id,
      reason: reason || 'Admin adjustment'
    });

    if (!success) {
      return res.status(500).json({ error: 'Failed to add coins' });
    }

    const newBalance = await getCoinBalance(user_id);

    logger.info(`Admin ${req.user.id} added ${amount} coins to user ${user_id}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      message: 'Coins added successfully',
      coins_added: amount,
      new_balance: newBalance,
      target_user: {
        id: targetUser.id,
        username: targetUser.username,
        display_name: targetUser.display_name
      }
    });

  } catch (error) {
    logger.error('Admin add coins error:', error);
    res.status(500).json({ error: 'Failed to add coins' });
  }
});

module.exports = router;