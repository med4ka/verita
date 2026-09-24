# HASHING — Spesifikasi `canonicalHash` & `imageHash`

Kontrak hashing untuk backend (`src/services/hash.js`) dan frontend (ethers.js). Kedua sisi **wajib** menghasilkan hash yang sama → `registerClaim(bytes32)` di `ReceiptRegistry.sol` tidak akan miss.

## 1. Urutan field & tipe (solidity packed)

```
keccak256( solidityPacked(
  ['string', 'uint256', 'string', 'string'],
  [receiptNumber, amount, receiptDate, storeName]
))
```

| # | Field | Tipe Solidity | Notes |
|---|---|---|---|
| 1 | `receiptNumber` | `string` | setelah normalisasi (trim + uppercase) |
| 2 | `amount` | `uint256` | **integer** (bukan float) — lihat normalisasi |
| 3 | `receiptDate` | `string` | fixed `YYYY-MM-DD` |
| 4 | `storeName` | `string` | setelah normalisasi (lowercase + collapse spasi) |

Packing = ABI-encode packed (tanpa padding 32-byte antar field), sama dengan `ethers.solidityPackedKeccak256` / Solidity `keccak256(abi.encodePacked(...))`.

## 2. Aturan normalisasi (rules.md R5)

Sebelum hash, semua field **wajib** dinormalisasi (R4: field kosong → error, backend balikin `400`):

| Field | Aturan | Contoh input → output |
|---|---|---|
| `receiptNumber` | `String().trim().toUpperCase()` | `" INV-001 "` → `"INV-001"` |
| `amount` | Lihat di bawah → **integer** | `"150000.00"` → `15000000` |
| `receiptDate` | Regex `^\d{4}-\d{2}-\d{2}$` + date valid (`new Date` tidak invalid). Return **string apa adanya** | `"2026-09-22"` → `"2026-09-22"` |
| `storeName` | `String().toLowerCase().trim().replace(/\s+/g, ' ')` | `"  Toko  ABC "` → `"toko abc"` |

### `amount` → integer

1. Input **string dengan desimal** (ada `.`), contoh `"150000.50"` → **kalikan 100 dulu**, lalu `Math.round()` → `15000050`.
   - `"150000.00"` → `150000.00 × 100` = `15000000`
   - `"99.99"` → `9999`
2. Input **tanpa desimal**: buang semua non-digit, jadikan Number → `"150,000"` → `150000`, `"150000"` → `150000`.
3. Input `number` bilangan bulat → dipakai apa adanya; number desimal → `×100` lalu `Math.round()`.
4. Hasil `NaN` / kosong / tidak terbaca → **throw `Error('amount invalid')`** — jangan hash float mentah (R5).

> Alasan ×100: presisi 2 desimal tanpa floating point (lihat R5: "2 desimal ×100").

## 3. Contoh konkret (hasil dijalankan di Node)

**Input:**
```js
{
  receiptNumber: " INV-001 ",
  amount: "150000.00",
  receiptDate: "2026-09-22",
  storeName: "  Toko  ABC "
}
```

**Normalized:**
```json
{
  "receiptNumber": "INV-001",
  "amount": 15000000,
  "receiptDate": "2026-09-22",
  "storeName": "toko abc"
}
```

**canonicalHash (ethers v6 `solidityPackedKeccak256`):**
```
0xbc23949c0fb885127fded6c0dc09ae7bffe4e6680b998f65508e9ca253a435f0
```

**imageHash** (`sha256` file bytes + prefix `0x`, 66 char) — contoh buffer `Buffer.from('hello')`:
```
0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```

Re-run lokal:
```bash
node -e "const {normalizeReceiptFields,canonicalHash}=require('./src/services/hash'); const i={receiptNumber:' INV-001 ',amount:'150000.00',receiptDate:'2026-09-22',storeName:'  Toko  ABC '}; console.log(normalizeReceiptFields(i)); console.log(canonicalHash(i));"
```

## 4. Snippet ethers.js browser (ekuivalen) — untuk frontend

Pastikan field sudah dinormalisasi dengan aturan yang sama di atas sebelum panggil ini:

```js
import { solidityPackedKeccak256 } from "ethers";

// fields sudah dinormalisasi (atau pakai fungsi normalize yang sama)
const receiptNumber = "INV-001";
const amount = 15000000; // uint256 integer
const receiptDate = "2026-09-22";
const storeName = "toko abc";

const hash = solidityPackedKeccak256(
  ["string", "uint256", "string", "string"],
  [receiptNumber, amount, receiptDate, storeName]
);
// → "0xbc23949c0fb885127fded6c0dc09ae7bffe4e6680b998f65508e9ca253a435f0"
```

Jika frontend menerima hasil dari `POST /api/analyze-receipt`, **pakai `canonicalHash` dari response backend** — tidak perlu recompute, hindari drift normalisasi.

## 5. imageHash (backend saja)

```js
const crypto = require("crypto");
const imageHash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");
// 66 karakter: "0x" + 64 hex
```

`imageHash` **tidak** dikirim ke contract — hanya untuk deteksi file identik di DB (schema.md §1).
