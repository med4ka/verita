/**
 * File: src/services/wallet.js
 * Description: Wallet + contract helpers (ethers v6) for BOT Chain — connect, chain switch, contract instances.
 * Part of: Frontend services
 * Main dependencies: ethers, ../config/contract (BOT_CHAIN), ../config/abi (RECEIPT_REGISTRY_ABI)
 */

import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'
import { BOT_CHAIN } from '../config/contract'
import { RECEIPT_REGISTRY_ABI } from '../config/abi'

/**
 * Get a BrowserProvider wrapping window.ethereum.
 *
 * @returns {Promise<BrowserProvider>} ethers provider
 * @throws {Error} when MetaMask is not installed
 */
export async function getProvider() {
  if (!window.ethereum) {
    throw new Error('MetaMask belum terpasang.')
  }
  return new BrowserProvider(window.ethereum)
}

/**
 * Connect wallet with user prompt (eth_requestAccounts).
 *
 * @returns {Promise<{provider: BrowserProvider, signer: object, address: string}>}
 */
export async function connectWallet() {
  const provider = await getProvider()

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  })

  if (!accounts || accounts.length === 0) {
    throw new Error('Tidak ada wallet yang terhubung.')
  }

  const signer = await provider.getSigner(accounts[0])

  return { provider, signer, address: accounts[0] }
}

/**
 * Read already-connected wallet WITHOUT prompting (eth_accounts).
 *
 * @returns {Promise<{provider: BrowserProvider, signer: object, address: string}|null>} null when none connected
 */
export async function getCurrentWallet() {
  if (!window.ethereum) {
    return null
  }

  const accounts = await window.ethereum.request({
    method: 'eth_accounts',
  })

  if (!accounts || accounts.length === 0) {
    return null
  }

  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner(accounts[0])

  return { provider, signer, address: accounts[0] }
}

/**
 * Current chain id as hex string (e.g. '0x3c8').
 *
 * @returns {Promise<string|null>} hex chain id, null when MetaMask missing
 */
export async function getChainId() {
  if (!window.ethereum) {
    return null
  }

  const chainId = await window.ethereum.request({
    method: 'eth_chainId',
  })

  return chainId
}

/**
 * Switch wallet to the active BOT Chain network; add it when unknown (error 4902).
 *
 * @returns {Promise<void>}
 */
export async function switchToBotChain() {
  if (!window.ethereum) {
    throw new Error('MetaMask belum terpasang.')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BOT_CHAIN.chainIdHex }],
    })
  } catch (error) {
    if (error.code !== 4902) {
      throw error
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: BOT_CHAIN.chainIdHex,
          chainName: BOT_CHAIN.chainName,
          nativeCurrency: BOT_CHAIN.nativeCurrency,
          rpcUrls: BOT_CHAIN.rpcUrls,
          blockExplorerUrls: BOT_CHAIN.blockExplorerUrls,
        },
      ],
    })
  }
}

/**
 * ReceiptRegistry contract bound to a signer (write ops: registerClaim).
 *
 * @returns {Promise<Contract>}
 */
export async function getContract() {
  const { signer } = await connectWallet()
  return new Contract(BOT_CHAIN.contractAddress, RECEIPT_REGISTRY_ABI, signer)
}

/**
 * ReceiptRegistry contract bound to a provider only (reads: checkClaim, queryFilter).
 * Falls back to the public RPC when MetaMask is unavailable.
 *
 * @returns {Promise<Contract>}
 */
export async function getContractReadOnly() {
  let provider

  if (window.ethereum) {
    provider = new BrowserProvider(window.ethereum)
  } else {
    provider = new JsonRpcProvider(BOT_CHAIN.rpcUrls[0], {
      chainId: BOT_CHAIN.chainId,
      name: BOT_CHAIN.chainName,
    })
  }

  return new Contract(BOT_CHAIN.contractAddress, RECEIPT_REGISTRY_ABI, provider)
}

/**
 * Shorten an address for display.
 *
 * @param {string} addr - 0x address
 * @returns {string} '0x1234...5678'
 */
export function formatWallet(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
