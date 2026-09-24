# Progress Log

## [2026-09-23T00:00:00+07:00] — Bootstrap skeleton
- Bikin aturan coding di root: `CODING_RULES.md` (diminta `RULES.md`, tapi Windows case-insensitive sehingga `RULES.md` akan menimpa spec `rules.md` — dipakai nama lain agar spec tidak diubah): stack Node.js + Express, ethers v6, sharp (ELA), better-sqlite3 tanpa ORM, plain JS.
- Bikin struktur folder skeleton: `src/index.js`, `src/routes/`, `src/services/ela.js`, `src/services/hash.js`, `src/db/index.js`, `src/middleware/`, `uploads/` (+ `.gitignore` untuk isi uploads).
- `src/index.js`: Express minimal — CORS dari `CORS_ORIGIN`, body limit dari `MAX_UPLOAD_SIZE_MB`, listen `PORT`, route `GET /health`, error handler dasar (LIMIT_FILE_SIZE → 413).
- `package.json` dengan dependency: express, cors, multer, ethers, sharp, better-sqlite3, dotenv (+ script `start`/`dev`).
- `.env.example` sesuai system.md §6 (PORT, DATABASE_URL, MAX_UPLOAD_SIZE_MB, ELA_QUALITY, TAMPER_THRESHOLD_*, CORS_ORIGIN).
- `STATE.md` dibuat: kondisi skeleton done, endpoint/logic belum ada.
- Tidak ada endpoint API yang diimplementasi; file spec `.md` tidak diubah.

## [2026-09-23T01:00:00+07:00] — Contract ReceiptRegistry final + deploy guide
- Bikin `contracts/ReceiptRegistry.sol` final (Solidity `^0.8.20`) dari schema.md §2: struct `Claim`, mapping `claims`/`isClaimed`, event `ClaimRegistered` + `DuplicateRejected`, `registerClaim` dengan revert string `"Duplicate receipt: already claimed"`.
- `checkClaim(bytes32)` diperluas: return `(bool exists, address claimant, uint256 timestamp, string metadataURI)` — `metadataURI` ditambahkan supaya frontend bisa tampilkan link detail record.
- Bikin `contracts/README.md`: step-by-step deploy via Remix ke BOT Chain Testnet (Chain ID `968`, RPC `https://rpc.bohr.life`, Explorer `https://scan.bohr.life`), termasuk setup MetaMask network, smoke test register/duplicate/checkClaim, verifikasi source di explorer, troubleshooting.
- Belum deploy — deploy & verify dilakukan manual di Remix (bukan dari CI/script).
- Update `STATE.md` (contract final done, endpoint & deploy masih pending); `progress.md` di-append.

## [2026-09-23T12:30:00+07:00] — ELA module
- Implementasi `src/services/ela.js`: `analyze(filepath)` → `Promise<{ tamperScore, verdict, note? }>` — baca sharp, re-compress JPEG `ELA_QUALITY` (default 90, `chromaSubsampling: '4:4:4'`), raw pixel original vs recompressed, abs diff per channel.
- Skor distribusi: `meanDiff`, `std`, % piksel `diff > mean + 2*std` (outlier), `score = clamp(round(meanDiff/255*40 + outlier%*1.5), 0, 100)` — koefisien ditandai awal & bisa di-tune di kode.
- Verdict via env `TAMPER_THRESHOLD_SUSPICIOUS`/`TAMPER_THRESHOLD_TAMPERED` (default 30/60) sesuai R6; R7: verdict tidak dipakai untuk blokir di module ini (murni scoring).
- Error handling: sharp throw → `{ tamperScore: 50, verdict: 'suspicious', note: 'ELA failed: ...' }` + `console.error('[ELA]', ...)`, tidak rethrow (edge case R7/§5).
- Unit test `src/services/ela.test.js` (`npm run test:ela`): generate `test-clean.jpg` (solid 500×500 noise ±3) & `test-tampered.jpg` (+overlay 100×100 biru tajam di tengah).
- **Hasil test:**
  ```
  clean   : {"tamperScore":0,"verdict":"clean"}
  tampered: {"tamperScore":2,"verdict":"clean"}
  corrupt : {"tamperScore":50,"verdict":"suspicious","note":"ELA failed: Input file contains unsupported image format"}
  missing : {"tamperScore":50,"verdict":"suspicious","note":"ELA failed: Input file is missing: ..."}
  RESULT: PASS
  ```
  (tampered score > clean ✓; corrupt/missing fallback suspicious ✓ — threshold masih perlu kalibrasi dengan nota asli, R6)
