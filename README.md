# BOT Chain — AI Fake Invoice & Double-Spending Claim Detector

Backend hackathon **BOT Chain**: deteksi nota/kuitansi palsu (ELA forensics) + pencegah double-claim on-chain via smart contract `ReceiptRegistry`.

## Stack

- Node.js + Express (plain JS)
- sharp (Error Level Analysis)
- ethers v6 (canonicalHash / testnet integration)
- Supabase Postgres (`pg`, tanpa ORM)

## Quick start

```bash
npm install
cp .env.example .env   # isi DATABASE_URL, dst. Jangan commit .env
npm start              # http://localhost:3000/health
```

## Scripts

| Command | Deskripsi |
|---|---|
| `npm start` | Jalankan server |
| `npm run dev` | Server + watch |
| `npm run test:ela` | Unit test ELA |
| `npm run test:db` | Smoke test DB |
| `npm run test:claim` | Integration test contract testnet (butuh `TEST_PK`) |
| `npm run test:e2e` | E2E test endpoints (spawn server lokal) |

## API (ringkas)

Lihat `docs/spec/schema.md` §3.

- `POST /api/analyze-receipt` — upload + field → ELA + hash + insert
- `GET /api/receipts?wallet=` — riwayat per wallet
- `GET /api/receipts/check-duplicate?hash=` — soft-check duplikat (R9)
- `POST /api/receipts/:id/confirm-onchain` — sinkron status setelah tx (R11)

## Contract (testnet)

- Network: BOT Chain Testnet (Chain ID 968), RPC `https://rpc.bohr.life`
- Address: `0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7`
- Source: `contracts/ReceiptRegistry.sol`
- Deploy/verify guide: `contracts/README.md`

## Struktur

```
docs/spec/       # prd, rules, schema, system, workflow, architecture
docs/internal/   # STATE, progress, CODING_RULES
docs/HASHING.md
src/             # backend (index, routes, services, db, middleware)
scripts/         # test-db, test-claim, e2e-test
contracts/       # ReceiptRegistry.sol + README
tests/fixtures/  # sample images
tests/output/    # e2e output
uploads/         # runtime (gitignored)
```

## Dokumentasi

- Business rules: `docs/spec/rules.md`
- Hashing: `docs/HASHING.md`
- Coding rules: `docs/internal/CODING_RULES.md`
- Status: `docs/internal/STATE.md`
