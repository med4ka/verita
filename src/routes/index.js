/**
 * File: src/routes/index.js
 * Description: Main /api router — mounts analyze and receipts routers per schema.md §3.
 * Part of: API routes
 * Main dependencies: express, ./analyze, ./receipts
 */

const express = require('express');
const analyzeRouter = require('./analyze');
const receiptsRouter = require('./receipts');

const router = express.Router();

// POST /api/analyze-receipt
router.use('/', analyzeRouter);

// GET /api/receipts & GET /api/receipts/check-duplicate (static route before :id)
// POST /api/receipts/:id/confirm-onchain
router.use('/', receiptsRouter);

module.exports = router;
