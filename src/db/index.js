/**
 * File: src/db/index.js
 * Description: Supabase Postgres connection via pg Pool — no ORM. DATABASE_URL from env. Schema receipts per schema.md §1 (id SERIAL).
 * Part of: DB layer
 * Main dependencies: pg
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[DB] init error: DATABASE_URL is not set');
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] error', err);
});

/**
 * Run a parameterized SQL query.
 *
 * @param {string} text - SQL query string with $1, $2, ... placeholders
 * @param {Array} [params] - Query parameters
 * @returns {Promise<object>} pg QueryResult
 *
 * @example
 * // await query('SELECT * FROM receipts WHERE id = $1', [1]);
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Create receipts table and indexes if they do not exist; logs connection status.
 *
 * @returns {Promise<void>}
 *
 * Notes:
 * - Throws if DATABASE_URL is missing or SQL fails (caller should exit).
 */
async function initDb() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        image_url TEXT,
        image_hash VARCHAR(66),
        canonical_hash VARCHAR(66) NOT NULL,
        receipt_number VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        receipt_date DATE NOT NULL,
        store_name VARCHAR(255) NOT NULL,
        tamper_score INTEGER NOT NULL,
        verdict VARCHAR(20) NOT NULL,
        onchain_tx_hash VARCHAR(66),
        onchain_status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_receipts_wallet ON receipts(wallet_address)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_receipts_canonical_hash ON receipts(canonical_hash)`);
    console.log('[DB] connected');
  } catch (err) {
    console.error(`[DB] init error: ${err.message}`);
    throw err;
  }
}

/**
 * Close the pg Pool (graceful shutdown).
 *
 * @returns {Promise<void>}
 */
async function closeDb() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  initDb,
  closeDb,
};
