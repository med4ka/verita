# System Design — Tech Stack & Infrastructure

## 1. Overview Komponen

| Komponen | Owner | Stack yang disarankan |
|---|---|---|
| Smart Contract | Ghif (backend) | Solidity ^0.8.20, Remix IDE, BOT Chain (EVM) |
| Backend API | Ghif | Node.js + Express (atau Python + FastAPI, pilih yang paling lo kuasai — jangan belajar stack baru sekarang) |
| AI Forensics | Ghif | Error Level Analysis (ELA) — library `sharp`/`jimp` (Node) atau `Pillow` (Python), tanpa perlu model ML custom |
| Database | Ghif | SQLite/PostgreSQL (Supabase free tier oke, dapat REST + hosting gratis sekaligus) |
| Frontend | Temen lo | HTML/JS + ethers.js untuk koneksi MetaMask, hosted GitHub Pages + custom domain |
| Web3 layer (write tx) | Frontend | ethers.js `registerClaim(hash)` — **ditandatangani wallet user, bukan backend**, supaya judges bisa "connect wallet & interact" sesuai requirement |

**Prinsip penting:** backend TIDAK memegang private key untuk submit transaksi user. Backend cuma menghasilkan data (hash, skor forensics); yang submit ke chain adalah wallet user sendiri via frontend. Ini juga bikin sistem lebih trustless dan sesuai spirit "on-chain, immutable".

## 2. Smart Contract

- File: `ReceiptRegistry.sol`
- Network testnet: BOT Chain Testnet, Chain ID `968`, RPC `https://rpc.bohr.life`, Explorer `https://scan.bohr.life/`
- Network mainnet: BOT Chain Mainnet, Chain ID `677`, RPC `https://rpc.botchain.ai`, Explorer `https://scan.botchain.ai`
- Fungsi utama: `registerClaim(bytes32 hash, string metadataURI)`, `checkClaim(bytes32 hash)` — detail di `schema.md` & `rules.md`.
- Deploy manual via Remix (sesuai guidebook panitia), bukan via script — lebih cepat untuk timeline ini.

## 3. Backend API (Ghif punya)

Base responsibilities:
1. Terima upload gambar nota.
2. Jalankan ELA → hasilkan tamper score + verdict.
3. Terima field nota manual dari form (nomor, nominal, tanggal, nama toko).
4. Hitung `canonicalHash` (keccak256) dan `imageHash` (sha256 file gambar, untuk deteksi file identik).
5. Simpan record ke DB (untuk riwayat & audit, terlepas dari status on-chain).
6. Endpoint riwayat per wallet.
7. (Opsional) Endpoint untuk update status on-chain (tx hash) setelah frontend berhasil submit ke contract, supaya DB dan chain nyambung.

Endpoint list lengkap → `schema.md` section API.

## 4. AI Image Forensics — pendekatan praktis

Karena waktu terbatas, **jangan bikin/training model ML sendiri**. Pakai:

- **Error Level Analysis (ELA):** re-compress gambar ke JPEG kualitas tertentu (mis. 90%), lalu hitung selisih level error antar area gambar. Area yang baru diedit/ditempel biasanya punya level error berbeda signifikan dari sekitarnya → indikasi manipulasi.
- Threshold sederhana: hitung skor rata-rata perbedaan piksel di area mencurigakan → map ke 0–100 → verdict (`clean` <30, `suspicious` 30–60, `tampered` >60). Threshold final tinggal dikalibrasi pakai beberapa contoh nota asli vs edit.
- (Opsional kalau sempat) Cross-check pakai vision LLM (mis. describe gambar dan tanya "apakah ada tanda editing/inkonsistensi font/alignment") sebagai second opinion — bukan requirement wajib.

## 5. Hosting & Deployment

- **Frontend:** GitHub Pages, custom domain $1–1.5 (Namecheap/Porkbun dsb, simpan struk buat reimburse), arahkan DNS ke GitHub Pages.
- **Backend:** Render.com / Railway.app free tier (harus tetap live pas dinilai judges — jangan pakai localhost/ngrok yang bisa mati).
- **Database:** Supabase (Postgres gratis) atau Render Postgres free tier — hindari SQLite kalau backend di-deploy ke platform ephemeral filesystem (data bisa hilang tiap redeploy).

## 6. Environment Variables (backend)

```
PORT=3000
DATABASE_URL=...
MAX_UPLOAD_SIZE_MB=5
ELA_QUALITY=90
TAMPER_THRESHOLD_SUSPICIOUS=30
TAMPER_THRESHOLD_TAMPERED=60
CORS_ORIGIN=https://domain-lo.com
```

## 7. Koordinasi dengan Frontend (temen lo)

Kasih dia dari awal:
- Base URL backend (setelah deploy).
- Contract address + ABI (setelah deploy testnet).
- Format request/response API (`schema.md`).
- Contoh hash format yang dikirim ke contract (`bytes32`, hasil `keccak256`, jadi frontend/backend harus pakai library yang sama supaya hash konsisten — pakai `ethers.utils.keccak256` / `solidityKeccak256` di kedua sisi kalau perlu recompute).
