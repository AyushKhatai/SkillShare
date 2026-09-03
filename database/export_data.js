const fs = require('fs');
const db = require('../config/database');

async function exportAll() {
  try {
    const tables = ['users', 'skills', 'bookings', 'reviews', 'messages'];
    let sqlOutput = '-- Campus Skill Share Original Data Export\n';
    sqlOutput += 'SET session_replication_role = replica;\n\n';

    for (const table of tables) {
      const res = await db.query(`SELECT * FROM ${table} ORDER BY 1 ASC`);
      console.log(`Table ${table}: ${res.rows.length} rows`);
      if (res.rows.length > 0) {
        sqlOutput += `-- Data for ${table}\n`;
        for (const row of res.rows) {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const val = row[k];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean' || typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            // String escape single quotes
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          sqlOutput += `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        // Reset sequence
        const pKeyRes = await db.query(`
          SELECT pg_attribute.attname, format_type(pg_attribute.atttypid, pg_attribute.atttypmod) 
          FROM pg_index, pg_class, pg_attribute, pg_custom
          WHERE 
            pg_class.oid = '${table}'::regclass AND
            indrelid = pg_class.oid AND
            pg_attribute.attrelid = pg_class.oid AND 
            pg_attribute.attnum = any(pg_index.indkey)
            AND indisprimary
        `).catch(() => ({ rows: [] }));
        
        sqlOutput += `\n`;
      }
    }

    // Sequence reset for serial columns
    sqlOutput += `-- Reset sequences\n`;
    sqlOutput += `SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 1), true);\n`;
    sqlOutput += `SELECT setval('skills_skill_id_seq', COALESCE((SELECT MAX(skill_id) FROM skills), 1), true);\n`;
    sqlOutput += `SELECT setval('bookings_booking_id_seq', COALESCE((SELECT MAX(booking_id) FROM bookings), 1), true);\n`;
    sqlOutput += `SELECT setval('reviews_review_id_seq', COALESCE((SELECT MAX(review_id) FROM reviews), 1), true);\n`;
    sqlOutput += `SELECT setval('messages_message_id_seq', COALESCE((SELECT MAX(message_id) FROM messages), 1), true);\n\n`;
    sqlOutput += `SET session_replication_role = DEFAULT;\n`;

    fs.writeFileSync('./database/export_original_data.sql', sqlOutput);
    console.log('Exported successfully to database/export_original_data.sql');
    process.exit(0);
  } catch (err) {
    console.error('Export error:', err);
    process.exit(1);
  }
}

exportAll();
