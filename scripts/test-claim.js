/**
 * File: scripts/test-claim.js
 * Description: Manual integration test backend ↔ ReceiptRegistry contract on testnet — register, expect revert on duplicate, checkClaim, random hash. Run: npm run test:claim
 * Part of: On-chain integration / tests
 * Main dependencies: ethers, dotenv
 *
 * Notes:
 * - Requires TEST_PK in .env (never hardcode, never commit). TESTNET_RPC and CONTRACT_ADDRESS_TESTNET have defaults.
 * - Exit 0 on ✅ ALL INTEGRATION TESTS PASS; exit 1 on any failure.
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { ethers } = require('ethers');

const TESTNET_RPC = process.env.TESTNET_RPC || 'https://rpc.bohr.life';
const TEST_PK = (process.env.TEST_PK || '').trim();
const CONTRACT_ADDRESS_TESTNET =
  process.env.CONTRACT_ADDRESS_TESTNET ||
  '0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7';

const ABI = [
  'function registerClaim(bytes32 hash, string metadataURI) returns (bool)',
  'function checkClaim(bytes32 hash) view returns (bool exists, address claimant, uint256 timestamp, string metadataURI)',
  'event ClaimRegistered(bytes32 indexed hash, address indexed claimant, uint256 timestamp)',
  'event DuplicateRejected(bytes32 indexed hash, address indexed attemptedClaimant)',
];

/**
 * Throw a clear error if a required env var is missing/empty.
 *
 * @param {string} name - Env var name
 * @param {string} value - Value to check
 * @returns {void}
 *
 * Notes:
 * - Never logs the value (only the name).
 */
function requireEnv(name, value) {
  if (!value) {
    throw new Error(
      `[ENV] ${name} must be set in .env (do not hardcode, do not commit)`
    );
  }
}

/**
 * Run 4 integration tests against ReceiptRegistry on testnet.
 *
 * @returns {Promise<void>} Exits 0 on all pass; throws/exits 1 on failure
 *
 * @example
 * // npm run test:claim  (requires TEST_PK in .env)
 *
 * Notes:
 * - Test 1: registerClaim with unique hash → wait for receipt.
 * - Test 2: registerClaim same hash must revert (hard-check R9).
 * - Test 3: checkClaim returns exists=true, claimant=wallet, metadataURI='meta://test-1' (R10).
 * - Test 4: checkClaim(random hash) → exists=false.
 */
async function main() {
  requireEnv('TEST_PK', TEST_PK);
  requireEnv('TESTNET_RPC', TESTNET_RPC);
  requireEnv('CONTRACT_ADDRESS_TESTNET', CONTRACT_ADDRESS_TESTNET);

  const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
  const wallet = new ethers.Wallet(TEST_PK, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS_TESTNET, ABI, wallet);

  const testHash = ethers.keccak256(ethers.toUtf8Bytes('test-' + Date.now()));
  const walletAddress = await wallet.getAddress();

  console.log(`[SETUP] rpc=${TESTNET_RPC}`);
  console.log(`[SETUP] contract=${CONTRACT_ADDRESS_TESTNET}`);
  console.log(`[SETUP] wallet=${walletAddress}`);
  console.log(`[SETUP] testHash=${testHash}`);

  // Test 1 — first registerClaim
  const tx1 = await contract.registerClaim(testHash, 'meta://test-1');
  const receipt1 = await tx1.wait();
  console.log(
    `✅ Claim registered, tx hash: ${receipt1.hash}, block: ${receipt1.blockNumber}`
  );

  // Test 2 — registerClaim same hash → must revert (hard-check R9)
  let reverted = false;
  try {
    const tx2 = await contract.registerClaim(testHash, 'meta://test-2');
    await tx2.wait();
  } catch (err) {
    reverted = true;
    const reason =
      (err && err.shortMessage) ||
      (err && err.message && String(err.message).split('\n')[0]) ||
      String(err);
    console.log(`✅ Revert as expected (${reason})`);
  }
  if (!reverted) {
    throw new Error('❌ EXPECTED REVERT but tx succeeded!');
  }

  // Test 3 — checkClaim (4-tuple return in final contract)
  const [exists, claimant, timestamp, metadataURI] =
    await contract.checkClaim(testHash);
  console.log(`  exists=${exists}`);
  console.log(`  claimant=${claimant}`);
  console.log(`  timestamp=${timestamp}`);
  console.log(`  metadataURI=${metadataURI}`);

  if (exists !== true) {
    throw new Error(`checkClaim exists=${exists}, expected true`);
  }
  if (String(claimant).toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error(
      `checkClaim claimant=${claimant}, expected ${walletAddress}`
    );
  }
  if (metadataURI !== 'meta://test-1') {
    throw new Error(
      `checkClaim metadataURI=${metadataURI}, expected meta://test-1 (first claim, R10)`
    );
  }

  // Test 4 — checkClaim random hash → exists=false
  const randomHash = ethers.keccak256(
    ethers.toUtf8Bytes('random-' + Date.now())
  );
  const [existsRandom] = await contract.checkClaim(randomHash);
  console.log(`[TEST 4] random exists=${existsRandom}`);
  if (existsRandom !== false) {
    throw new Error(
      `checkClaim(random) exists=${existsRandom}, expected false`
    );
  }

  console.log('✅ ALL INTEGRATION TESTS PASS');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ INTEGRATION TEST FAILED');
  console.error(err && err.message ? err.message : err);
  if (err && err.stack && err.message !== err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
