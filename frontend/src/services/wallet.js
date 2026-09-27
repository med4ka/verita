import { BrowserProvider } from 'ethers'
import { BOT_CHAIN } from '../config/contract'

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error('MetaMask belum terpasang.')
  }

  return new BrowserProvider(window.ethereum)
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error(
      'MetaMask belum terpasang. Silakan install MetaMask terlebih dahulu.'
    )
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  })

  if (!accounts || accounts.length === 0) {
    throw new Error('Tidak ada wallet yang terhubung.')
  }

  const provider = new BrowserProvider(window.ethereum)

  return {
    provider,
    address: accounts[0],
  }
}

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

  return accounts[0]
}

export async function getChainId() {
  if (!window.ethereum) {
    return null
  }

  const chainId = await window.ethereum.request({
    method: 'eth_chainId',
  })

  return parseInt(chainId, 16)
}

export async function switchToBotChain() {
  if (!window.ethereum) {
    throw new Error('MetaMask belum terpasang.')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: BOT_CHAIN.chainIdHex,
        },
      ],
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