exports.up = function(knex) {
  return knex.schema.createTable('matches', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user1_id').notNullable();
    table.uuid('user2_id').notNullable();
    table.enum('status', ['pending', 'matched', 'rejected', 'blocked']).defaultTo('pending');
    table.float('compatibility_score');
    table.json('match_reasons'); // AI-generated reasons for the match
    table.timestamp('matched_at');
    table.timestamp('expires_at'); // For time-limited matches
    table.boolean('is_super_match').defaultTo(false);
    table.uuid('initiated_by'); // Which user initiated the match
    
    // Timestamps
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('user1_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('user2_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('initiated_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['user1_id']);
    table.index(['user2_id']);
    table.index(['status']);
    table.index(['matched_at']);
    table.index(['expires_at']);
    
    // Ensure unique match pairs (prevent duplicate matches)
    table.unique(['user1_id', 'user2_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('matches');
};