/**
 * File: scripts/test-db.js
 * Description: Manual integration test for Supabase Postgres — connection, INSERT, SELECT, DELETE, COUNT. Run: npm run test:db
 * Part of: DB layer / tests
 * Main dependencies: dotenv, pg (via ../src/db)
 */

require('dotenv').config();

const { initDb, query, closeDb } = require('../src/db');

/**
 * Run DB smoke tests: SELECT NOW, INSERT dummy, SELECT by id, DELETE, COUNT(*).
 *
 * @returns {Promise<void>} Exits 0 on pass (✅), 1 on fail (❌)
 *
 * Notes:
 * - Creates a dummy row then deletes it; final COUNT should reflect only pre-existing rows.
 */
async function main() {
  try {
    await initDb();

    // Test 1: SELECT NOW()
    const now = await query('SELECT NOW()');
    console.log('SELECT NOW():', now.rows[0].now);

    // Test 2: INSERT dummy
    const inserted = await query(
      `INSERT INTO receipts (
         wallet_address, image_url, image_hash, canonical_hash,
         receipt_number, amount, receipt_date, store_name,
         tamper_score, verdict, onchain_tx_hash, onchain_status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        '0x1234567890abcdef1234567890abcdef12345678',
        null,
        '0x' + 'aa'.repeat(32),
        '0x' + 'deadbeef'.repeat(8),
        'INV-TEST-001',
        150000,
        '2026-09-23',
        'toko test',
        0,
        'clean',
        null,
        'pending',
      ]
    );
    const id = inserted.rows[0].id;
    console.log('INSERT dummy id:', id);

    // Test 3: SELECT by id
    const selected = await query(
      'SELECT id, wallet_address, receipt_number, amount, verdict, onchain_status FROM receipts WHERE id = $1',
      [id]
    );
    console.log('SELECT by id:', JSON.stringify(selected.rows[0]));

    // Test 4: DELETE
    const deleted = await query('DELETE FROM receipts WHERE id = $1', [id]);
    console.log('DELETE rowCount:', deleted.rowCount);

    // Test 5: COUNT(*)
    const count = await query('SELECT COUNT(*)::int AS n FROM receipts');
    console.log('COUNT(*) FROM receipts:', count.rows[0].n);

    await closeDb();
    console.log('✅ DB test PASS');
    process.exit(0);
  } catch (err) {
    console.error('❌ DB test FAIL:', err.message);
    try {
      await closeDb();
    } catch (_) {}
    process.exit(1);
  }
}

main();
