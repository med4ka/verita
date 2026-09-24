# Workflow

## 1. User Flow (End-to-End)

1. User buka website → klik "Connect Wallet" → MetaMask popup → approve.
2. Frontend cek `chainId`; kalau bukan BOT Chain, prompt switch/add network.
3. User upload foto nota + isi form (`receiptNumber`, `amount`, `receiptDate`, `storeName`).
4. Frontend `POST /api/analyze-receipt` → backend jalankan ELA + generate hash → balikin hasil.
5. Frontend tampilkan: skor tamper, verdict (`clean`/`suspicious`/`tampered`), dan hash yang akan didaftarkan.
6. User klik "Register Claim" → frontend panggil `registerClaim(canonicalHash, metadataURI)` via MetaMask → user sign & bayar gas.
7a. **Kalau sukses:** tampilkan tx hash + link ke explorer, `POST /api/receipts/:id/confirm-onchain` dengan status `registered`.
7b. **Kalau revert (duplicate):** frontend panggil `checkClaim(hash)` → tampilkan siapa & kapan nota ini pertama diklaim, `confirm-onchain` dengan status `rejected_duplicate`.
8. User bisa lihat riwayat klaim mereka di halaman "History" (`GET /api/receipts?wallet=...`).

## 2. Demo Script untuk Judges (siapkan sebelum submit, sudah ditest H-1)

Ini bagian paling penting — siapkan 2 skenario yang sudah dites dan pasti jalan:

**Skenario A — Klaim baru (clean):**
1. Connect wallet.
2. Upload nota contoh #1 (asli, belum pernah diklaim).
3. Tunjukkan hasil forensics: `clean`.
4. Submit → sukses → tunjukkan tx di explorer BOT Chain.

**Skenario B — Duplicate rejection (demo moment utama):**
1. Upload nota **yang sama persis field-nya** dengan skenario A (bisa pakai wallet lain untuk menunjukkan bahwa siapapun tidak bisa klaim ulang, tidak cuma wallet yang sama).
2. Submit → transaksi **revert** on-chain.
3. Tunjukkan detail klaim pertama (wallet + timestamp) yang muncul di UI.

Skenario B ini yang paling menjual originality & "anyone can connect wallet and the main action works" (30 pts terbesar di judging criteria).

## 3. Rencana Kerja (Timeline — mulai 22 Sept, submit 25 Sept 23:59 WIB)

> Sesuaikan jam sisa hari ini dengan kondisi lo, tapi urutan prioritas ini penting: **contract & backend jalan dulu sebelum polish UI.**

### Hari ini (22 Sept) — Sisa waktu hari ini
- [ ] Finalisasi `ReceiptRegistry.sol`, compile & deploy ke **testnet** via Remix.
- [ ] Verifikasi contract di `scan.bohr.life`.
- [ ] Setup skeleton backend (endpoint kosong dulu, biar temen lo bisa mulai integrasi frontend paralel).
- [ ] Share ke temen lo: contract address testnet + ABI + `schema.md` (API contract) — supaya dia bisa mulai coding UI tanpa nunggu backend selesai 100%.

### 23 Sept
- [ ] Implementasi modul ELA + endpoint `/api/analyze-receipt` fully functional.
- [ ] Implementasi endpoint `/api/receipts` (list & confirm-onchain).
- [ ] Testing integrasi backend ↔ contract testnet (manual, pakai Remix/script kecil untuk simulasi klaim & duplicate).
- [ ] Deploy backend ke Render/Railway (jangan localhost).
- [ ] Frontend: connect wallet + upload flow + call contract testnet — target end of day: skenario A & B jalan di **testnet**.

### 24 Sept (building ends)
- [ ] Deploy contract dulu ke **testnet** (kalau belum) via Remix, sampai muncul contract address & tx sukses di `scan.bohr.life` — ini alamat yang akan lo kirim ke organizer.
- [ ] **Kirim pengajuan alokasi BOT mainnet ke organizer** (lihat detail format di Section 5 di bawah) — pagi-pagi, jangan mepet ke deadline karena nunggu approval.
- [ ] Setelah organizer transfer BOT: **ganti network MetaMask ke BOT Chain Mainnet**, cek saldo BOT muncul di wallet (bukan di network testnet).
- [ ] Deploy contract ke **mainnet** pakai Remix (Environment tetap "Injected Provider - MetaMask", tapi network di wallet sudah mainnet).
- [ ] Update frontend & README dengan contract address mainnet.
- [ ] Setup custom domain + arahkan ke GitHub Pages.
- [ ] Tambahkan BOT Chain branding di footer web.
- [ ] Full run-through skenario A & B di **mainnet** — ini yang akan didemo ke judges.
- [ ] Mulai tulis README.md (section Deployment wajib ada testnet + mainnet address).

### 25 Sept (submission day)
- [ ] Pagi: freeze fitur, fokus bug fix & stabilitas — jangan nambah fitur baru hari ini.
- [ ] Buat X post project (kalau akun X dedicated & 5 post 30 hari belum terpenuhi, ini butuh perhatian ekstra karena syaratnya historis, bukan bisa dadakan — cek status ini SEKARANG juga, bukan nanti).
- [ ] Publish mainnet launch write-up.
- [ ] Final check semua 7 item submission requirement (lihat checklist di `prd.md` section 8).
- [ ] Submit sebelum 23:59 WIB — jangan mepet ke menit terakhir, upload/form bisa lambat.

## 4. Pengajuan Alokasi BOT Mainnet ke Organizer

Sebelum bisa deploy ke mainnet, lo butuh real BOT untuk gas fee, dan itu didapat dari organizer (bukan faucet — faucet cuma buat testnet). Berdasarkan info dari panitia, yang perlu dikirim ke organizer:

1. **Nama project** — pastikan konsisten sama nama yang dipakai di README, website, dan akun X (lihat poin 3).
2. **Deskripsi singkat** — 1-2 kalimat, cukup inti idenya (AI image forensics + on-chain duplicate detection buat nota/kuitansi).
3. **Testnet contract address** — hasil deploy dari Remix yang sudah diverifikasi bisa dicek di `scan.bohr.life`. Ini bukti bahwa contract lo sudah jalan sebelum minta jatah mainnet.
4. **Akun X project** — dibuat khusus untuk project ini, **nama akunnya usahakan menyesuaikan/mirip nama project** biar gampang dikenali organizer & judges pas verifikasi (bukan akun pribadi lo).

Setelah dikirim dan organizer transfer BOT ke wallet lo:
- Buka MetaMask → pastikan network yang aktif **BOT Chain Mainnet** (bukan testnet) → saldo BOT yang baru masuk akan terlihat di situ.
- Kalau saldo tidak muncul padahal organizer bilang sudah transfer, cek dulu network-nya benar mainnet, baru curiga hal lain.

> Praktis: siapkan draft 4 poin di atas dari sekarang (sebelum 24 Sept pagi), supaya begitu waktunya kirim, tinggal kirim — tidak perlu mikir dadakan pas lagi ngejar deadline.

## 5. Koordinasi Kerja Paralel dengan Temen (Frontend)

Supaya kalian tidak saling nunggu:
- Lo kirim ke dia: contract ABI + address (testnet dulu), dan bentuk request/response API dari `schema.md`, di awal — sebelum backend selesai 100%.
- Dia bisa mulai coding UI pakai **mock response** yang sesuai schema, baru nanti tinggal ganti ke backend asli lo.
- Sepakati dari awal: siapa yang pegang wallet demo untuk testing bareng, dan kapan waktu untuk integrasi test bareng (jangan H-1 baru nyambungin semua).
