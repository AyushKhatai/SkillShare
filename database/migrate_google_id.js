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
        console.log('Checking for google_id column...');
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='google_id';
    `);

        if (res.rows.length === 0) {
            console.log('Column google_id not found. Adding it...');
            await pool.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255);');
            console.log('Column google_id added successfully.');
        } else {
            console.log('Column google_id already exists.');
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
