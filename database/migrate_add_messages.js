require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        console.log('=== Adding Messages Table ===\n');

        // 0. Drop old tables if they exist (clean start)
        console.log('0. Dropping old messages/conversations tables if they exist...');
        await client.query('DROP TABLE IF EXISTS messages CASCADE;');
        await client.query('DROP TABLE IF EXISTS conversations CASCADE;');
        console.log('   ✅ Old tables dropped');

        // 1. Create MESSAGES table
        console.log('\n1. Creating messages table...');
        await client.query(`
            CREATE TABLE messages (
                message_id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(100) NOT NULL,
                sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                receiver_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE SET NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ messages table created');

        // 2. Create CONVERSATIONS table (to track conversations between users)
        console.log('\n2. Creating conversations table...');
        await client.query(`
            CREATE TABLE conversations (
                conversation_id VARCHAR(100) PRIMARY KEY,
                user1_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                user2_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE SET NULL,
                skill_id INTEGER REFERENCES skills(skill_id) ON DELETE SET NULL,
                last_message TEXT,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ conversations table created');

        // 3. Create indexes
        console.log('\n3. Creating indexes...');
        await client.query('CREATE INDEX idx_messages_conversation ON messages(conversation_id);');
        await client.query('CREATE INDEX idx_messages_sender ON messages(sender_id);');
        await client.query('CREATE INDEX idx_messages_receiver ON messages(receiver_id);');
        await client.query('CREATE INDEX idx_messages_created ON messages(created_at);');
        await client.query('CREATE INDEX idx_conversations_user1 ON conversations(user1_id);');
        await client.query('CREATE INDEX idx_conversations_user2 ON conversations(user2_id);');
        await client.query('CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at);');
        console.log('   ✅ All indexes created');

        await client.query('COMMIT');

        console.log('\n=== Migration Complete! ===');
        console.log('Tables created: messages, conversations');
        console.log('Existing tables untouched.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration FAILED (rolled back):', err.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
