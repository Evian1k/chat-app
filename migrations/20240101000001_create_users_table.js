exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash');
    table.string('username').unique().notNullable();
    table.string('display_name').notNullable();
    table.text('bio');
    table.string('profile_picture_url');
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']).notNullable();
    table.string('location');
    table.float('latitude');
    table.float('longitude');
    table.json('interests').defaultTo('[]');
    table.json('languages').defaultTo('["en"]');
    table.string('preferred_language').defaultTo('en');
    
    // OAuth fields
    table.string('google_id').unique();
    table.string('facebook_id').unique();
    table.boolean('is_oauth_user').defaultTo(false);
    
    // Account status
    table.boolean('is_verified').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_premium').defaultTo(false);
    table.boolean('is_banned').defaultTo(false);
    table.text('ban_reason');
    table.timestamp('banned_until');
    
    // Privacy settings
    table.boolean('show_location').defaultTo(true);
    table.boolean('show_age').defaultTo(true);
    table.boolean('allow_messages').defaultTo(true);
    table.boolean('allow_video_calls').defaultTo(true);
    table.boolean('allow_voice_calls').defaultTo(true);
    table.enum('profile_visibility', ['public', 'matches_only', 'private']).defaultTo('public');
    
    // Matching preferences
    table.json('age_range').defaultTo('{"min": 18, "max": 99}');
    table.json('gender_preference').defaultTo('["male", "female", "other"]');
    table.integer('max_distance_km').defaultTo(50);
    
    // Coins and monetization
    table.integer('coin_balance').defaultTo(100);
    table.integer('total_coins_earned').defaultTo(100);
    table.integer('total_coins_spent').defaultTo(0);
    table.timestamp('last_daily_reward');
    
    // Activity tracking
    table.timestamp('last_active');
    table.timestamp('last_login');
    table.integer('login_streak').defaultTo(0);
    table.json('device_tokens').defaultTo('[]'); // For push notifications
    
    // AI matching data
    table.json('personality_data');
    table.json('interaction_preferences');
    table.float('ai_match_score');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['username']);
    table.index(['google_id']);
    table.index(['facebook_id']);
    table.index(['is_active']);
    table.index(['location']);
    table.index(['last_active']);
    table.index(['gender']);
    table.index(['is_premium']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};