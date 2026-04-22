const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function migrate() {
    try {
        console.log('Making password_hash column nullable for Google Auth users...');

        // Check if password_hash has a NOT NULL constraint
        const res = await pool.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password_hash';
        `);

        if (res.rows.length > 0 && res.rows[0].is_nullable === 'NO') {
            console.log('password_hash is currently NOT NULL. Altering column...');
            await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;');
            console.log('SUCCESS: password_hash is now nullable. Google login will work!');
        } else {
            console.log('password_hash is already nullable. No changes needed.');
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
