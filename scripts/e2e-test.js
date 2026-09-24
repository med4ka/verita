// End-to-end test endpoints docs/spec/schema.md §3 — node scripts/e2e-test.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:3000';
const WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const IMG = path.join(ROOT, 'tests', 'fixtures', 'test-clean.jpg');
const TX = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

const results = [];
function log(label, s) {
  results.push(`=== ${label} ===\n${s}`);
  console.log(`=== ${label} ===`);
  console.log(s);
}

async function waitHealth(ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return await r.text();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('server not healthy');
}

async function main() {
  const server = spawn(process.execPath, ['src/index.js'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (d) => { serverLog += d; });
  server.stderr.on('data', (d) => { serverLog += d; });

  try {
    const health = await waitHealth();
    log('HEALTH', health);

    // Test 1: analyze
    const fd1 = new FormData();
    fd1.append('image', new Blob([fs.readFileSync(IMG)], { type: 'image/jpeg' }), 'test-clean.jpg');
    fd1.append('receiptNumber', 'INV-001');
    fd1.append('amount', '150000');
    fd1.append('receiptDate', '2026-09-22');
    fd1.append('storeName', 'Toko ABC');
    fd1.append('walletAddress', WALLET);
    const r1 = await fetch(`${BASE}/api/analyze-receipt`, { method: 'POST', body: fd1 });
    const b1 = await r1.text();
    log('TEST 1: POST /api/analyze-receipt', `HTTP ${r1.status}\n${b1}`);
    const a1 = JSON.parse(b1);
    const rid = a1.receiptId;
    const chash = a1.canonicalHash;

    // Test 2: list
    const r2 = await fetch(`${BASE}/api/receipts?wallet=${WALLET}`);
    const b2 = await r2.text();
    log('TEST 2: GET /api/receipts?wallet=', `HTTP ${r2.status}\n${b2}`);

    // Test 3: check-duplicate
    const r3 = await fetch(`${BASE}/api/receipts/check-duplicate?hash=${chash}`);
    const b3 = await r3.text();
    log('TEST 3: GET /api/receipts/check-duplicate?hash=', `HTTP ${r3.status}\n${b3}`);

    // Test 4: confirm-onchain
    const r4 = await fetch(`${BASE}/api/receipts/${rid}/confirm-onchain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash: TX, onchainStatus: 'registered' }),
    });
    const b4 = await r4.text();
    log('TEST 4: POST /api/receipts/:id/confirm-onchain', `HTTP ${r4.status}\n${b4}`);

    // Test 5: verify list again
    const r5 = await fetch(`${BASE}/api/receipts?wallet=${WALLET}`);
    const b5 = await r5.text();
    log('TEST 5: GET /api/receipts (verify registered)', `HTTP ${r5.status}\n${b5}`);

    // Test 6: missing storeName → 400
    const fd6 = new FormData();
    fd6.append('image', new Blob([fs.readFileSync(IMG)], { type: 'image/jpeg' }), 'test-clean.jpg');
    fd6.append('receiptNumber', 'INV-002');
    fd6.append('amount', '150000');
    fd6.append('receiptDate', '2026-09-22');
    fd6.append('walletAddress', WALLET);
    const r6 = await fetch(`${BASE}/api/analyze-receipt`, { method: 'POST', body: fd6 });
    const b6 = await r6.text();
    log('TEST 6: POST analyze tanpa storeName', `HTTP ${r6.status}\n${b6}`);

    const outFile = path.join(ROOT, 'tests', 'output', 'curl-test-output.txt');
    fs.writeFileSync(outFile, results.join('\n\n') + '\n', 'utf8');
    console.log('\nALL TESTS DONE — saved tests/output/curl-test-output.txt');
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error('E2E FAIL:', e);
  process.exit(1);
});
