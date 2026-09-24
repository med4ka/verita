/**
 * File: src/services/hash.js
 * Description: Field normalization and hashing — rules.md R1, R4, R5. canonicalHash = solidityPackedKeccak256(string receiptNumber, uint256 amount, string receiptDate, string storeName). imageHash = sha256(file bytes) per schema.md §1.
 * Part of: AI forensics / hashing
 * Main dependencies: ethers (solidityPackedKeccak256), crypto
 */

const crypto = require('crypto');
const { solidityPackedKeccak256 } = require('ethers');

/**
 * Normalize receipt fields before hashing (R5).
 *
 * @param {object} fields - { receiptNumber, amount, receiptDate, storeName }
 * @param {string} fields.receiptNumber - Receipt number; trimmed and uppercased
 * @param {string|number} fields.amount - Amount; decimal string ("150000.50") → ×100 then round; else strip non-digits; NaN throws
 * @param {string} fields.receiptDate - Must be YYYY-MM-DD and a valid date; returned as-is
 * @param {string} fields.storeName - Store name; lowercased, trimmed, whitespace collapsed
 * @returns {{receiptNumber: string, amount: number, receiptDate: string, storeName: string}} Normalized fields
 *
 * @example
 * // normalizeReceiptFields({ receiptNumber: " INV-001 ", amount: "150000.00", receiptDate: "2026-09-22", storeName: "  Toko  ABC " })
 * // → { receiptNumber: "INV-001", amount: 15000000, receiptDate: "2026-09-22", storeName: "toko abc" }
 *
 * Notes:
 * - Throws 'receiptNumber is required' / 'storeName is required' if empty after trim.
 * - Throws 'receiptDate must be YYYY-MM-DD' or 'receiptDate is not a valid date' on bad date.
 * - Throws 'amount invalid' if amount cannot be parsed to a number.
 * - Never hashes raw floats (R5).
 */
function normalizeReceiptFields({ receiptNumber, amount, receiptDate, storeName } = {}) {
  // receiptNumber: trim + uppercase (R5)
  const rn = String(receiptNumber == null ? '' : receiptNumber).trim().toUpperCase();
  if (!rn) throw new Error('receiptNumber is required');

  // amount: integer — decimal string ("150000.50") → ×100 then Math.round;
  // otherwise strip non-digits. NaN → throw (R5: do not hash raw floats).
  const amountInt = parseAmount(amount);

  // receiptDate: must be YYYY-MM-DD + valid date; return string as-is (R5)
  const rd = String(receiptDate == null ? '' : receiptDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rd)) {
    throw new Error('receiptDate must be YYYY-MM-DD');
  }
  const parsed = new Date(`${rd}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== rd) {
    throw new Error('receiptDate is not a valid date');
  }

  // storeName: lowercase, trim, collapse whitespace (R5)
  const sn = String(storeName == null ? '' : storeName)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  if (!sn) throw new Error('storeName is required');

  return {
    receiptNumber: rn,
    amount: amountInt,
    receiptDate: rd,
    storeName: sn,
  };
}

/**
 * Parse amount to integer minor units for hashing (R5).
 *
 * @param {string|number} amount - Raw amount from form
 * @returns {number} Integer amount
 *
 * Notes:
 * - Decimal string ("150000.50") → ×100 then round.
 * - No decimal: strip all non-digits ("150,000" → 150000).
 * - Throws 'amount invalid' if null, empty, or not a number.
 */
function parseAmount(amount) {
  if (amount == null || amount === '') throw new Error('amount invalid');

  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) throw new Error('amount invalid');
    if (Number.isInteger(amount)) return amount;
    return Math.round(amount * 100);
  }

  const s = String(amount).trim();
  if (!s) throw new Error('amount invalid');

  // Decimal string (e.g. "150000.50") → ×100 first, then round
  if (s.includes('.')) {
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error('amount invalid');
    return Math.round(n * 100);
  }

  // No decimal: strip all non-digits ("150,000" → 150000)
  const digits = s.replace(/\D/g, '');
  if (!digits) throw new Error('amount invalid');
  const n = Number(digits);
  if (Number.isNaN(n)) throw new Error('amount invalid');
  return n;
}

/**
 * On-chain canonicalHash — Solidity packed types match the contract exactly:
 * (string receiptNumber, uint256 amount, string receiptDate, string storeName)
 *
 * @param {object} fields - { receiptNumber, amount, receiptDate, storeName }
 * @returns {string} 0x + 64 hex chars
 */
function canonicalHash(fields) {
  const n = normalizeReceiptFields(fields);
  return solidityPackedKeccak256(
    ['string', 'uint256', 'string', 'string'],
    [n.receiptNumber, n.amount, n.receiptDate, n.storeName]
  );
}

/**
 * sha256 of image file bytes.
 *
 * @param {Buffer} buffer - Image file bytes
 * @returns {string} 0x + 64 hex chars
 *
 * Notes:
 * - Throws if buffer is not a non-empty Buffer.
 */
function imageHash(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('imageHash requires a non-empty Buffer');
  }
  return `0x${crypto.createHash('sha256').update(buffer).digest('hex')}`;
}

module.exports = {
  normalizeReceiptFields,
  canonicalHash,
  imageHash,
};
