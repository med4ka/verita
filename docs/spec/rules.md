# Rules — Business Logic, Validasi, & Edge Cases

## 1. Aturan Inti (Core Rules)

**R1 — Satu fingerprint hanya boleh diklaim satu kali, selamanya.**
`canonicalHash = keccak256(receiptNumber + amount + receiptDate + storeName)`. Sekali hash ini terdaftar di contract (`isClaimed[hash] = true`), tidak ada cara untuk override, replace, atau hapus — sesuai sifat immutable smart contract. Ini yang jadi "bukti" utama demo ke judges.

**R2 — Identitas klaim = wallet address, bukan akun/login.**
Tidak ada sistem auth terpisah. Siapa yang menandatangani transaksi `registerClaim`, itu yang tercatat sebagai `claimant`. Sederhana dan sesuai konsep DApp (wallet = identitas).

**R3 — Backend hanya menghasilkan data, tidak pernah submit transaksi atas nama user.**
Private key user tidak pernah dikirim ke backend. Backend cuma balikin `canonicalHash` dan hasil forensics; frontend yang memanggil contract lewat MetaMask user sendiri. Ini prinsip keamanan yang tidak boleh dilanggar meskipun demi kecepatan development.

**R4 — Field nota yang membentuk hash tidak boleh kosong.**
`receiptNumber`, `amount`, `receiptDate`, `storeName` wajib diisi sebelum hash bisa dibuat. Kalau salah satu kosong → backend balikin `400`, jangan generate hash dari data tidak lengkap (nanti gampang collision/salah deteksi).

**R5 — Normalisasi data sebelum hashing.**
Supaya hash konsisten walau user ketik beda kapitalisasi/spasi, backend WAJIB normalisasi dulu sebelum hash:
- `storeName` → lowercase, trim whitespace berlebih.
- `amount` → dikonversi ke integer (misal dalam rupiah tanpa desimal, atau *2 desimal x100* kalau perlu presisi), jangan hash angka float mentah (floating point bisa beda representasi).
- `receiptDate` → format ISO `YYYY-MM-DD` fixed.
- `receiptNumber` → trim, uppercase kalau format nota biasanya alfanumerik campur.

Contoh: `keccak256(normalize(receiptNumber) + normalize(amount) + receiptDate + normalize(storeName))`

## 2. Aturan AI Forensics (ELA Verdict)

**R6 — Threshold verdict (default, bisa dikalibrasi ulang H-1 pakai contoh nyata):**
| Tamper score | Verdict | Artinya |
|---|---|---|
| 0–29 | `clean` | Tidak ada indikasi editing signifikan |
| 30–59 | `suspicious` | Ada anomali, tapi belum pasti editan (bisa juga karena kompresi/scan kualitas rendah) |
| 60–100 | `tampered` | Indikasi kuat rekayasa digital |

**R7 — Verdict forensics TIDAK memblokir submit ke chain.**
`tampered` cuma warning ke user/judges di UI ("nota ini terindikasi diedit, lanjutkan submit?"), bukan hard block. Alasan: false positive ELA cukup umum (foto blur, hasil scan, watermark toko), dan tujuan utama hackathon ini adalah demo *duplicate detection on-chain* yang deterministik — jangan sampai fitur soft-signal (forensics) malah bikin demo gagal karena false positive.

**R8 — Verdict + score disimpan permanen di DB untuk audit**, walau tidak memengaruhi hasil on-chain. Ini yang membedakan produk ini dari sekadar duplicate-checker biasa.

## 3. Aturan On-Chain / Duplicate Handling

**R9 — Pengecekan duplikat sebaiknya dilakukan dua kali: soft-check dan hard-check.**
- *Soft-check* (opsional, UX): `GET /api/receipts/check-duplicate?hash=...` sebelum user sign transaksi, supaya user tidak buang gas kalau memang sudah pasti duplikat.
- *Hard-check* (wajib, source of truth): `registerClaim()` di smart contract — ini yang benar-benar tidak bisa dibohongi, karena backend/DB bisa saja out of sync atau dimanipulasi, tapi on-chain state tidak bisa.

**R10 — Kalau transaksi revert (duplicate), frontend WAJIB menampilkan detail klaim pertama** (`claimant`, `timestamp`) dari `checkClaim(hash)` — ini bagian paling penting buat demo ke judges ("liat, sudah pernah diklaim wallet X jam segini").

**R11 — DB status (`onchain_status`) harus disinkronkan setelah tx selesai** via `POST /api/receipts/:id/confirm-onchain`, supaya riwayat di UI akurat (`pending` → `registered` atau `rejected_duplicate`). Kalau frontend lupa memanggil endpoint ini (misal user tutup tab), status bisa `pending` selamanya — untuk MVP ini acceptable risk, tidak perlu reconciliation job otomatis.

## 4. Validasi Input & Error Handling

**R12 — Validasi file upload:**
- Format: hanya `image/jpeg`, `image/png`.
- Ukuran maksimum: 5MB (`MAX_UPLOAD_SIZE_MB`).
- Tolak file kosong/corrupt sebelum masuk proses ELA.

**R13 — Validasi wallet address:** harus format EVM valid (`0x` + 40 hex char), checksum tidak wajib divalidasi ketat (lowercase semua saat disimpan, cukup).

**R14 — Rate limiting sederhana (opsional kalau sempat):** batasi jumlah upload per wallet per menit, mencegah spam saat demo publik/testing oleh banyak orang sekaligus.

## 5. Edge Cases yang Perlu Diantisipasi

| Kasus | Perilaku yang diharapkan |
|---|---|
| Gambar sama persis diupload ulang tapi field nota beda (typo) | `canonicalHash` beda → dianggap klaim baru (limitasi diketahui, jelaskan di README sebagai "future improvement: OCR cross-check") |
| Field nota sama tapi gambar beda (foto ulang nota yang sama) | `canonicalHash` sama → tetap kena reject on-chain (ini justru sesuai tujuan produk) |
| User ganti network (bukan BOT Chain) saat submit | Frontend harus validasi `chainId` sebelum call contract, tampilkan prompt switch network |
| Contract belum ke-deploy / address salah di frontend config | Tampilkan error jelas, jangan silent fail — penting saat demo |
| ELA gagal proses (misal file bukan foto asli/screenshot PDF) | Backend tetap lanjut dengan `verdict: "suspicious"` default + catatan, jangan crash seluruh request |

## 6. Batasan yang Perlu Dijelaskan Jujur di README (bukan disembunyikan)

- Sistem ini mendeteksi duplikasi berdasarkan **kombinasi field yang diisi manual**, bukan OCR otomatis — jadi masih bergantung kejujuran input awal (nomor nota, nominal, dll). Ini transparan disebut sebagai *v1 limitation*, dan OCR otomatis jadi roadmap v2.
- ELA adalah teknik forensik klasik, bukan model AI yang di-training khusus — cukup kuat untuk deteksi editing kasar (copy-paste, clone stamp) tapi bukan bukti hukum absolut.
