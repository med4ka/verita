# Deploy `ReceiptRegistry.sol` via Remix — BOT Chain Testnet

Step-by-step deploy manual (sesuai guidebook panitia). **Jangan deploy dari script/CI** — pakai Remix + MetaMask.

## Network testnet

| Param | Value |
|---|---|
| Nama network | BOT Chain Testnet |
| Chain ID | `968` |
| RPC URL | `https://rpc.bohr.life` |
| Explorer | `https://scan.bohr.life/` |
| Currency | BOT (testnet) |

Mainnet (nanti, setelah alokasi BOT dari organizer): Chain ID `677`, RPC `https://rpc.botchain.ai`, Explorer `https://scan.botchain.ai`.

## Prasyarat

1. MetaMask terpasang, punya akun dengan saldo **BOT testnet** (faucet testnet / dari organizer — lihat guidebook panitia).
2. Buka [https://remix.ethereum.org](https://remix.ethereum.org).
3. File contract: `contracts/ReceiptRegistry.sol` dari repo ini (Solidity `^0.8.20`).

## Step 1 — Siapkan network di MetaMask

1. MetaMask → **Add network** → **Add a network manually**:
   - Network name: `BOT Chain Testnet`
   - New RPC URL: `https://rpc.bohr.life`
   - Chain ID: `968`
   - Currency symbol: `BOT`
   - Block explorer: `https://scan.bohr.life/`
2. Pastikan network aktif = **BOT Chain Testnet** (bukan Ethereum Mainnet / lainnya).
3. Pastikan saldo testnet BOT cukup untuk gas.

## Step 2 — Buka Remix & paste kontrak

1. Buka [https://remix.ethereum.org](https://remix.ethereum.org).
2. Di panel **File explorer**: buat file baru `ReceiptRegistry.sol`.
3. Paste seluruh isi `contracts/ReceiptRegistry.sol` dari repo ini.
4. Buka tab **Solidity Compiler**:
   - Compiler: `0.8.x` (minimal **0.8.20**, samakan dengan `pragma`)
   - **Auto compile** boleh dicentang
   - Klik **Compile ReceiptRegistry.sol** — pastikan tanpa error/warning merah.

## Step 3 — Deploy ke testnet

1. Buka tab **Deploy & Run Transactions**.
2. **Environment**: pilih **Injected Provider - MetaMask** (Remix akan connect ke MetaMask; network yang dipakai = network aktif di MetaMask, harus BOT Chain Testnet).
3. **Contract**: pilih `ReceiptRegistry`.
4. Constructor tidak ada argumen → kosongkan.
5. Klik **Deploy** → MetaMask popup muncul → cek lagi network = BOT Chain Testnet → **Confirm** dan tunggu tx sukses.
6. Di tab **Deployed Contracts** akan muncul alamat contract (mis. `0xABC...`).
   - **Catat alamat ini** — ini *testnet contract address* yang dikirim ke organizer (lihat `workflow.md` §4).

## Step 4 — Smoke test di Remix (sebelum share ke frontend)

Di bawah contract yang sudah ter-deploy, expand fungsi:

1. **`registerClaim`**
   - `hash`: `bytes32` — isi hash dummy 32 byte, mis. `0x0000...0001` (64 hex), atau hash asli dari backend/frontend.
   - `metadataURI`: `""` atau URL test.
   - Klik **transact** → MetaMask confirm → tx sukses.
2. **`registerClaim` lagi dengan hash yang sama** → harus **revert** dengan pesan:
   ```
   Duplicate receipt: already claimed
   ```
   (Dan event `DuplicateRejected` ter-emit — cek di tab kedua **Low level calls** / logs tx di explorer.)
3. **`checkClaim(hash)`** → klik **call** → return:
   ```
   exists: true
   claimant: 0x...
   timestamp: ...
   metadataURI: ...
   ```
4. **`isClaimed(hash)`** → `true`.

Ini meniru skenario demo judges (klaim baru sukses → submit sama → revert duplicate).

## Step 5 — Verifikasi source di explorer

Tujuan: source contract bisa dibuka di `scan.bohr.life` (bukti buat panitia & judges).

1. Di Remix tab **Solidity Compiler** → klik **Compilation Details** (atau kanan contract → **Show Compilation Details**) → salirkan **Contract ABI** dan **Creation bytecode** (metadata CBOR ada di akhir bytecode).
2. Buka explorer testnet: `https://scan.bohr.life/address/<ALAMAT_CONTRACT>#code` (menu **Contract**).
3. Klik **Verify and Publish** (atau **Verify Contract**):
   - Contract address
   - Compiler type: **Solidity (Single file)** atau **JSON** — sesuai form explorer
   - Compiler version: **persis** sama dengan yang dipakai di Remix (mis. `v0.8.20+commit.a1b79de6`) — mismatch version = gagal verify
   - Optimization: **Yes/No** — samakan dengan setting Remix (default Remix: OFF / 200 runs kalau dicentang)
   - Constructor arguments: kosong (tidak ada constructor arg)
   - Paste **Source code** (file `.sol` utuh) atau **ABI + Bytecode** tergantung opsi form
4. Submit → tunggu hingga status **Verified**.
5. Buka kembali `https://scan.bohr.life/address/<ALAMAT_CONTRACT>` → tab **Contract** harus menampilkan source + Read/Write functions.

> Jika form explorer hanya menerima **bytecode match**: pastikan optimize setting & compiler version identik dengan Remix saat compile/deploy. Kalau tidak match, deploy ulang dari Remix dengan setting yang sama, lalu verify lagi.

> Catatan explorer BOT Chain kadang berbeda UI dari Etherscan — prinsipnya sama (verify single-file / flatten). Kalau ada opsi **Flatten**, bisa pakai plugin Remix "Flattener" atau tempel file utuh tanpa import lain (contract ini zero-import, jadi single file langsung cocok).

## Step 6 — Setelah verify, simpan untuk submission

- [ ] Testnet contract address → README + kirim ke organizer (`workflow.md` §4)
- [ ] Link verify: `https://scan.bohr.life/address/<ALAMAT>` 
- [ ] ABI → share ke frontend (Export ABI di Remix compiler tab, atau ambil dari explorer)
- [ ] Setelah mainnet dialokasikan: ulangi langkah 1–5 dengan network **BOT Chain Mainnet** (Chain ID `677`, RPC `https://rpc.botchain.ai`), address baru dicatat terpisah (testnet vs mainnet di README).

## Troubleshooting

| Masalah | Solusi |
|---|---|
| MetaMask tidak muncul di Remix Environment | Pilih ulang **Injected Provider - MetaMask**; pastikan MetaMask ter-unlock & site diizinkan |
| Tx revert "insufficient funds" | Switch ke BOT Chain Testnet, isi faucet testnet |
| Deploy sukses tapi verify gagal | Samakan compiler version + optimization + source persis |
| Lupa network, deploy ke chain salah | Cek Chain ID di MetaMask sebelum klik Deploy (`968` testnet / `677` mainnet) |
| Revert `Duplicate receipt: already claimed` saat test pertama | Hash sudah perpakai — pakai hash baru untuk smoke test pertama |