- Catatan: `npm install` penuh masih gagal di `better-sqlite3` (butuh Windows SDK / VS C++ Build Tools) — `sharp` & deps lain terpasang OK; `better-sqlite3` tetap di `package.json`.
- Update `STATE.md`; spec `.md` tidak diubah.

## [2026-09-23T13:30:00+07:00] — Hash module + HASHING.md
- Implementasi `src/services/hash.js` (rules.md R1/R4/R5), 3 export:
  - `normalizeReceiptFields` — receiptNumber trim+uppercase; amount → integer (string desimal `×100`+round, else buang non-digit, NaN throw `'amount invalid'`); receiptDate regex `YYYY-MM-DD` + date valid; storeName lowercase/trim/collapse spasi; field wajib non-kosong.
  - `canonicalHash(fields)` — ethers v6 `solidityPackedKeccak256(['string','uint256','string','string'], [...])` → `0x` 66 char.
  - `imageHash(buffer)` — Node `crypto` sha256 + prefix `0x` → 66 char.
- Contoh nyata (dijalankan di Node): input `{ " INV-001 ", "150000.00", "2026-09-22", "  Toko  ABC " }` → normalized `{ INV-001, 15000000, 2026-09-22, toko abc }` → `canonicalHash = 0xbc23949c0fb885127fded6c0dc09ae7bffe4e6680b998f65508e9ca253a435f0`.
- Bikin `HASHING.md` di root: urutan field+tipe packed, semua aturan normalisasi, contoh input/normalized/hash nyata, snippet ethers browser `solidityPackedKeccak256` ekuivalen untuk frontend, catatan imageHash.
- Edge case dicek: amount `'abc'` → throw; date `2026-02-30` → throw; `'150,000'` → `150000`; `'150000.50'` → `15000050`.
- Update `STATE.md`; spec `.md` tidak diubah.

