/**
 * File: src/routes/analyze.js
 * Description: POST /api/analyze-receipt — validates receipt fields (R4), runs ELA, computes hashes, inserts into DB.
 * Part of: API routes
 * Main dependencies: express, multer (via ../middleware), sharp (via ../services/ela), ethers (via ../services/hash), pg (via ../db)
 */

const fs = require('fs');
const express = require('express');
const { upload, validateWalletBody } = require('../middleware');
const { analyze } = require('../services/ela');
const { normalizeReceiptFields, canonicalHash, imageHash } = require('../services/hash');
const { query } = require('../db');

const router = express.Router();

/**
 * POST /api/analyze-receipt handler — validates, runs ELA, hashes, inserts receipt, returns receiptId.
 *
 * @param {object} req - Express request; multipart form: image, receiptNumber, amount, receiptDate, storeName, walletAddress
 * @param {object} res - Express response
 * @returns {void} Sends JSON response with receiptId, hashes, tamperScore, verdict, onchainStatus
 *
 * @example
 * // multipart/form-data: image, receiptNumber, amount, receiptDate, storeName, walletAddress
 *
 * Notes:
 * - R4: checks receiptNumber → amount → receiptDate → storeName in order.
 * - R7: ELA note is internal only; not included in response; continues even if ELA fails.
 * - MVP: file is deleted after processing; image_url remains NULL.
 */
router.post('/analyze-receipt', upload.single('image'), validateWalletBody, async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  const cleanup = () => {
    if (filePath) {
      try {
        fs.unlink(filePath, () => {});
      } catch (_) {}
    }
  };

  try {
    const { receiptNumber, amount, receiptDate, storeName } = req.body;

    // R4: check required fields in order receiptNumber → amount → receiptDate → storeName
    const required = [
      ['receiptNumber', receiptNumber],
      ['amount', amount],
      ['receiptDate', receiptDate],
      ['storeName', storeName],
    ];
    for (const [field, value] of required) {
      if (value == null || String(value).trim() === '') {
        cleanup();
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'image is required' });
    }

    const fields = { receiptNumber, amount, receiptDate, storeName };

    // ELA (R6/R7) — note is internal only, not in response; failure still continues
    const { tamperScore, verdict } = await analyze(req.file.path);

    const normalized = normalizeReceiptFields(fields);
    const canonical = canonicalHash(fields);
    const buffer = fs.readFileSync(req.file.path);
    const imgHash = imageHash(buffer);

    const result = await query(
      `INSERT INTO receipts (
         wallet_address, image_url, image_hash, canonical_hash,
         receipt_number, amount, receipt_date, store_name,
         tamper_score, verdict, onchain_status
       ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING id`,
      [
        req.wallet,
        imgHash,
        canonical,
        normalized.receiptNumber,
        normalized.amount,
        normalized.receiptDate,
        normalized.storeName,
        tamperScore,
        verdict,
      ]
    );

    // MVP: file deleted after process — image_url NULL, no permanent image storage
    cleanup();

    return res.status(200).json({
      receiptId: result.rows[0].id,
      imageHash: imgHash,
      canonicalHash: canonical,
      tamperScore,
      verdict,
      onchainStatus: 'pending',
    });
  } catch (err) {
    console.error(err);
    cleanup();
    if (
      err &&
      err.message &&
      /^(amount invalid|receiptDate must be YYYY-MM-DD|receiptDate is not a valid date|receiptNumber is required|storeName is required)/.test(
        err.message
      )
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
