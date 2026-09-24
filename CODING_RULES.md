# CODING RULES — Aturan Coding Backend

> Catatan penamaan: file ini `CODING_RULES.md` (bukan `RULES.md`) karena filesystem Windows case-insensitive — `RULES.md` akan menimpa spec bisnis `rules.md`. Isi di bawah adalah aturan coding; aturan bisnis tetap di `rules.md`.

Aturan coding untuk backend project ini. Berlaku untuk semua file di `src/`.

## Stack (wajib)

- **Runtime:** Node.js (plain JavaScript, **bukan TypeScript** — tanpa `.ts`, tanpa `tsconfig.json`)
- **HTTP framework:** Express
- **Blockchain:** `ethers` **v6** (`ethers.keccak256`, `ethers.isAddress`, bukan API v5 `ethers.utils.*`)
- **Image processing:** `sharp` — untuk ELA (Error Level Analysis) dan normalisasi gambar
- **Database:** `better-sqlite3` — SQLite lokal, **tanpa ORM** (tulis SQL manual via prepared statement)
- **Config:** `dotenv` — semua konfigurasi dari env, hardcode hanya default wajar di code

## Larangan

1. **Tanpa TypeScript** — file source hanya `.js`.
2. **Tanpa ORM** (Sequelize, Prisma, Drizzle, dsb.) — query SQL ditulis langsung.
3. **Tanpa library web framework lain** selain Express (jangan campur Fastify/Koa).
4. **Backend tidak pernah memegang private key** dan tidak pernah submit transaksi on-chain (lihat `rules.md` R3). Backend hanya menghasilkan data (hash, skor forensics) dan membaca state chain bila perlu.
5. **Jangan ubah file spec** (`prd.md`, `workflow.md`, `architecture.md`, `rules.md`, `schema.md`, `system.md`).

## Struktur folder

```
src/
  index.js          # entrypoint Express
  routes/           # route definitions (satuan file per area)
  services/
    ela.js          # logic ELA via sharp (murni function, bisa ditest independen)
    hash.js         # normalisasi field + canonicalHash (keccak256) + imageHash (sha256)
  db/
    index.js        # koneksi & helper better-sqlite3 (init tabel, prepared statement)
  middleware/        # express middleware (error handler, upload, validasi, dll)
uploads/            # file upload sementara — di-gitignore
```

## Konvensi kode

- CommonJS (`require`/`module.exports`) konsisten di seluruh project (package.json tanpa `"type": "module"`).
- Semua env dibaca di satu tempat ( awal `src/index.js` ), jangan `process.env.X` acak di banyak file tanpa default.
- Env yang dipakai (lihat `.env.example` / `system.md` §6): `PORT`, `DATABASE_URL`, `MAX_UPLOAD_SIZE_MB`, `ELA_QUALITY`, `TAMPER_THRESHOLD_SUSPICIOUS`, `TAMPER_THRESHOLD_TAMPERED`, `CORS_ORIGIN`.
- Response error API konsisten: `{ "error": "message" }` dengan kode HTTP yang sesuai (400/413/500, dsb. — lihat `schema.md`).
- Validasi input mengikuti `rules.md` §4 (R4, R12, R13): field hash wajib non-kosong, upload hanya `image/jpeg`/`image/png` max `MAX_UPLOAD_SIZE_MB`, wallet address format EVM `0x`+40 hex (disimpan lowercase).
- Normalisasi sebelum hashing wajib (R5): `storeName` lowercase+trim, `amount` integer, `receiptDate` ISO `YYYY-MM-DD`, `receiptNumber` trim+uppercase.
- Verdict forensics (R6): `0–29 clean`, `30–59 suspicious`, `60–100 tampered` — threshold dari env, jangan hardcode di banyak tempat.
- Verdict forensics **tidak** memblokir submit on-chain (R7).
- ELA gagal → request tidak crash: fallback `verdict: "suspicious"` + catatan (edge case `rules.md` §5).
- Hash dan tx hash selalu string `0x...`; timestamp simpan UTC.

## Database (better-sqlite3)

- Satu instance koneksi di `src/db/index.js`, export helper (`db`, `prepare`, fungsi domain mis. `insertReceipt`, `getReceiptsByWallet`).
- Buat tabel saat init (schema mengikuti `schema.md` §1: `receipts` + index `canonical_hash`, `wallet_address`).
- Selalu pakai prepared statement — jangan string-concat query dari user input.
- DB **bukan** source of truth status klaim on-chain; `onchain_status` hanya disinkronkan via `POST /api/receipts/:id/confirm-onchain` (R11).

## ELA (sharp)

- Logic di `src/services/ela.js`, export fungsi murni: `(buffer) => { tamperScore, verdict, note? }` — tanpa I/O Express di dalamnya.
- Pakai `sharp` untuk re-compress JPEG (kualitas = `ELA_QUALITY`) lalu hitung diff piksel → skor 0–100 → verdict via threshold env.
- Tidak ada training model ML.

## Hash (`src/services/hash.js`)

- `canonicalHash = keccak256(normalize(receiptNumber) + normalize(amount) + receiptDate + normalize(storeName))` pakai **ethers v6** (`ethers.keccak256(ethers.toUtf8Bytes(...))` atau `ethers.solidityPackedKeccak256` — pilih satu, pastikan konsisten dengan sisi frontend/contract).
- `imageHash = sha256` dari bytes file gambar.
- Export fungsi terpisah: `normalizeReceipt(...)`, `computeCanonicalHash(...)`, `computeImageHash(buffer)`.

## Git

- `uploads/` masuk `.gitignore` (file user tidak boleh ke-commit).
- Jangan commit `.env` (hanya `.env.example`).