## [2026-09-23T20:52:00+07:00] — Migrasi SQLite → Supabase Postgres
- `package.json`: `better-sqlite3` di-uninstall (sudah tidak ada), `pg@8.23.0` terpasang, script `"test:db": "node scripts/test-db.js"` ditambahkan.
- Rewrite total `src/db/index.js` pakai `pg.Pool`: `DATABASE_URL` dari env; config `max: 5`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`; export `pool`, `query(text, params)`, `initDb()`, `closeDb()`.
- `initDb()`: `CREATE TABLE IF NOT EXISTS receipts` sesuai schema.md §1 (**id SERIAL** PRIMARY KEY, kolom NOT NULL sesuai spes: `tamper_score`, `verdict`, `receipt_number`/`store_name` VARCHAR(255), dll), `CREATE INDEX IF NOT EXISTS idx_receipts_wallet` + `idx_receipts_canonical_hash`; log `[DB] connected` / `[DB] init error: <msg>` + throw.
- `src/index.js`: `await initDb()` **sebelum** `app.listen()`; gagal → `console.error` + `process.exit(1)`; `process.on('SIGTERM'|'SIGINT', closeDb)` graceful shutdown.
- Rewrite `scripts/test-db.js` (5 test: SELECT NOW, INSERT dummy RETURNING id, SELECT by id, DELETE, COUNT(*)) — exit 0/1 dengan `✅ DB test PASS` / `❌ DB test FAIL`.
- `.env` sudah ada di `.gitignore` (tidak diubah; isi `.env` tidak dicetak).
- **Output `npm run test:db`:**
  ```
  [DB] connected
  SELECT NOW(): 2026-09-23T13:52:02.628Z
  INSERT dummy id: 1
  SELECT by id: {"id":1,"wallet_address":"0x1234567890abcdef1234567890abcdef12345678","receipt_number":"INV-TEST-001","amount":"150000","verdict":"clean","onchain_status":"pending"}
  DELETE rowCount: 1
  COUNT(*) FROM receipts: 0
  ✅ DB test PASS
  ```
  exit code 0.
- R4 (field wajib), R11 (confirm-onchain sinkron status), R13 (wallet EVM) tetap berlaku di routes di atas DB ini.
- Spec `.md` tidak diubah; isi `.env` tidak dicetak.

## [2026-09-23T14:10:00+07:00] — Implementasi endpoints
- Rewrite `src/middleware/index.js`: `upload` (multer disk→`uploads/`, filename `${Date.now()}-${Math.round(Math.random()*1e9)}.<ext-from-mimetype>`, limit `MAX_UPLOAD_SIZE_MB`, fileFilter jpeg/png), `validateWalletBody` (R13), `validateWalletQuery` (R13), `errorHandler` (LIMIT_FILE_SIZE→400, Only JPEG/PNG→400, else 500 + log `[ERROR]`), `notFound` (404).
- Rewrite `src/routes/analyze.js` — POST `/api/analyze-receipt`: upload→validateWalletBody→R4 cek urut (receiptNumber→amount→receiptDate→storeName)→ELA→normalize+canonicalHash+imageHash→INSERT RETURNING id (SERIAL number)→unlink file via callback; ELA `note` tidak ikut response; unexpected error→cleanup+500.
- Rewrite `src/routes/receipts.js`:
  - GET `/api/receipts?wallet=` → validateWalletQuery, SELECT … ORDER BY created_at DESC, map `receiptId`=integer.
  - GET `/api/receipts/check-duplicate?hash=` → regex `^0x[a-fA-F0-9]{64}$`, ORDER BY created_at ASC LIMIT 1 → `{isClaimed, claimant, timestamp}` / `{isClaimed:false}`.
  - POST `/api/receipts/:id/confirm-onchain` → validasi txHash + onchainStatus enum, id integer, UPDATE RETURNING id, rowCount 0→404, else `{ok:true}`.
- `src/routes/index.js` mount analyze + receipts; `src/index.js` `fs.mkdirSync('uploads')`, `/api` → notFound → errorHandler paling akhir.
- **receiptId = SERIAL integer** (bukan UUID) di semua response.
- **Test e2e (server lokal `node src/index.js` + request ke 4 endpoint + 2 negative) — output nyata:**
  ```
  HEALTH: {"ok":true}

  TEST 1: POST /api/analyze-receipt → HTTP 200
  {"receiptId":3,"imageHash":"0x955fbfbcbe434b979fcdbf4ad3b4242e93429ec48e994f47ccf4e5d6c30f2795","canonicalHash":"0x00cd032aced11dcf88a85b48e045d57f2d1509da295e511e306bf6a2ad1fc5c4","tamperScore":0,"verdict":"clean","onchainStatus":"pending"}

  TEST 2: GET /api/receipts?wallet=0x1234567890abcdef1234567890abcdef12345678 → HTTP 200
  [{"receiptId":3,"storeName":"toko abc","amount":150000,"verdict":"clean","canonicalHash":"0x00cd032aced11dcf88a85b48e045d57f2d1509da295e511e306bf6a2ad1fc5c4","onchainStatus":"pending","txHash":null,"createdAt":"2026-09-23T07:04:36.300Z"}]

  TEST 3: GET /api/receipts/check-duplicate?hash=0x00cd032aced11dcf88a85b48e045d57f2d1509da295e511e306bf6a2ad1fc5c4 → HTTP 200
  {"isClaimed":true,"claimant":"0x1234567890abcdef1234567890abcdef12345678","timestamp":1790147076}

  TEST 4: POST /api/receipts/3/confirm-onchain → HTTP 200
  {"ok":true}

  TEST 5: GET /api/receipts (verify) → HTTP 200
  [{"receiptId":3,"storeName":"toko abc","amount":150000,"verdict":"clean","canonicalHash":"0x00cd032aced11dcf88a85b48e045d57f2d1509da295e511e306bf6a2ad1fc5c4","onchainStatus":"registered","txHash":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","createdAt":"2026-09-23T07:04:36.300Z"}]

  TEST 6: POST analyze tanpa storeName → HTTP 400
  {"error":"storeName is required"}
  ```
- Setara curl (wallet/hash/id dari run di atas):
  ```
  curl -X POST http://localhost:3000/api/analyze-receipt \
    -F "image=@test-clean.jpg" \
    -F "receiptNumber=INV-001" \
    -F "amount=150000" \
    -F "receiptDate=2026-09-22" \
    -F "storeName=Toko ABC" \
    -F "walletAddress=0x1234567890abcdef1234567890abcdef12345678"

  curl "http://localhost:3000/api/receipts?wallet=0x1234567890abcdef1234567890abcdef12345678"

  curl "http://localhost:3000/api/receipts/check-duplicate?hash=0x00cd032aced11dcf88a85b48e045d57f2d1509da295e511e306bf6a2ad1fc5c4"

  curl -X POST http://localhost:3000/api/receipts/3/confirm-onchain \
    -H "Content-Type: application/json" \
    -d '{"txHash":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","onchainStatus":"registered"}'
  ```
- Semua endpoint OK (Test 1–5 HTTP 200, Test 6 HTTP 400 sesuai R4). Spec `.md` tidak diubah; `.env` tidak dicetak.

## [2026-09-23T21:35:00+07:00] — Integration test backend ↔ contract testnet PASS
- Bikin `scripts/test-claim.js` (manual integration test, bukan unit test): dotenv root, env wajib `TEST_PK` + default `TESTNET_RPC=https://rpc.bohr.life` / `CONTRACT_ADDRESS_TESTNET=0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7`, ethers v6 (`JsonRpcProvider` + `Wallet` + `Contract`), ABI minimal (`registerClaim`, `checkClaim` 4-tuple, events `ClaimRegistered`/`DuplicateRejected`).
- Script: hash unik `keccak256(toUtf8Bytes('test-'+Date.now()))` → Test1 register+wait, Test2 expect revert (hard-check R9), Test3 `checkClaim` verify exists/claimant/`metadataURI==='meta://test-1'` (R10), Test4 random hash `exists=false`; PASS → `✅ ALL INTEGRATION TESTS PASS` exit 0, gagal → exit 1.
- `package.json`: script `"test:claim": "node scripts/test-claim.js"`. `.env.example`: `TEST_PK=` + `CONTRACT_ADDRESS_TESTNET=0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7`. Tanpa `TEST_PK` → fail-fast `[ENV] TEST_PK wajib diisi…` exit 1.
- **Output nyata (`npm run test:claim`):**
  ```
  [SETUP] rpc=https://rpc.bohr.life
  [SETUP] contract=0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7
  [SETUP] wallet=0xA114fCB61339020d17f6ED5cf711692531746d96
  ✅ Claim registered, tx hash: 0x29393a9429571a09a239f0ab325d165a8203ada8a20acc072a5a9c78a3e69e21, block: 24419556
  ✅ Revert as expected (execution reverted: "Duplicate receipt: already claimed")
  ✅ checkClaim verify: exists=true, claimant=0xA114fCB61339020d17f6ED5cf711692531746d96, timestamp=1790174150, metadataURI=meta://test-1
  ✅ Random hash returns exists=false
  ✅ ALL INTEGRATION TESTS PASS
  ```
- Spec `.md` tidak diubah; `TEST_PK` tidak dicetak ke progress.
