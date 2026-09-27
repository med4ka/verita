import { useMemo, useState } from 'react'
import {
  Search,
  Filter,
  Globe2,
  Wallet,
  ReceiptText,
  Store,
  CalendarDays,
  ExternalLink,
  X,
  Copy,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Blocks,
  ChevronDown,
} from 'lucide-react'

const EXPLORER_URL = 'https://scan.bohr.life'

const DEMO_CLAIMS = [
  {
    id: 1,
    receiptNumber: 'INV-2026-001',
    storeName: 'Toko ABC',
    amount: 250000,
    receiptDate: '2026-09-24',
    claimant: '0x742d35A4C8fB92e1D6A3B7C91F44E5A8',
    timestamp: '2026-09-24T14:35:12',
    verdict: 'clean',
    tamperScore: 18,
    status: 'registered',
    txHash:
      '0x71b8e2a6d4f9c3e1a7b5d8f2c6e0a4b9d3f7c1e5a8b2d6f0c4e9a3b7d1f5a9',
    canonicalHash:
      '0x8f3d91b9d0f7e5e1c4f9a72b8c6e2a1d9f0c3b5a7e8d1f2c4b6a8e0d2f4c6a8',
  },
  {
    id: 2,
    receiptNumber: 'INV-2026-002',
    storeName: 'Kopi Senja',
    amount: 185000,
    receiptDate: '2026-09-23',
    claimant: '0x91bA4D7f3E8c12A6B5D9F0e2C7a4B8D1',
    timestamp: '2026-09-23T11:21:44',
    verdict: 'suspicious',
    tamperScore: 43,
    status: 'registered',
    txHash:
      '0x4c9e7a2b8d1f6e3a5c0b9d7e2f8a4c1b6d3e9f5a7c2b8d4e0f6a1c9b3d7e5',
    canonicalHash:
      '0x9a7c4e2b1d8f6a3c5e0b9d2f7a4c8e1b6d3f9a5c7e2b8d4f0a1c6e9b3d5',
  },
  {
    id: 3,
    receiptNumber: 'INV-2026-003',
    storeName: 'Stationery Hub',
    amount: 125000,
    receiptDate: '2026-09-21',
    claimant: '0x5cA8e91B3D7f24C6A0e5B9d2F8c1A4',
    timestamp: '2026-09-21T16:48:09',
    verdict: 'clean',
    tamperScore: 11,
    status: 'registered',
    txHash:
      '0x2a8f5c1d9e4b7a3f0c6d8e2b5a1f9c4d7e3b6a0c8f2d5e9b1a4c7f0d3e6',
    canonicalHash:
      '0x3d8f2a6c1e9b7d4f0a5c8e2b6d1f9a3c7e4b0d8f2a6c5e1b9d7f3a8c4e2',
  },
  {
    id: 4,
    receiptNumber: 'INV-2026-004',
    storeName: 'Digital Mart',
    amount: 475000,
    receiptDate: '2026-09-20',
    claimant: '0x3F7aB2d9C1e6A8f4D0b5E7c2A9d3F6',
    timestamp: '2026-09-20T09:25:31',
    verdict: 'tampered',
    tamperScore: 76,
    status: 'registered',
    txHash:
      '0x6f2a8c4e1b7d9f3a5c0e6b2d8f4a1c7e9b3d5f0a6c2e8d4b1f7a3c9e5d2',
    canonicalHash:
      '0x6e2a9c4b7d1f8e3a5c0b6d9f2a4e7c1b8d3f5a0c6e9b2d4f7a1c8e5b3',
  },
  {
    id: 5,
    receiptNumber: 'INV-2026-005',
    storeName: 'Tech Corner',
    amount: 890000,
    receiptDate: '2026-09-18',
    claimant: '0x8D4cB1a7F3e9C2d6A5b0E8f1D7c4B9',
    timestamp: '2026-09-18T13:42:17',
    verdict: 'clean',
    tamperScore: 15,
    status: 'registered',
    txHash:
      '0x9b3d7f1a5c8e2b6d0f4a9c1e7b3d5f8a2c6e0b4d9f1a7c3e5b8d2f6a0c4',
    canonicalHash:
      '0x1a7c4e9b2d6f8a3c5e0b7d1f9a4c6e2b8d3f5a0c7e1b9d4f6a2c8e5b3',
  },
  {
    id: 6,
    receiptNumber: 'INV-2026-006',
    storeName: 'Print House',
    amount: 320000,
    receiptDate: '2026-09-17',
    claimant: '0xB7e2C9a4F1d6A8c3E0b5D9f2C7a1E4',
    timestamp: '2026-09-17T10:16:52',
    verdict: 'suspicious',
    tamperScore: 51,
    status: 'registered',
    txHash:
      '0x3e7a1c9f5b2d8e4a0c6f9b1d7e3a5c8f2b6d0e4a9c1f7b3d5e8a2c6f0',
    canonicalHash:
      '0x5c8e2a7d1f9b4c6e0a3d7f2b5e8c1a9d4f6b0e2c7a5d9f3b1e8c4a6',
  },
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'Semua hasil' },
  { value: 'clean', label: 'Bersih' },
  { value: 'suspicious', label: 'Perlu Ditinjau' },
  { value: 'tampered', label: 'Terindikasi Perubahan' },
]

