/**
 * File: src/services/ela.test.js
 * Description: Unit test for ELA module — run: node src/services/ela.test.js. Generates 2 synthetic images and asserts clean vs tampered relative score, plus corrupt/missing file fallback.
 * Part of: AI forensics / tests
 * Main dependencies: sharp, ./ela
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { analyze } = require('./ela');

const W = 500;
const H = 500;

/**
 * Deterministic PRNG so tests are stable across runs.
 *
 * @param {number} seed - Initial seed
 * @returns {function(): number} Function returning [0,1) floats
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build solid-color 500×500 RGB pixels with slight noise (±3 around 200).
 *
 * @returns {Buffer} Raw RGB pixel buffer (W*H*3)
 */
function makeBasePixels() {
  // Solid color 500x500 + slight noise (±3 around 200)
  const rand = mulberry32(42);
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const noise = Math.floor(rand() * 7) - 3;
    const v = Math.min(255, Math.max(0, 200 + noise));
    buf[i * 3] = v;
    buf[i * 3 + 1] = v;
    buf[i * 3 + 2] = v;
  }
  return buf;
}

/**
 * Overlay a size×size sharp-colored block at center (simulates paste/edit).
 *
 * @param {Buffer} pixels - Input RGB pixel buffer (mutated in place)
 * @param {number} size - Overlay square side in pixels
 * @returns {Buffer} Same buffer after overlay
 */
function overlayCenter(pixels, size) {
  // Overlay size×size area at center with sharp different color (simulates paste/edit)
  const ox = Math.floor((W - size) / 2);
  const oy = Math.floor((H - size) / 2);
  for (let y = oy; y < oy + size; y++) {
    for (let x = ox; x < ox + size; x++) {
      const i = (y * W + x) * 3;
      pixels[i] = 30;
      pixels[i + 1] = 30;
      pixels[i + 2] = 200;
    }
  }
  return pixels;
}

/**
 * Run all ELA assertions: clean vs tampered relative score, corrupt/missing fallback.
 *
 * @returns {Promise<void>} Sets process.exitCode to 1 on failure; prints RESULT: PASS/FAIL
 *
 * Notes:
 * - Asserts tampered.tamperScore > clean.tamperScore (relative, not absolute threshold).
 * - Corrupt/missing file must return { 50, suspicious, note } without throwing (R7).
 */
async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ela-test-'));
  const cleanPath = path.join(dir, 'test-clean.jpg');
  const tamperedPath = path.join(dir, 'test-tampered.jpg');

  const cleanPixels = makeBasePixels();
  await sharp(cleanPixels, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 92 })
    .toFile(cleanPath);

  const tamperedPixels = overlayCenter(Buffer.from(cleanPixels), 100);
  await sharp(tamperedPixels, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 92 })
    .toFile(tamperedPath);

  const clean = await analyze(cleanPath);
  const tampered = await analyze(tamperedPath);

  console.log('clean   :', JSON.stringify(clean));
  console.log('tampered:', JSON.stringify(tampered));

  let failed = false;
  if (clean.verdict !== 'clean') {
    console.error(`FAIL: expected clean.verdict === 'clean', got '${clean.verdict}'`);
    failed = true;
  }
  if (!(tampered.tamperScore > clean.tamperScore)) {
    console.error(`FAIL: expected tampered.tamperScore (${tampered.tamperScore}) > clean.tamperScore (${clean.tamperScore})`);
    failed = true;
  }

  // Error handling: corrupt file must not throw
  const badPath = path.join(dir, 'bad.jpg');
  fs.writeFileSync(badPath, Buffer.from('not-an-image'));
  const bad = await analyze(badPath);
  console.log('corrupt :', JSON.stringify(bad));
  if (bad.verdict !== 'suspicious' || bad.tamperScore !== 50 || !bad.note) {
    console.error('FAIL: corrupt file should fallback to {50, suspicious, note}');
    failed = true;
  }

  // Error handling: missing path
  const missing = await analyze(path.join(dir, 'nope.jpg'));
  console.log('missing :', JSON.stringify(missing));
  if (missing.verdict !== 'suspicious' || missing.tamperScore !== 50) {
    console.error('FAIL: missing file should fallback to {50, suspicious, note}');
    failed = true;
  }

  if (failed) {
    process.exitCode = 1;
    console.log('RESULT: FAIL');
  } else {
    console.log('RESULT: PASS');
  }

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

main().catch((err) => {
  console.error('test crashed:', err);
  process.exitCode = 1;
});
