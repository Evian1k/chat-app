exports.up = function(knex) {
  return knex.schema.createTable('coin_transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.enum('type', [
      'purchase', 'daily_reward', 'referral_bonus', 'ad_reward',
      'message_cost', 'video_call_cost', 'voice_call_cost', 
      'super_match_cost', 'profile_boost_cost', 'gift_cost',
      'refund', 'admin_adjustment'
    ]).notNullable();
    table.integer('amount').notNullable(); // Positive for earnings, negative for spending
    table.integer('balance_before').notNullable();
    table.integer('balance_after').notNullable();
    table.text('description');
    table.json('metadata'); // Additional transaction data
    
    // Related entities
    table.uuid('related_user_id'); // For referrals, gifts, etc.
    table.uuid('related_message_id'); // For message costs
    table.uuid('related_match_id'); // For match-related costs
    table.string('related_entity_type'); // Generic relation type
    table.string('related_entity_id'); // Generic relation ID
    
    // Payment processing (for purchases)
    table.string('payment_provider'); // stripe, google_play, app_store
    table.string('payment_transaction_id');
    table.string('payment_status'); // pending, completed, failed, refunded
    table.decimal('payment_amount', 10, 2); // Real money amount
    table.string('payment_currency', 3).defaultTo('USD');
    
    // Admin tracking
    table.uuid('processed_by'); // Admin user who processed manual transactions
    table.text('admin_notes');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('related_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('related_message_id').references('id').inTable('messages').onDelete('SET NULL');
    table.foreign('related_match_id').references('id').inTable('matches').onDelete('SET NULL');
    table.foreign('processed_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['user_id']);
    table.index(['type']);
    table.index(['created_at']);
    table.index(['payment_status']);
    table.index(['payment_transaction_id']);
    table.index(['related_user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('coin_transactions');
};