require('dotenv').config();
const db = require('./config/database');
async function check() {
    const skills = await db.query('SELECT skill_id, title, user_id FROM skills ORDER BY skill_id');
    console.log('\n=== ALL SKILLS WITH IDs ===');
    skills.rows.forEach(r => console.log('  skill_id:', r.skill_id, '| user_id:', r.user_id, '|', r.title));
    process.exit();
}
check();
