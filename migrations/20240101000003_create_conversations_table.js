exports.up = function(knex) {
  return knex.schema.createTable('conversations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('match_id').notNullable();
    table.uuid('user1_id').notNullable();
    table.uuid('user2_id').notNullable();
    table.enum('status', ['active', 'archived', 'deleted']).defaultTo('active');
    table.text('last_message');
    table.timestamp('last_message_at');
    table.uuid('last_message_by');
    table.integer('unread_count_user1').defaultTo(0);
    table.integer('unread_count_user2').defaultTo(0);
    table.boolean('is_muted_user1').defaultTo(false);
    table.boolean('is_muted_user2').defaultTo(false);
    table.boolean('is_blocked').defaultTo(false);
    table.uuid('blocked_by');
    table.timestamp('blocked_at');
    
    // Video/Voice call tracking
    table.integer('total_calls').defaultTo(0);
    table.integer('total_call_duration').defaultTo(0); // in seconds
    table.timestamp('last_call_at');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('match_id').references('id').inTable('matches').onDelete('CASCADE');
    table.foreign('user1_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('user2_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('last_message_by').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('blocked_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['match_id']);
    table.index(['user1_id']);
    table.index(['user2_id']);
    table.index(['status']);
    table.index(['last_message_at']);
    table.index(['is_blocked']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('conversations');
};