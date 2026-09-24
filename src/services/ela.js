/**
 * File: src/services/ela.js
 * Description: ELA (Error Level Analysis) via sharp — rules.md R6/R7, system.md §4. Input: image filepath (string). Output: Promise<{ tamperScore: 0-100, verdict: 'clean'|'suspicious'|'tampered', note?: string }>. On ELA failure: fallback { 50, 'suspicious', note } — does not throw to caller.
 * Part of: AI forensics
 * Main dependencies: sharp
 */

const sharp = require('sharp');

const ELA_QUALITY = Number(process.env.ELA_QUALITY || 90);
const TH_SUSPICIOUS = Number(process.env.TAMPER_THRESHOLD_SUSPICIOUS || 30);
const TH_TAMPERED = Number(process.env.TAMPER_THRESHOLD_TAMPERED || 60);

/**
 * Clamp a number to [min, max].
 *
 * @param {number} n - Input value
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number} Clamped value
 */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Map tamper score to verdict using env thresholds (default 30/60).
 *
 * @param {number} score - 0-100 tamper score
 * @returns {string} 'clean' | 'suspicious' | 'tampered'
 *
 * Notes:
 * - R6: thresholds from TAMPER_THRESHOLD_SUSPICIOUS / TAMPER_THRESHOLD_TAMPERED.
 */
function verdictFromScore(score) {
  if (score >= TH_TAMPERED) return 'tampered';
  if (score >= TH_SUSPICIOUS) return 'suspicious';
  return 'clean';
}

/**
 * Run ELA on an image file.
 *
 * @param {string} filepath - Path to image file (jpeg/png)
 * @returns {Promise<{tamperScore: number, verdict: string, note?: string}>} Result
 *
 * @example
 * // const { tamperScore, verdict } = await analyze('/path/to/receipt.jpg');
 *
 * Notes:
 * - R6: score from distribution (mean + outlier%), not just average.
 * - R7: on failure returns { 50, 'suspicious', note: 'ELA failed: ...' } instead of throwing.
 * - Coefficients COEF_MEAN/COEF_OUTLIER are initial; recalibrate H-1 with real receipt samples.
 */
async function analyze(filepath) {
  try {
    if (typeof filepath !== 'string' || !filepath) {
      throw new Error('filepath is required');
    }

    // 1-2. Read + re-compress JPEG (quality ELA_QUALITY, chroma 4:4:4 for fairer RGB diff)
    const recompressed = await sharp(filepath)
      .jpeg({ quality: ELA_QUALITY, chromaSubsampling: '4:4:4' })
      .toBuffer();

    // 3. Raw pixels of both versions — force RGB 3 channels so buffers are comparable
    const originalRaw = await sharp(filepath)
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const recompressedRaw = await sharp(recompressed)
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data: a, info: infoA } = originalRaw;
    const { data: b, info: infoB } = recompressedRaw;

    if (a.length !== b.length || infoA.width !== infoB.width || infoA.height !== infoB.height || infoA.channels !== infoB.channels) {
      throw new Error('buffer size/channels mismatch after recompress');
    }

    const channels = infoA.channels;
    const pixelCount = infoA.width * infoA.height;
    if (pixelCount === 0 || channels < 1) {
      throw new Error('empty image');
    }

    // 4. Absolute difference per channel per pixel → aggregate per-pixel (mean across channels)
    //    Keep per-pixel mean abs diff for distribution statistics.
    const pixelDiff = new Float64Array(pixelCount);
    let sumDiff = 0;

    for (let p = 0; p < pixelCount; p++) {
      const base = p * channels;
      let pixelSum = 0;
      for (let c = 0; c < channels; c++) {
        pixelSum += Math.abs(a[base + c] - b[base + c]);
      }
      const d = pixelSum / channels;
      pixelDiff[p] = d;
      sumDiff += d;
    }

    // 5. Score based on DISTRIBUTION (mean + outlier%), not just average.
    const meanDiff = sumDiff / pixelCount;
    let variance = 0;
    for (let p = 0; p < pixelCount; p++) {
      const dv = pixelDiff[p] - meanDiff;
      variance += dv * dv;
    }
    const stdDiff = Math.sqrt(variance / pixelCount);

    // Outlier = pixel with diff > mean + 2*std ("suspicious area")
    const thresholdOutlier = meanDiff + 2 * stdDiff;
    let outlierCount = 0;
    for (let p = 0; p < pixelCount; p++) {
      if (pixelDiff[p] > thresholdOutlier) outlierCount += 1;
    }
    const outlierPercentage = (outlierCount / pixelCount) * 100;

    // INITIAL COEFFICIENTS — tune / recalibrate H-1 with real receipt vs edited samples.
    // meanDiff/255*40 → mean error contribution (max ~40 for extreme diff)
    // outlierPercentage*1.5 → outlier area contribution (e.g. 10% outliers → +15)
    const COEF_MEAN = 40;
    const COEF_OUTLIER = 1.5;
    const rawScore = (meanDiff / 255) * COEF_MEAN + outlierPercentage * COEF_OUTLIER;
    const tamperScore = clamp(Math.round(rawScore), 0, 100);

    return { tamperScore, verdict: verdictFromScore(tamperScore) };
  } catch (err) {
    // rules.md edge case: ELA failure → do not crash the request
    const msg = (err && err.message) ? String(err.message).slice(0, 120) : 'unknown error';
    console.error('[ELA]', err);
    return {
      tamperScore: 50,
      verdict: 'suspicious',
      note: `ELA failed: ${msg}`,
    };
  }
}

module.exports = { analyze };
