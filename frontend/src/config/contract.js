// Network config for BOT Chain (testnet + mainnet)
export const NETWORKS = {
  testnet: {
    chainId: 968,
    chainIdHex: '0x3c8',
    chainName: 'BOT Chain Testnet (Bohr)',
    nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
    rpcUrls: ['https://rpc.bohr.life'],
    blockExplorerUrls: ['https://scan.bohr.life'],
    contractAddress: '0x611777e4f368d122D1E9cEB2deAd94f8E9DC4De7',
  },
  mainnet: {
    chainId: 677,
    chainIdHex: '0x2a5',
    chainName: 'BOT Chain Mainnet',
    nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
    rpcUrls: ['https://rpc.botchain.ai'],
    blockExplorerUrls: ['https://scan.botchain.ai'],
    contractAddress: '0x3BA22799262a7f69CFCC614f2ccaB5cdd2A212a3',
  },
};

export const ACTIVE_NETWORK = 'testnet'; // ganti 'mainnet' pas demo
export const BOT_CHAIN = NETWORKS[ACTIVE_NETWORK];
export const API_BASE = 'https://verita.pxxlspace.cv';