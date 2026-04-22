const db = require('../config/database');

async function migrate() {
    try {
        console.log('Adding resume_link column to skills table...');
        await db.query(`ALTER TABLE skills ADD COLUMN resume_link TEXT;`);
        console.log('Migration successful: resume_link column added.');
    } catch (error) {
        if (error.code === '42701') {
            console.log('Column resume_link already exists. Skipping...');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        process.exit();
    }
}

migrate();
