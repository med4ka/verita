# Architecture

## 1. Diagram Tingkat Tinggi

```mermaid
flowchart TD
    U[User / Judge] -->|1. Buka website, connect MetaMask| FE[Frontend<br/>HTML/JS + ethers.js<br/>GitHub Pages + custom domain]
    FE -->|2. Upload gambar nota + field manual| BE[Backend API<br/>Node/Express atau Python/FastAPI<br/>Render/Railway]
    BE -->|3. Jalankan ELA| ELA[Image Forensics Module<br/>Error Level Analysis]
    ELA -->|tamper score + verdict| BE
    BE -->|4. Hitung canonicalHash + imageHash| BE
    BE -->|5. Simpan record| DB[(Database<br/>Postgres/Supabase)]
    BE -->|6. Balikin hash + hasil forensics| FE
    FE -->|7. User sign tx registerClaim hash| SC[Smart Contract<br/>ReceiptRegistry.sol<br/>BOT Chain]
    SC -->|8. Sukses / Revert duplicate| FE
    FE -->|9. Konfirmasi status ke backend| BE
    SC -->|Explorer verifikasi| EX[BOT Chain Explorer<br/>scan.botchain.ai]
```

## 2. Tanggung Jawab per Komponen

### Frontend (temen lo)
- UI upload nota + form field manual.
- Connect wallet (MetaMask) via ethers.js, validasi `chainId` = BOT Chain.
- Panggil backend API untuk analisis (`/api/analyze-receipt`).
- Tampilkan hasil forensics (score, verdict) ke user sebelum submit.
- Panggil contract `registerClaim(hash, metadataURI)` langsung dari wallet user.
- Tangani revert error dari contract, tampilkan detail klaim pertama (`checkClaim`).
- Tampilkan riwayat klaim (dari `/api/receipts?wallet=...`).
- Pasang branding BOT Chain di footer (logo/nama + link botchain.ai & explorer) — **wajib untuk poin submission**.

### Backend (Ghif)
- Endpoint upload + validasi file.
- Modul ELA (image forensics) — murni logic, tidak butuh training model.
- Normalisasi data & hashing (`canonicalHash`, `imageHash`) sesuai `rules.md`.
- Simpan & baca record dari database.
- Tidak pernah menyentuh private key / submit transaksi.

### Smart Contract
- Source of truth untuk status "sudah diklaim atau belum".
- Deploy manual via Remix ke testnet dulu, lalu mainnet (ikuti Day 1 Guide panitia).
- Immutable setelah deploy — jangan terburu-buru deploy ke mainnet sebelum logic testnet fix.

### Database
- Bukan source of truth untuk status klaim (itu tugas contract), tapi menyimpan:
  - Riwayat & audit trail (termasuk hasil forensics yang tidak masuk on-chain).
  - Metadata yang terlalu mahal/tidak perlu disimpan on-chain (gambar, field detail nota).

## 3. Prinsip Desain

1. **Contract sebagai satu-satunya source of truth untuk duplikasi.** DB boleh out of sync, tapi contract tidak pernah bohong.
2. **User selalu menandatangani transaksinya sendiri.** Ini yang bikin demo ke judges valid — mereka connect wallet MEREKA, bukan wallet backend.
3. **Backend stateless terhadap blockchain** — backend cuma *read* dari chain (kalau perlu, via `checkClaim` view function), tidak pernah *write*.
4. **Semua modul dipisah supaya bisa dites independen:** forensics module bisa ditest tanpa contract, contract bisa ditest di Remix tanpa backend nyala, frontend bisa dites dengan hash dummy tanpa nunggu backend selesai — penting biar kerja paralel sama temen lo tidak saling blocking.

## 4. Deployment Topology

```
[GitHub Pages + custom domain] ---- static frontend
            |
            | HTTPS (fetch API)
            v
[Render/Railway backend] ---- Express/FastAPI + ELA module
            |
            | Postgres connection
            v
[Supabase/Render Postgres]

[MetaMask wallet] --(direct RPC, tanpa lewat backend)--> [BOT Chain RPC] --> [ReceiptRegistry.sol]
```
