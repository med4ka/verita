import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Layout from './components/Layout'
import Home from './pages/Home' 
import History from './pages/History'
import Explorer from './pages/Explorer'
import { WalletProvider } from './context/WalletContext'

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/explorer" element={<Explorer />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  )
}

export default App