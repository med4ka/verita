/**
 * File: src/middleware/index.js
 * Description: Express middleware — multer file upload (R12), EVM wallet validation (R13), error handler, notFound.
 * Part of: API routes / middleware layer
 * Main dependencies: multer, fs, path
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '5', 10);
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] || 'bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      return cb(null, true);
    }
    cb(new Error('Only JPEG/PNG allowed'));
  },
});

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/i;

/**
 * Validate walletAddress from request body (R13); lowercases into req.wallet.
 *
 * @param {object} req - Express request; body.walletAddress
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {void} 400 on invalid wallet, else next()
 *
 * Notes:
 * - Pattern: ^0x[a-fA-F0-9]{40}$ then lowercased (R13).
 */
function validateWalletBody(req, res, next) {
  const walletAddress = req.body && req.body.walletAddress;
  if (!walletAddress || !WALLET_RE.test(String(walletAddress))) {
    return res.status(400).json({ error: 'invalid wallet address' });
  }
  req.wallet = String(walletAddress).toLowerCase();
  next();
}

/**
 * Validate wallet from query string (R13); lowercases into req.wallet.
 *
 * @param {object} req - Express request; query.wallet
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {void} 400 on invalid wallet, else next()
 */
function validateWalletQuery(req, res, next) {
  const wallet = req.query && req.query.wallet;
  if (!wallet || !WALLET_RE.test(String(wallet))) {
    return res.status(400).json({ error: 'invalid wallet address' });
  }
  req.wallet = String(wallet).toLowerCase();
  next();
}

/**
 * Global Express error handler — maps known errors to 400, others to 500.
 *
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {void} 400 for file too large / invalid type; 500 for unexpected
 *
 * Notes:
 * - LIMIT_FILE_SIZE → 400 'file too large, max 5MB' (R12).
 * - 'Only JPEG/PNG allowed' → 400 (R12).
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  console.error('[ERROR]', err.stack);

  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'file too large, max 5MB' });
  }
  if (err && err.message === 'Only JPEG/PNG allowed') {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'internal error' });
}

/**
 * 404 handler for unmatched routes.
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @returns {void} 404 { error: 'not found' }
 */
function notFound(req, res) {
  res.status(404).json({ error: 'not found' });
}

module.exports = {
  upload,
  validateWalletBody,
  validateWalletQuery,
  errorHandler,
  notFound,
  UPLOAD_DIR,
};
