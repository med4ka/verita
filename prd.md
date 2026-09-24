# PRD — AI Fake Invoice & Double-Spending Claim Detector
**Build Week Hackathon Vol.2 — BOT Chain**

Status: Draft v1 · Deadline submit: **Kamis, 25 Sept 2026, 23:59 WIB** · Building ends: Rabu, 24 Sept 2026

---

## 1. Latar Belakang & Masalah

UMKM, organisasi kampus, atau perusahaan kecil sering dirugikan oleh oknum karyawan/mitra yang:
1. Menyerahkan **faktur/kuitansi yang sudah diedit** (nominal diubah, tanggal diubah, dsb).
2. Menggunakan **satu nota yang sama untuk klaim reimbursement berkali-kali** ke pihak berbeda (double-claiming), karena tidak ada sistem terpusat yang mencatat nota mana yang sudah pernah diklaim.

Masalah ini sulit dicegah secara manual karena masing-masing pihak (divisi keuangan, klien, event) tidak saling terhubung datanya.

## 2. Solusi

Aplikasi yang menggabungkan:
1. **AI Image Forensics** — memindai piksel gambar nota untuk mendeteksi indikasi rekayasa digital (editing/tampering).
2. **On-Chain Hash Registry** — membuat fingerprint unik dari data nota (nomor nota, nominal, tanggal, nama toko) dan mencatat klaim pertama di smart contract BOT Chain. Klaim kedua dengan fingerprint yang sama otomatis ditolak on-chain — tidak bisa dipalsukan atau dihapus.

## 3. Target Pengguna

- Staff/karyawan yang mengajukan reimbursement.
- Finance/admin UMKM atau organisasi kampus yang perlu memverifikasi nota sebelum approve.
- (Demo persona) Judges — akan connect wallet & submit 1 nota untuk uji coba.

## 4. Tujuan & Metrik Sukses

| Tujuan | Metrik |
|---|---|
| 1 fitur inti jalan end-to-end | Upload nota → hasil forensics → submit hash ke chain → cek duplikat, semua bisa didemo tanpa error |
| Judges bisa connect wallet & interaksi | Wallet connect + tx sukses di testnet/mainnet |
| Originality jelas | Kombinasi AI forensics + on-chain dedup adalah pembeda utama |

## 5. Ruang Lingkup (MVP — prioritas karena waktu mepet)

### In Scope (wajib jalan sebelum submit)
- Upload gambar nota/kuitansi (JPG/PNG) dari frontend.
- Backend menjalankan **Error Level Analysis (ELA)** untuk skor kecurigaan tampering (0–100) → status `clean` / `suspicious` / `tampered`.
- User mengisi/mengonfirmasi field nota (nomor nota, nominal, tanggal, nama toko) secara manual di form (OCR otomatis = nice-to-have, bukan wajib).
- Backend menghasilkan `canonicalHash = keccak256(nomor + nominal + tanggal + toko)`.
- Frontend memanggil smart contract via MetaMask: `registerClaim(hash)`.
  - Jika hash belum pernah diklaim → transaksi sukses, tercatat on-chain.
  - Jika hash sudah pernah diklaim → transaksi **revert** ("Duplicate receipt: already claimed").
- Riwayat klaim per wallet ditampilkan (dari DB, opsional cross-check on-chain).
- Deploy: smart contract di testnet **dan** mainnet BOT Chain, frontend live di domain sendiri + GitHub Pages, backend live (Render/Railway free tier).

### Out of Scope (v2 / jangan dikerjain dulu)
- OCR otomatis ekstrak field dari gambar (kalau sempat, tambahin belakangan — bukan blocker demo).
- Multi-user role (admin approve/reject).
- Notifikasi email/telegram.
- Model AI forensics custom (cukup ELA + threshold, bukan training model sendiri).

## 6. User Story Utama

1. *Sebagai user*, saya upload nota → sistem kasih tau apakah nota ini terindikasi diedit, sebelum saya klaim.
2. *Sebagai user*, saya submit nota untuk diklaim → jika nota ini sudah pernah diklaim sebelumnya (oleh siapapun), sistem menolak secara otomatis dan saya lihat bukti klaim pertama (wallet & waktu).
3. *Sebagai judge/demo viewer*, saya connect wallet, upload nota contoh, lihat hasil forensics, submit ke chain, lalu coba submit nota yang **sama** lagi → melihat penolakan on-chain secara langsung (ini demo moment paling penting).

## 7. Alur Utama (Happy Path)

Lihat detail di `workflow.md`. Ringkas:
Upload nota → AI forensics (ELA) → isi field nota → generate hash → connect wallet → sign tx `registerClaim(hash)` → sukses (atau revert jika duplikat) → tampil di riwayat.

## 8. Checklist Requirement Panitia (wajib semua terpenuhi, submission form)

- [ ] Contract address (testnet + mainnet) tercatat di README
- [ ] Live website link (custom domain $1–1.5, di-reimburse)
- [ ] GitHub repo: berisi `.sol`, README.md dengan section "Deployment"
- [ ] X post dedicated account (nama akun menyesuaikan nama project), tag @BOTChain_ai, minimal 5 post dalam 30 hari sebelum submit
- [ ] Kirim ke organizer: nama project, deskripsi singkat, testnet contract address, akun X — untuk dapat alokasi BOT mainnet (detail di `workflow.md` section 4)
- [ ] Mainnet launch announcement (write-up)
- [ ] BOT Chain branding di footer web (logo/nama + link ke botchain.ai & explorer)
- [ ] Submit sebelum 25 Sept 23:59 WIB — no late submission

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Waktu mepet (2–3 hari) | Scope MVP ketat, ELA dulu bukan model AI custom |
| Real BOT mainnet belum ada | Hubungi organizer H-1 untuk alokasi BOT, jangan mepet ke deadline |
| Frontend-backend integrasi telat | Definisikan API contract di `schema.md` dari awal, kerja paralel |
| Demo gagal live | Siapkan 1 nota "clean" dan 1 nota "duplicate" contoh yang sudah ditest H-1 sebelum submit |
