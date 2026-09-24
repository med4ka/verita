// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ReceiptRegistry — on-chain registry klaim nota/kuitansi
/// @notice Satu fingerprint (canonicalHash) hanya boleh diklaim sekali, selamanya.
///         Source of truth status duplikat ada di contract ini (bukan DB backend).
contract ReceiptRegistry {
    struct Claim {
        address claimant;
        uint256 timestamp;
        string metadataURI; // link ke detail record di backend (opsional)
    }

    mapping(bytes32 => Claim) public claims;
    mapping(bytes32 => bool) public isClaimed;

    event ClaimRegistered(bytes32 indexed hash, address indexed claimant, uint256 timestamp);
    event DuplicateRejected(bytes32 indexed hash, address indexed attemptedClaimant);

    /// @notice Daftarkan klaim untuk fingerprint nota. Revert jika sudah pernah diklaim.
    /// @param hash canonicalHash = keccak256(normalize(receiptNumber) + normalize(amount) + receiptDate + normalize(storeName))
    /// @param metadataURI URL detail record di backend (mis. https://.../api/receipts/:id)
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

    /// @notice Cek status klaim untuk sukses / UI detail klaim pertama (termasuk metadataURI).
    /// @return exists true jika hash sudah pernah diklaim
    /// @return claimant address wallet yang mengklaim pertama (0x0 jika belum ada)
    /// @return timestamp block.timestamp klaim pertama (0 jika belum ada)
    /// @return metadataURI link detail record saat klaim pertama ("" jika belum ada)
    function checkClaim(bytes32 hash)
        external
        view
        returns (bool exists, address claimant, uint256 timestamp, string memory metadataURI)
    {
        Claim memory c = claims[hash];
        return (isClaimed[hash], c.claimant, c.timestamp, c.metadataURI);
    }
}
