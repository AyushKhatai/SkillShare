require('dotenv').config();
const db = require('../config/database');

async function checkAll() {
    try {
        const tables = ['users', 'skills', 'bookings', 'reviews'];
        for (const table of tables) {
            const res = await db.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
                [table]
            );
            console.log('\n' + table.toUpperCase() + ' table:');
            if (res.rows.length === 0) {
                console.log('  TABLE DOES NOT EXIST');
            } else {
                res.rows.forEach(c => console.log('  ' + c.column_name + ' (' + c.data_type + ')'));
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit();
    }
}

checkAll();
