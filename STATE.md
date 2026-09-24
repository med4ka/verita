# STATE

Terakhir update: 2026-09-23

## Done
- Contract ReceiptRegistry deployed testnet: `0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7` (BOT Chain Testnet 968, rpc.bohr.life; deploy tx `0x405a1396f275bb44dc764e18e3a95644184686069f71f6eb26e122ae00d22931`, deployer `0xA114fCB61339020d17f6ED5cf711692531746d96`)
- Backend endpoints OK (analyze-receipt, receipts, check-duplicate, confirm-onchain) — e2e PASS
- ELA module OK (`npm run test:ela` PASS), hash module OK (normalize + canonicalHash ethers v6 + imageHash), DB Supabase OK (`npm run test:db` PASS, table SERIAL)
- Middleware OK (upload multer, wallet validation, errorHandler, notFound)
- Integration test backend ↔ contract PASS (`npm run test:claim`: register + revert + checkClaim + random hash) — tx register `0x29393a9429571a09a239f0ab325d165a8203ada8a20acc072a5a9c78a3e69e21` block 24419556; wallet `0xA114fCB61339020d17f6ED5cf711692531746d96`

## In Progress
- (kosong)

## Next
- Push ke GitHub
- Deploy backend ke Render
- Handoff ke frontend (contract address + ABI + base URL)
- Deploy contract mainnet (setelah BOT alokasi dari organizer)
- Akun X project
- Demo prep

## Known Issues
- `better-sqlite3` tidak dipakai (diganti pg/Supabase)

### Catatan (tetap berlaku)
- Spec (`prd.md`, `workflow.md`, `architecture.md`, `rules.md`, `schema.md`, `system.md`) tidak diubah.
- Isi `.env` / `TEST_PK` tidak pernah dicetak ke log/output; `.env` di `.gitignore`.
- Backend tidak memegang private key / tidak submit tx on-chain di runtime (R3); `test:claim` = script manual terpisah.
- ELA verdict = soft signal saja (R7). Source of truth duplikat = smart contract (R9). On-chain detail klaim pertama dari `checkClaim` (R10). DB `onchain_status` sinkron via confirm-onchain (R11).
- MVP: file upload dihapus setelah process (`image_url` NULL).
