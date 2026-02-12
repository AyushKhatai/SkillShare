const { Pool } = require('pg');

const hasDbConfig = Boolean(
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_NAME
);

if (!hasDbConfig) {
  console.warn('⚠️  Database environment variables are missing. Starting in mock DB mode.');

  module.exports = {
    query: async (sql) => {
      if (typeof sql === 'string' && sql.toLowerCase().includes('select now')) {
        return { rows: [{ now: new Date() }] };
      }
      return { rows: [] };
    }
  };

  return;
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
