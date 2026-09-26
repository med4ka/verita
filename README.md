# Verita

AI forensics + on-chain duplicate detection for receipts.

## Overview

Fake invoices and double-claiming are still common problems for small businesses, campus organizations, and anyone who submits receipts for reimbursement or proof of payment. A receipt can be edited in an image editor, and the same receipt can be submitted to multiple parties — traditional paper checks cannot catch either case at scale.

**Verita** combines two layers of defense. First, it runs **Error Level Analysis (ELA)** on the uploaded receipt image to score how likely the file has been edited. Second, it stores a deterministic **canonicalHash** of the receipt fields on-chain via the `ReceiptRegistry` smart contract: one hash can only be claimed once, forever, and any duplicate transaction reverts on-chain.

Target users are **UMKM (small businesses)** and **campus organizations** that process many receipts and need a fast, transparent way to verify authenticity without specialized forensic software.

## How It Works

1. Upload receipt photo → AI scan with **ELA** (tamper score + verdict)
2. Fill fields manually: receipt number, amount, date, store name
3. Backend normalizes fields and generates **canonicalHash** (`solidityPackedKeccak256`)
4. User signs `registerClaim(hash, metadataURI)` in **MetaMask**
5. If the hash is a duplicate → transaction reverts; system shows the **first claim** details (claimant, timestamp) from `checkClaim`

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity `^0.8.20`, deployed on BOT Chain |
| Backend | Node.js + Express |
| AI Forensics | Error Level Analysis (sharp) |
| Database | Supabase Postgres |
| Frontend | *(TBA)* |
| Wallet | MetaMask via ethers.js |

## Repository Structure

| Folder | Description |
|---|---|
| `src/` | Backend source — Express entry, routes, services (ELA, hash), DB layer, middleware |
| `scripts/` | Manual test scripts — `test-db`, `test-claim`, `e2e-test` |
| `contracts/` | `ReceiptRegistry.sol` + deploy guide |
| `docs/` | Specs (`docs/spec/`), internal notes (`docs/internal/`), hashing doc |
| `tests/` | Fixtures (sample images) + e2e output |
| `uploads/` | Runtime upload dir (gitignored) |

## Deployment

### Smart Contract

**Testnet: BOT Chain Testnet (Bohr)**

- **Address:** `0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7`
- **Chain ID:** `968`
- **RPC:** `https://rpc.bohr.life`
- **Explorer:** [scan.bohr.life/address/0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7](https://scan.bohr.life/address/0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7)
- **Deploy tx:** `0x405a1396f275bb44dc764e18e3a95644184686069f71f6eb26e122ae00d22931`

**Mainnet:** BOT Chain Mainnet — **TBA** (pending mainnet BOT allocation from organizer).

### Backend
- Live URL: https://verita.pxxlspace.cv
- Health check: https://verita.pxxlspace.cv/health
- Platform: Pxxl App (free tier)

### Frontend

- **Live URL:** (TBA)

## API Reference

Full request/response schema: [`docs/spec/schema.md`](docs/spec/schema.md).

- `POST /api/analyze-receipt` — upload + fields → ELA + hash + insert
- `GET /api/receipts?wallet=` — receipt history per wallet
- `GET /api/receipts/check-duplicate?hash=` — soft-check duplicate (R9)
- `POST /api/receipts/:id/confirm-onchain` — sync status after tx (R11)

## Hashing

Specification: [`docs/HASHING.md`](docs/HASHING.md).

> **Important:** field order and types passed to `solidityPackedKeccak256` **must be identical** on backend and frontend:
> `(string receiptNumber, uint256 amount, string receiptDate, string storeName)`.

## Business Rules

Full rules: [`docs/spec/rules.md`](docs/spec/rules.md).

## Testing

```bash
npm run test:ela     # unit test ELA
npm run test:db      # DB smoke test
npm run test:claim   # integration test contract testnet
npm run test:e2e     # e2e test endpoints (spawn local server)
```

> **Note:** `npm run test:claim` requires `TEST_PK` in `.env`. **Do not commit `.env`.**

## Limitations (v1)

- OCR not automatic — fields are filled manually (see [`docs/spec/rules.md`](docs/spec/rules.md) section 6)
- ELA is a classic forensic technique, not a custom ML model
- Duplicate check is based on the combination of manual fields, not the image hash

## Roadmap v2

- Store Registry (owner registers store → Store ID; employees register with ID)
- Multi-role dashboard (owner panel + employee management)
- Automatic OCR (extract fields from image)
- Custom ML model for forensics
- Public explorer (read events from chain)

## Team

- [Nama lo] — Backend + Smart Contract
- Windy — Frontend

## Built on BOT Chain

Built on [BOT Chain](https://botchain.ai) — explorer: [scan.botchain.ai](https://scan.botchain.ai).
