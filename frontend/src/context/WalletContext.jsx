import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentWallet } from '../services/wallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-reconnect on mount (tanpa prompt) — pake eth_accounts
    async function init() {
      try {
        const w = await getCurrentWallet();
        setWallet(w ? { address: w.address } : null);
      } catch (e) {
        console.warn('wallet init gagal:', e);
      } finally {
        setLoading(false);
      }
    }
    init();

    // Listen MetaMask account change.
    // chainChanged sengaja TIDAK diurus di sini: switchToBotChain() memicu
    // event chainChanged di tengah alur sign tx — reload halaman akan
    // membatalkan popup MetaMask sebelum tx ter-sign.
    if (window.ethereum) {
      const onAccountsChanged = (accounts) => {
        setWallet(accounts && accounts[0] ? { address: accounts[0] } : null);
      };
      window.ethereum.on('accountsChanged', onAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      };
    }
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, setWallet, loading }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet harus di dalam WalletProvider');
  return ctx;
}