function Explorer() {
  const [search, setSearch] = useState('')
  const [verdictFilter, setVerdictFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState(null)

  const filteredClaims = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return DEMO_CLAIMS.filter((claim) => {
      const matchesSearch =
        !keyword ||
        claim.receiptNumber.toLowerCase().includes(keyword) ||
        claim.storeName.toLowerCase().includes(keyword) ||
        claim.claimant.toLowerCase().includes(keyword)

      const matchesVerdict =
        verdictFilter === 'all' || claim.verdict === verdictFilter

      return matchesSearch && matchesVerdict
    })
  }, [search, verdictFilter])

  const totalAmount = DEMO_CLAIMS.reduce(
    (total, claim) => total + claim.amount,
    0
  )

  const uniqueWallets = new Set(
    DEMO_CLAIMS.map((claim) => claim.claimant)
  ).size

  const reviewCount = DEMO_CLAIMS.filter(
    (claim) => claim.verdict !== 'clean'
  ).length

  const selectedFilter =
    FILTER_OPTIONS.find((item) => item.value === verdictFilter) ||
    FILTER_OPTIONS[0]

  return (
    <div className="explorer-page mx-auto w-full max-w-7xl">
      {/* HEADER */}
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300/70">
          <Globe2 size={13} />
          Blockchain Explorer
        </p>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Public Explorer
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300/65">
              Lihat klaim yang telah tercatat pada jaringan BOT Chain secara
              transparan.
            </p>
          </div>

          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            className="glass-panel inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-slate-200 transition duration-200 hover:border-blue-300/30 hover:text-white"
          >
            <span className="relative z-10">Buka BOT Explorer</span>
            <ExternalLink size={14} className="relative z-10" />
          </a>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Blocks}
          label="Total Klaim On-chain"
          value={DEMO_CLAIMS.length}
          suffix="klaim"
          accent="blue"
        />

        <SummaryCard
          icon={Wallet}
          label="Wallet Unik"
          value={uniqueWallets}
          suffix="wallet"
          accent="green"
        />

        <SummaryCard
          icon={ReceiptText}
          label="Total Nilai Klaim"
          value={formatCurrency(totalAmount)}
          accent="blue"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Perlu Ditinjau"
          value={reviewCount}
          suffix="klaim"
          accent="amber"
        />
      </div>

      {/* MAIN GLASS PANEL */}
      <section className="glass-panel rounded-[28px] p-4 sm:p-5">
        <div className="relative z-10">
          {/* SECTION HEADER */}
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/15 bg-blue-400/10 text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Globe2 size={17} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Global Claims
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400/70">
                    Data klaim yang tercatat pada registry.
                  </p>
                </div>
              </div>
            </div>

            {/* SEARCH + FILTER */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400/70"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nota, toko, wallet..."
                  className="glass-input h-11 w-full rounded-xl pl-9 pr-4 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/40 sm:w-64"
                />
              </div>

              {/* CUSTOM FILTER */}
              <div className="relative w-full sm:w-52">
                <button
                  type="button"
                  onClick={() => setFilterOpen((current) => !current)}
                  className="glass-input flex h-11 w-full items-center justify-between rounded-xl px-3 text-xs text-slate-300 outline-none transition hover:border-blue-300/30"
                >
                  <span className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400/70" />
                    {selectedFilter.label}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${
                      filterOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {filterOpen && (
                  <div className="glass-panel absolute right-0 top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-xl p-1 shadow-2xl">
                    {FILTER_OPTIONS.map((option) => {
                      const active = option.value === verdictFilter

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setVerdictFilter(option.value)
                            setFilterOpen(false)
                          }}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-xs transition ${
                            active
                              ? 'bg-blue-400/15 text-blue-200'
                              : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="glass-table overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-white/[0.11] bg-white/[0.035]">
                    <TableHead>Klaim</TableHead>
                    <TableHead>Toko</TableHead>
                    <TableHead align="right">Nominal</TableHead>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Analisis</TableHead>
                    <TableHead>Dicatat</TableHead>
                    <TableHead align="right">Detail</TableHead>
                  </tr>
                </thead>

                <tbody>
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-20 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-slate-500">
                          <Search size={22} />
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-300">
                          Tidak ada klaim ditemukan
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Coba ubah kata pencarian atau filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <ExplorerRow
                        key={claim.id}
                        claim={claim}
                        onClick={() => setSelectedClaim(claim)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Data ditampilkan berdasarkan catatan klaim pada jaringan.
            </p>

            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-300/70 transition hover:text-blue-200"
            >
              BOT Chain Explorer
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  )
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent = 'blue',
}) {
  const colors = {
    blue: {
      iconBg: 'bg-blue-400/10',
      iconText: 'text-blue-300',
      glow: 'shadow-[0_0_35px_rgba(70,150,255,0.08)]',
    },

    green: {
      iconBg: 'bg-emerald-400/10',
      iconText: 'text-emerald-300',
      glow: 'shadow-[0_0_35px_rgba(40,220,170,0.07)]',
    },

    amber: {
      iconBg: 'bg-amber-400/10',
      iconText: 'text-amber-300',
      glow: 'shadow-[0_0_35px_rgba(250,190,70,0.07)]',
    },
  }

  const color = colors[accent]

  return (
    <div
      className={`glass-panel rounded-2xl p-4 transition duration-200 hover:-translate-y-[1px] hover:border-white/20 ${color.glow}`}
    >
      <div className="relative z-10">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] ${color.iconBg} ${color.iconText}`}
        >
          <Icon size={17} />
        </div>

        <p className="mt-4 text-[11px] font-medium text-slate-400/75">
          {label}
        </p>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tracking-tight text-white">
            {value}
          </span>

          {suffix && (
            <span className="text-[10px] text-slate-500">{suffix}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   TABLE
========================================================= */

function TableHead({ children, align = 'left' }) {
  return (
    <th
      className={`px-5 py-4 text-${align} text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400/75`}
    >
      {children}
    </th>
  )
}

function ExplorerRow({ claim, onClick }) {
  const verdict = getVerdictConfig(claim.verdict)

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-b border-white/[0.07] transition duration-200 last:border-b-0 hover:bg-white/[0.045]"
    >
      {/* CLAIM */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200/10 bg-blue-400/[0.08] text-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <ReceiptText size={15} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-200">
              {claim.receiptNumber}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
              <CalendarDays size={10} />
              {formatDate(claim.receiptDate)}
            </p>
          </div>
        </div>
      </td>

      {/* STORE */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Store size={13} className="text-slate-500" />

          <span className="text-xs text-slate-300/90">
            {claim.storeName}
          </span>
        </div>
      </td>

      {/* AMOUNT */}
      <td className="px-5 py-4 text-right">
        <span className="text-xs font-semibold text-slate-200">
          {formatCurrency(claim.amount)}
        </span>
      </td>

      {/* CLAIMANT */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-purple-300/10 bg-purple-400/[0.07] text-purple-300/80">
            <Wallet size={13} />
          </div>

          <span className="font-mono text-[10px] text-slate-500">
            {shortWallet(claim.claimant)}
          </span>
        </div>
      </td>

      {/* VERDICT */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${verdict.badge}`}
        >
          <verdict.icon size={11} />
          {verdict.label}
        </span>
      </td>

      {/* TIMESTAMP */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-300/65" />

          <span className="text-[10px] text-slate-500">
            {formatDateTime(claim.timestamp)}
          </span>
        </div>
      </td>

      {/* DETAIL */}
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
        >
          <ArrowUpRight size={15} />
        </button>
      </td>
    </tr>
  )
}

/* =========================================================
   DETAIL MODAL
========================================================= */

function ClaimDetailModal({ claim, onClose }) {
  const verdict = getVerdictConfig(claim.verdict)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative z-10">
          {/* MODAL HEADER */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200/10 bg-blue-400/10 text-blue-300">
                <Blocks size={19} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-blue-300/65">
                  Public Claim
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  {claim.receiptNumber}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* BASIC INFO */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <DetailItem label="Nama Toko" value={claim.storeName} />
            <DetailItem label="Nominal" value={formatCurrency(claim.amount)} />
            <DetailItem
              label="Tanggal Nota"
              value={formatDate(claim.receiptDate)}
            />
            <DetailItem
              label="Dicatat"
              value={formatDateTime(claim.timestamp)}
            />
          </div>

          {/* CLAIMANT */}
          <GlassDetailBox>
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Claimant Wallet
              </p>

              <Wallet size={14} className="text-purple-300/70" />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 break-all font-mono text-[10px] leading-5 text-slate-400">
                {claim.claimant}
              </p>

              <CopyButton value={claim.claimant} />
            </div>
          </GlassDetailBox>

          {/* ANALYSIS */}
          <GlassDetailBox>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Hasil Analisis
              </p>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${verdict.badge}`}
              >
                <verdict.icon size={11} />
                {verdict.label}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-5">
              <div>
                <p className="text-[10px] text-slate-500">
                  ELA Tamper Score
                </p>

                <p className="mt-1 text-2xl font-semibold text-white">
                  {claim.tamperScore}
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    / 100
                  </span>
                </p>
              </div>

              <div className="h-2 w-32 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={`h-full rounded-full ${verdict.bar}`}
                  style={{ width: `${claim.tamperScore}%` }}
                />
              </div>
            </div>
          </GlassDetailBox>

          {/* BLOCKCHAIN */}
          <GlassDetailBox>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Blockchain Record
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] text-emerald-300">
                <CheckCircle2 size={11} />
                Terdaftar
              </span>
            </div>

            <div className="mt-4">
              <p className="text-[10px] text-slate-500">
                Transaction Hash
              </p>

              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-400">
                  {claim.txHash}
                </p>

                <CopyButton value={claim.txHash} />
              </div>

              <a
                href={`${EXPLORER_URL}/tx/${claim.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-300 transition hover:text-blue-200"
              >
                Lihat transaksi di BOT Chain
                <ExternalLink size={11} />
              </a>
            </div>

            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500">
                  Canonical Hash
                </p>

                <CopyButton value={claim.canonicalHash} />
              </div>

              <p className="mt-2 break-all font-mono text-[9px] leading-5 text-slate-500">
                {claim.canonicalHash}
              </p>
            </div>
          </GlassDetailBox>

          {/* CLOSE */}
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl border border-white/[0.10] bg-white/[0.055] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function GlassDetailBox({ children }) {
  return (
    <div className="glass-panel mt-4 rounded-2xl p-4">
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="glass-panel rounded-xl p-3">
      <div className="relative z-10">
        <p className="text-[10px] text-slate-500">{label}</p>

        <p className="mt-1.5 truncate text-xs font-medium text-slate-300">
          {value}
        </p>
      </div>
    </div>
  )
}

function CopyButton({ value }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard permission may be unavailable in some browsers.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
      title="Salin"
    >
      <Copy size={13} />
    </button>
  )
}

/* =========================================================
   HELPERS
========================================================= */

function getVerdictConfig(verdict) {
  if (verdict === 'tampered') {
    return {
      label: 'Terindikasi Perubahan',
      icon: ShieldAlert,
      badge: 'border-red-300/10 bg-red-400/[0.07] text-red-300',
      bar: 'bg-red-400',
    }
  }

  if (verdict === 'suspicious') {
    return {
      label: 'Perlu Ditinjau',
      icon: AlertTriangle,
      badge: 'border-amber-300/10 bg-amber-400/[0.07] text-amber-300',
      bar: 'bg-amber-400',
    }
  }

  return {
    label: 'Bersih',
    icon: CheckCircle2,
    badge: 'border-emerald-300/10 bg-emerald-400/[0.07] text-emerald-300',
    bar: 'bg-emerald-400',
  }
}

function shortWallet(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default Explorer