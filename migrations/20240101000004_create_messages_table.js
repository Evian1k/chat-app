exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable();
    table.uuid('sender_id').notNullable();
    table.uuid('recipient_id').notNullable();
    table.text('content');
    table.enum('type', ['text', 'image', 'audio', 'video', 'file', 'system', 'gift', 'location']).defaultTo('text');
    table.json('media_urls'); // For images, videos, files
    table.json('metadata'); // Additional data like file size, duration, etc.
    
    // Message status
    table.enum('status', ['sent', 'delivered', 'read', 'failed']).defaultTo('sent');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    
    // Translation support
    table.text('original_content'); // Original message before translation
    table.string('original_language');
    table.string('translated_language');
    table.boolean('is_translated').defaultTo(false);
    
    // Message reactions and interactions
    table.json('reactions').defaultTo('{}'); // {emoji: [user_ids]}
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('edited_at');
    table.text('edit_history'); // JSON array of previous versions
    
    // System and special messages
    table.boolean('is_system_message').defaultTo(false);
    table.json('system_data'); // Data for system messages
    
    // Moderation
    table.boolean('is_flagged').defaultTo(false);
    table.text('flag_reason');
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at');
    
    // Coins cost tracking
    table.integer('coins_cost').defaultTo(0);
    
    // Timestamps
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('recipient_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['conversation_id']);
    table.index(['sender_id']);
    table.index(['recipient_id']);
    table.index(['type']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['is_deleted']);
    table.index(['is_flagged']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};