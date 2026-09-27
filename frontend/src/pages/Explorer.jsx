import { useEffect, useMemo, useState } from 'react'
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
  Loader2,
} from 'lucide-react'
import { API_BASE, BOT_CHAIN } from '../config/contract'
import { getContractReadOnly } from '../services/wallet'

const EXPLORER_URL = BOT_CHAIN.blockExplorerUrls[0]

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

  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /* =========================================================
     LOAD — event ClaimRegistered dari contract, enrich via backend
  ========================================================= */

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const contract = await getContractReadOnly()
        const filter = contract.filters.ClaimRegistered()

        let events
        try {
          const currentBlock = await contract.runner.provider.getBlockNumber()
          // Window 100k block (~16 jam di BOT Chain) — cukup buat demo, gak timeout
          const fromBlock = Math.max(0, currentBlock - 100000)
          events = await contract.queryFilter(filter, fromBlock, currentBlock)
        } catch (rpcErr) {
          console.warn('queryFilter gagal:', rpcErr)
          throw new Error('Gagal memuat data on-chain. Coba lagi nanti.')
        }

        const mapped = await Promise.all(
          events.map(async (ev) => {
            const hash = ev.args.hash
            let storeName = '—'
            let amount = 0
            let verdict = 'clean'
            let receiptNumber = '—'
            let receiptDate = '-'
            let canonicalHash = hash

            // Enrich dari backend — gagal enrichment tidak mematikan data on-chain
            try {
              const res = await fetch(
                `${API_BASE}/api/receipts/by-hash?hash=${hash}`
              )
              if (res.ok) {
                const d = await res.json()
                if (d.found !== false) {
                  storeName = d.storeName || '—'
                  amount = d.amount || 0
                  verdict = d.verdict || 'clean'
                  receiptNumber =
                    d.receiptId != null ? `#${d.receiptId}` : '—'
                  receiptDate = d.createdAt
                    ? d.createdAt.split('T')[0]
                    : '-'
                  canonicalHash = d.canonicalHash || hash
                }
              }
            } catch (e) {
              // Skip enrichment, tetap tampilkan data dari chain
              console.warn('Enrichment gagal:', e)
            }

            return {
              hash,
              claimant: ev.args.claimant,
              timestamp: Number(ev.args.timestamp),
              receiptNumber,
              receiptDate,
              storeName,
              amount,
              verdict,
              txHash: ev.transactionHash,
              blockNumber: ev.blockNumber,
              canonicalHash,
            }
          })
        )

        setClaims(mapped.reverse())
      } catch (err) {
        setError(err.message)
        setClaims([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredClaims = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return claims.filter((claim) => {
      const matchesSearch =
        !keyword ||
        claim.receiptNumber.toLowerCase().includes(keyword) ||
        claim.storeName.toLowerCase().includes(keyword) ||
        claim.claimant.toLowerCase().includes(keyword)

      const matchesVerdict =
        verdictFilter === 'all' || claim.verdict === verdictFilter

      return matchesSearch && matchesVerdict
    })
  }, [search, verdictFilter, claims])

  const totalAmount = claims.reduce(
    (total, claim) => total + claim.amount,
    0
  )

  const uniqueWallets = new Set(
    claims.map((claim) => claim.claimant)
  ).size

  const reviewCount = claims.filter(
    (claim) => claim.verdict !== 'clean'
  ).length

  const selectedFilter =
    FILTER_OPTIONS.find((item) => item.value === verdictFilter) ||
    FILTER_OPTIONS[0]

  return (
    <div className="explorer-page mx-auto w-full max-w-7xl">
      {/* HEADER */}
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300/85">
          <Globe2 size={13} />
          Blockchain Explorer
        </p>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Public Explorer
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300/85">
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

      {/* LOADING / ERROR */}

      {loading && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border-[3px] border-blue-400/60 border-l-[6px] border-l-blue-500 bg-slate-900/25 px-4 py-3 text-sm text-slate-300 shadow-[0_0_40px_rgba(59,130,246,0.4)] backdrop-blur-xl">
          <Loader2 size={17} className="animate-spin text-blue-300" />
          Memuat klaim on-chain...
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border-[3px] border-red-400/60 border-l-[6px] border-l-red-500 bg-red-400/[0.06] shadow-[0_0_40px_rgba(239,68,68,0.4)] px-4 py-3 text-sm text-red-200 backdrop-blur-xl">
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0 text-red-300"
          />
          <p>{error}</p>
        </div>
      )}

      {/* SUMMARY */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Blocks}
          label="Total Klaim On-chain"
          value={claims.length}
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

                  <p className="mt-0.5 text-xs text-slate-300/90">
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
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-300/90"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nota, toko, wallet..."
                  className="glass-input h-11 w-full rounded-xl pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-blue-300/40 sm:w-64"
                />
              </div>

              {/* CUSTOM FILTER */}
              <div className="relative w-full sm:w-52">
                <button
                  type="button"
                  onClick={() => setFilterOpen((current) => !current)}
                  className="glass-input flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm text-slate-300 outline-none transition hover:border-blue-300/30"
                >
                  <span className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-300/90" />
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
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
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
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-slate-400">
                          {claims.length === 0 ? (
                            <Blocks size={22} />
                          ) : (
                            <Search size={22} />
                          )}
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-300">
                          {claims.length === 0
                            ? 'Belum ada klaim on-chain'
                            : 'Tidak ada klaim ditemukan'}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {claims.length === 0
                            ? 'Belum ada klaim yang tercatat di BOT Chain.'
                            : 'Coba ubah kata pencarian atau filter.'}
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
          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Data ditampilkan berdasarkan catatan klaim pada jaringan.
            </p>

            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-300/85 transition hover:text-blue-200"
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

        <p className="mt-4 text-xs font-medium text-slate-300/90">
          {label}
        </p>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tracking-tight text-white">
            {value}
          </span>

          {suffix && (
            <span className="text-xs text-slate-400">{suffix}</span>
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
      className={`px-5 py-4 ${
        align === 'right'
          ? 'text-right'
          : align === 'center'
            ? 'text-center'
            : 'text-left'
      } text-sm font-semibold uppercase tracking-[0.12em] text-slate-300/90`}
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

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarDays size={10} />
              {formatDate(claim.receiptDate)}
            </p>
          </div>
        </div>
      </td>

      {/* STORE */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Store size={13} className="text-slate-400" />

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

          <span className="font-mono text-xs text-slate-400">
            {shortWallet(claim.claimant)}
          </span>
        </div>
      </td>

      {/* VERDICT */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${verdict.badge}`}
        >
          <verdict.icon size={11} />
          {verdict.label}
        </span>
      </td>

      {/* TIMESTAMP */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-300/85" />

          <span className="text-xs text-slate-400">
            {formatDateTime(claim.timestamp * 1000)}
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
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
        className="glass-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-[3px]! p-6 shadow-2xl! shadow-blue-500/40"
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
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300/85">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
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
              value={formatDateTime(claim.timestamp * 1000)}
            />
          </div>

          {/* CLAIMANT */}
          <GlassDetailBox>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
                Claimant Wallet
              </p>

              <Wallet size={14} className="text-purple-300/90" />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-slate-400">
                {claim.claimant}
              </p>

              <CopyButton value={claim.claimant} />
            </div>
          </GlassDetailBox>

          {/* ANALYSIS */}
          <GlassDetailBox>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
                Hasil Analisis
              </p>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${verdict.badge}`}
              >
                <verdict.icon size={11} />
                {verdict.label}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-5">
              <div>
                <p className="text-xs text-slate-400">
                  ELA Tamper Score
                </p>

                <p className="mt-1 text-2xl font-semibold text-white">
                  {claim.tamperScore}
                  <span className="ml-1 text-xs font-normal text-slate-400">
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
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
                Blockchain Record
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-400/[0.06] px-2.5 py-1 text-xs text-emerald-300">
                <CheckCircle2 size={11} />
                Terdaftar
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400">
                Transaction Hash
              </p>

              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">
                  {claim.txHash}
                </p>

                <CopyButton value={claim.txHash} />
              </div>

              <a
                href={`${EXPLORER_URL}/tx/${claim.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-300 transition hover:text-blue-200"
              >
                Lihat transaksi di BOT Chain
                <ExternalLink size={11} />
              </a>
            </div>

            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Canonical Hash
                </p>

                <CopyButton value={claim.canonicalHash} />
              </div>

              <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-400">
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
        <p className="text-xs text-slate-400">{label}</p>

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
      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
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