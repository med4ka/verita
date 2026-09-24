# Schema — Database, Smart Contract, API

## 1. Database Schema (off-chain)

### Table: `receipts`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID / serial | PK |
| `wallet_address` | varchar(42) | address user yang submit, lowercase |
| `image_url` | text | lokasi file gambar (storage/CDN) |
| `image_hash` | varchar(66) | sha256 dari file gambar, untuk deteksi file identik |
| `canonical_hash` | varchar(66) | keccak256(nomor+nominal+tanggal+toko), ini yang dikirim ke contract |
| `receipt_number` | varchar | nomor nota (input manual) |
| `amount` | numeric | nominal |
| `receipt_date` | date | tanggal di nota |
| `store_name` | varchar | nama toko/vendor |
| `tamper_score` | integer | 0–100, hasil ELA |
| `verdict` | enum | `clean` \| `suspicious` \| `tampered` |
| `onchain_tx_hash` | varchar(66) | null sampai user submit tx dari frontend |
| `onchain_status` | enum | `pending` \| `registered` \| `rejected_duplicate` |
| `created_at` | timestamp | default now() |

Index: `canonical_hash` (unique constraint opsional di level DB juga, sebagai lapisan kedua selain on-chain), `wallet_address`.

## 2. Smart Contract — `ReceiptRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReceiptRegistry {
    struct Claim {
        address claimant;
        uint256 timestamp;
        string metadataURI; // optional: link ke detail record di backend
    }

    mapping(bytes32 => Claim) public claims;
    mapping(bytes32 => bool) public isClaimed;

    event ClaimRegistered(bytes32 indexed hash, address indexed claimant, uint256 timestamp);
    event DuplicateRejected(bytes32 indexed hash, address indexed attemptedClaimant);

    function registerClaim(bytes32 hash, string calldata metadataURI) external returns (bool) {
        if (isClaimed[hash]) {
            emit DuplicateRejected(hash, msg.sender);
            revert("Duplicate receipt: already claimed");
        }
        claims[hash] = Claim(msg.sender, block.timestamp, metadataURI);
        isClaimed[hash] = true;
        emit ClaimRegistered(hash, msg.sender, block.timestamp);
        return true;
    }

    function checkClaim(bytes32 hash) external view returns (bool exists, address claimant, uint256 timestamp) {
        Claim memory c = claims[hash];
        return (isClaimed[hash], c.claimant, c.timestamp);
    }
}
```

> Catatan: ini starting point, sesuaikan lagi pas lo tulis final di Remix — misalnya kalau butuh field tambahan di event untuk indexing di frontend.

## 3. API Schema (Backend ↔ Frontend)

### `POST /api/analyze-receipt`
Request: `multipart/form-data`
```
image: File
receiptNumber: string
amount: number
receiptDate: string (YYYY-MM-DD)
storeName: string
walletAddress: string
```

Response `200`:
```json
{
  "receiptId": "uuid",
  "imageHash": "0x...",
  "canonicalHash": "0x...",
  "tamperScore": 12,
  "verdict": "clean",
  "onchainStatus": "pending"
}
```

Response `400` (validasi gagal): `{ "error": "amount is required" }`

### `POST /api/receipts/:id/confirm-onchain`
Dipanggil frontend setelah tx sukses/gagal, supaya DB sinkron dengan chain.

Request:
```json
{
  "txHash": "0x...",
  "onchainStatus": "registered" 
}
```
(`onchainStatus` bisa juga `rejected_duplicate` kalau tx revert)

Response `200`: `{ "ok": true }`

### `GET /api/receipts?wallet=0x...`
Response `200`:
```json
[
  {
    "receiptId": "uuid",
    "storeName": "Toko ABC",
    "amount": 150000,
    "verdict": "clean",
    "canonicalHash": "0x...",
    "onchainStatus": "registered",
    "txHash": "0x...",
    "createdAt": "2026-09-22T10:00:00Z"
  }
]
```

### `GET /api/receipts/check-duplicate?hash=0x...`
Cek cepat sebelum submit tx (opsional, hemat gas user karena bisa warning di UI dulu sebelum sign transaksi).

Response `200`:
```json
{ "isClaimed": true, "claimant": "0xabc...", "timestamp": 1732000000 }
```
