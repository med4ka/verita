/**
 * File: src/routes/receipts.js
 * Description: GET /api/receipts, GET /api/receipts/check-duplicate, POST /api/receipts/:id/confirm-onchain per schema.md §3, rules.md R9/R11/R13. receiptId = SERIAL integer.
 * Part of: API routes
 * Main dependencies: express, pg (via ../db)
 */

const express = require('express');
const { validateWalletQuery } = require('../middleware');
const { query } = require('../db');

const router = express.Router();

const HASH_RE = /^0x[a-fA-F0-9]{64}$/i;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/i;
const ONCHAIN_STATUSES = ['registered', 'rejected_duplicate'];

/**
 * GET /api/receipts?wallet=0x... — lists receipts for a wallet, newest first.
 *
 * @param {object} req - Express request; query: wallet (validated EVM address)
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {void} Sends JSON array of receipt objects
 */
// GET /api/receipts?wallet=0x...
router.get('/receipts', validateWalletQuery, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, store_name, amount, verdict, canonical_hash, onchain_status, onchain_tx_hash, created_at
       FROM receipts
       WHERE wallet_address = $1
       ORDER BY created_at DESC`,
      [req.wallet]
    );
    const rows = result.rows.map((row) => ({
      receiptId: row.id,
      storeName: row.store_name,
      amount: Number(row.amount),
      verdict: row.verdict,
      canonicalHash: row.canonical_hash,
      onchainStatus: row.onchain_status,
      txHash: row.onchain_tx_hash,
      createdAt: row.created_at,
    }));
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/receipts/check-duplicate?hash=0x... — soft-check for duplicate claim (R9).
 *
 * @param {object} req - Express request; query: hash (0x + 64 hex chars, canonicalHash)
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {void} Sends { isClaimed: boolean, claimant?: string, timestamp?: number } or 400 invalid hash
 *
 * Notes:
 * - Soft-check for UX only; hard-check is registerClaim() on contract (source of truth).
 */
// GET /api/receipts/check-duplicate?hash=0x... (R9 soft-check)
router.get('/receipts/check-duplicate', async (req, res, next) => {
  try {
    const hash = req.query.hash;
    if (!hash || !HASH_RE.test(String(hash))) {
      return res.status(400).json({ error: 'invalid hash' });
    }
    const result = await query(
      `SELECT wallet_address, created_at
       FROM receipts
       WHERE canonical_hash = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [String(hash).toLowerCase()]
    );
    if (!result.rows.length) {
      return res.status(200).json({ isClaimed: false });
    }
    const row = result.rows[0];
    return res.status(200).json({
      isClaimed: true,
      claimant: row.wallet_address,
      timestamp: Math.floor(new Date(row.created_at).getTime() / 1000),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/receipts/:id/confirm-onchain — syncs onchain_status after tx completes (R11).
 *
 * @param {object} req - Express request; params: id (SERIAL integer); body: txHash (0x + 64 hex), onchainStatus ('registered' | 'rejected_duplicate')
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {void} Sends { ok: true } on success, 400 on invalid input, 404 if receipt not found
 *
 * Notes:
 * - Called by frontend after wallet signs registerClaim; if forgotten, status stays 'pending' (MVP acceptable).
 */
// POST /api/receipts/:id/confirm-onchain (R11) — :id = SERIAL integer
router.post('/receipts/:id/confirm-onchain', async (req, res, next) => {
  try {
    const { txHash, onchainStatus } = req.body || {};

    if (!txHash || typeof txHash !== 'string' || !TX_HASH_RE.test(txHash)) {
      return res.status(400).json({ error: 'invalid txHash' });
    }
    if (!ONCHAIN_STATUSES.includes(onchainStatus)) {
      return res
        .status(400)
        .json({ error: 'onchainStatus must be registered or rejected_duplicate' });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid receipt id' });
    }

    const result = await query(
      `UPDATE receipts
       SET onchain_tx_hash = $1, onchain_status = $2
       WHERE id = $3
       RETURNING id`,
      [txHash.toLowerCase(), onchainStatus, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'receipt not found' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
