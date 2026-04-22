require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        console.log('=== Starting Database Migration ===\n');

        // =============================================
        // 1. DROP dependent tables first (foreign keys)
        // =============================================
        console.log('1. Dropping old tables (reviews, bookings, skills)...');
        await client.query('DROP TABLE IF EXISTS reviews CASCADE;');
        console.log('   ✅ reviews dropped');
        await client.query('DROP TABLE IF EXISTS bookings CASCADE;');
        console.log('   ✅ bookings dropped');
        await client.query('DROP TABLE IF EXISTS skills CASCADE;');
        console.log('   ✅ skills dropped');

        // =============================================
        // 2. Recreate SKILLS table
        // =============================================
        console.log('\n2. Creating skills table...');
        await client.query(`
            CREATE TABLE skills (
                skill_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                skill_level VARCHAR(50) NOT NULL,
                duration VARCHAR(50),
                price DECIMAL(10, 2) DEFAULT 0.00,
                location VARCHAR(200),
                image_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                total_bookings INTEGER DEFAULT 0,
                average_rating DECIMAL(3, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ skills table created');

        // =============================================
        // 3. Recreate BOOKINGS table
        // =============================================
        console.log('\n3. Creating bookings table...');
        await client.query(`
            CREATE TABLE bookings (
                booking_id SERIAL PRIMARY KEY,
                skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                teacher_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ bookings table created');

        // =============================================
        // 4. Recreate REVIEWS table
        // =============================================
        console.log('\n4. Creating reviews table...');
        await client.query(`
            CREATE TABLE reviews (
                review_id SERIAL PRIMARY KEY,
                skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ reviews table created');

        // =============================================
        // 5. Create indexes
        // =============================================
        console.log('\n5. Creating indexes...');
        await client.query('CREATE INDEX idx_skills_user_id ON skills(user_id);');
        await client.query('CREATE INDEX idx_skills_category ON skills(category);');
        await client.query('CREATE INDEX idx_bookings_student_id ON bookings(student_id);');
        await client.query('CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);');
        await client.query('CREATE INDEX idx_bookings_skill_id ON bookings(skill_id);');
        await client.query('CREATE INDEX idx_reviews_skill_id ON reviews(skill_id);');
        await client.query('CREATE INDEX idx_reviews_user_id ON reviews(user_id);');
        console.log('   ✅ All indexes created');

        await client.query('COMMIT');

        console.log('\n=== Migration Complete! ===');
        console.log('Tables recreated: skills, bookings, reviews');
        console.log('Users table: untouched (your accounts are safe)');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration FAILED (rolled back):', err.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
