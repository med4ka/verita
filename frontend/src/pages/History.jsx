import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ReceiptText,
  Wallet,
  CalendarDays,
  Store,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock3,
  Copy,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'
import { API_BASE } from '../config/contract'
import { getCurrentWallet } from '../services/wallet'

function History() {
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)
  const [verdictFilter, setVerdictFilter] =
    useState('all')
  const [statusFilter, setStatusFilter] =
    useState('all')

  const [selectedReceipt, setSelectedReceipt] =
    useState(null)

  /* =========================================================
     LOAD — fetch riwayat klaim milik wallet aktif
  ========================================================= */

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const wallet = await getCurrentWallet()

        if (!wallet) {
          setHistory([])
          setWalletAddress(null)
          return
        }

        setWalletAddress(wallet.address)

        const res = await fetch(
          `${API_BASE}/api/receipts?wallet=${wallet.address.toLowerCase()}`
        )

        if (!res.ok) throw new Error('Gagal load history')

        const data = await res.json()

        const mapped = data.map((r) => ({
          id: r.receiptId,
          receiptNumber: `#${r.receiptId}`,
          date: r.createdAt?.split('T')[0] || '-',
          storeName: r.storeName,
          amount: r.amount,
          verdict: r.verdict,
          status: r.onchainStatus,
          txHash: r.txHash,
          canonicalHash: r.canonicalHash,
        }))

        setHistory(mapped)
      } catch (err) {
        setError(err.message)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const keyword =
        search.toLowerCase().trim()

      const matchesSearch =
        !keyword ||
        item.receiptNumber
          .toLowerCase()
          .includes(keyword) ||
        item.storeName
          .toLowerCase()
          .includes(keyword)

      const matchesVerdict =
        verdictFilter === 'all' ||
        item.verdict === verdictFilter

      const matchesStatus =
        statusFilter === 'all' ||
        item.status === statusFilter

      return (
        matchesSearch &&
        matchesVerdict &&
        matchesStatus
      )
    })
  }, [
    search,
    verdictFilter,
    statusFilter,
    history,
  ])

  const totalAmount = history.reduce(
    (total, item) =>
      total + item.amount,
    0
  )

  const registeredCount =
    history.filter(
      (item) =>
        item.status === 'registered'
    ).length

  const suspiciousCount =
    history.filter(
      (item) =>
        item.verdict !== 'clean'
    ).length

  return (
    <div className="mx-auto max-w-7xl">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">

        <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-blue-300/60">
          Aktivitas Klaim
        </p>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              History
            </h1>

            <p className="mt-2 text-sm text-slate-300/60">
              Lihat seluruh nota yang pernah
              kamu analisis dan daftarkan.
            </p>
          </div>

          {/* Wallet */}

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.035] px-4 py-3 backdrop-blur-xl">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
              <Wallet size={16} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Wallet Aktif
              </p>

              <p className="mt-0.5 font-mono text-xs text-slate-300">
                {walletAddress
                  ? shortWallet(walletAddress)
                  : 'Tidak terhubung'}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          LOADING / ERROR
      ====================================================== */}

      {loading && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/25 px-4 py-3 text-sm text-slate-300 backdrop-blur-xl">
          <Loader2 size={17} className="animate-spin text-blue-300" />
          Memuat history klaim...
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300/10 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200 backdrop-blur-xl">
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0 text-red-300"
          />
          <p>{error}</p>
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          icon={ReceiptText}
          label="Total Klaim"
          value={history.length}
          suffix="nota"
        />

        <SummaryCard
          icon={Wallet}
          label="Total Nominal"
          value={formatCurrency(
            totalAmount
          )}
          suffix=""
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Tercatat On-chain"
          value={registeredCount}
          suffix="klaim"
          accent="green"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Perlu Ditinjau"
          value={suspiciousCount}
          suffix="nota"
          accent="amber"
        />

      </div>

      {/* =====================================================
          HISTORY PANEL
      ====================================================== */}

      <section className="glass-panel rounded-3xl p-5">

        {/* Toolbar */}

        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <h2 className="text-base font-semibold text-white">
              Riwayat Klaim
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredHistory.length}{' '}
              dari {history.length}{' '}
              klaim ditampilkan
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            {/* Search */}

            <div className="relative">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Cari nota atau toko..."
                className="h-10 w-full rounded-xl border border-white/[0.10] bg-white/[0.035] pl-9 pr-4 text-xs text-white outline-none backdrop-blur-xl transition placeholder:text-slate-600 focus:border-blue-300/30 focus:bg-white/[0.055] sm:w-56"
              />

            </div>

            {/* Verdict */}

            <div className="relative">

              <Filter
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <select
                value={verdictFilter}
                onChange={(event) =>
                  setVerdictFilter(
                    event.target.value
                  )
                }
                className="h-10 w-full appearance-none rounded-xl border border-white/[0.10] bg-slate-900/40 pl-9 pr-8 text-xs text-slate-300 outline-none backdrop-blur-xl sm:w-44"
              >
                <option value="all">
                  Semua hasil
                </option>

                <option value="clean">
                  Bersih
                </option>

                <option value="suspicious">
                  Perlu ditinjau
                </option>

                <option value="tampered">
                  Terindikasi perubahan
                </option>
              </select>

            </div>

            {/* Blockchain */}

            <div className="relative">

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="h-10 w-full appearance-none rounded-xl border border-white/[0.10] bg-slate-900/40 px-4 pr-8 text-xs text-slate-300 outline-none backdrop-blur-xl sm:w-40"
              >
                <option value="all">
                  Semua status
                </option>

                <option value="registered">
                  Terdaftar
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="rejected_duplicate">
                  Duplikat
                </option>
              </select>

            </div>

          </div>

        </div>

        {/* ===================================================
            TABLE
        ==================================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.018] backdrop-blur-xl">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.025]">

                  <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Nota
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Tanggal
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Toko
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Nominal
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Analisis
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Blockchain
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Detail
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredHistory.length === 0 ? (
                  <tr>

                    <td
                      colSpan="7"
                      className="px-5 py-20 text-center"
                    >

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-600">
                        <Search size={22} />
                      </div>

                      <p className="mt-4 text-sm font-medium text-slate-400">
                        Tidak ada klaim ditemukan
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Coba ubah pencarian atau
                        filter.
                      </p>

                    </td>

                  </tr>
                ) : (
                  filteredHistory.map(
                    (item) => (
                      <HistoryRow
                        key={item.id}
                        item={item}
                        onClick={() =>
                          setSelectedReceipt(
                            item
                          )
                        }
                      />
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>

      {/* =====================================================
          DETAIL MODAL
      ====================================================== */}

      {selectedReceipt && (
        <DetailModal
          receipt={selectedReceipt}
          onClose={() =>
            setSelectedReceipt(null)
          }
        />
      )}

    </div>
  )
}

/* ===========================================================
   SUMMARY CARD
=========================================================== */

function SummaryCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent = 'blue',
}) {
  const accentConfig = {
    blue: {
      bg: 'bg-blue-400/10',
      text: 'text-blue-300',
    },

    green: {
      bg: 'bg-emerald-400/10',
      text: 'text-emerald-300',
    },

    amber: {
      bg: 'bg-amber-400/10',
      text: 'text-amber-300',
    },
  }

  const config =
    accentConfig[accent]

  return (
    <div className="glass-panel rounded-2xl p-4">

      <div className="flex items-center justify-between">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.bg} ${config.text}`}
        >
          <Icon size={17} />
        </div>

      </div>

      <p className="mt-4 text-[11px] text-slate-600">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-1">

        <span className="text-xl font-semibold text-white">
          {value}
        </span>

        {suffix && (
          <span className="text-[10px] text-slate-600">
            {suffix}
          </span>
        )}

      </div>

    </div>
  )
}

/* ===========================================================
   HISTORY ROW
=========================================================== */

function HistoryRow({
  item,
  onClick,
}) {
  const verdict =
    getVerdictConfig(
      item.verdict
    )

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-b border-white/[0.055] transition hover:bg-white/[0.035]"
    >

      {/* Nota */}

      <td className="px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/[0.07] text-blue-300/80">
            <ReceiptText size={15} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-300">
              {item.receiptNumber}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-600">
              ID #{item.id}
            </p>
          </div>

        </div>

      </td>

      {/* Tanggal */}

      <td className="px-5 py-4">

        <div className="flex items-center gap-2 text-xs text-slate-400">

          <CalendarDays
            size={13}
            className="text-slate-600"
          />

          {formatDate(
            item.date
          )}

        </div>

      </td>

      {/* Toko */}

      <td className="px-5 py-4">

        <div className="flex items-center gap-2">

          <Store
            size={13}
            className="text-slate-600"
          />

          <span className="text-xs text-slate-400">
            {item.storeName}
          </span>

        </div>

      </td>

      {/* Nominal */}

      <td className="px-5 py-4 text-right">

        <span className="text-xs font-medium text-slate-300">
          {formatCurrency(
            item.amount
          )}
        </span>

      </td>

      {/* ELA */}

      <td className="px-5 py-4">

        <div className="flex items-center gap-2">

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${verdict.badge}`}
          >
            <verdict.icon size={11} />
            {verdict.label}
          </span>

        </div>

      </td>

      {/* Blockchain */}

      <td className="px-5 py-4">

            <BlockchainBadge
              status={
                item.status
              }
            />

      </td>

      {/* Detail */}

      <td className="px-5 py-4 text-right">

        <button
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-300"
        >
          <ArrowUpRight
            size={15}
          />
        </button>

      </td>

    </tr>
  )
}

/* ===========================================================
   BLOCKCHAIN BADGE
=========================================================== */

function BlockchainBadge({
  status,
}) {
  if (status === 'registered') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] text-emerald-300">
        <CheckCircle2 size={11} />
        Terdaftar
      </span>
    )
  }

  if (status === 'rejected_duplicate') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/10 bg-red-400/[0.06] px-2.5 py-1 text-[10px] text-red-300">
        <ShieldAlert size={11} />
        Duplikat
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/10 bg-amber-400/[0.06] px-2.5 py-1 text-[10px] text-amber-300">
      <Clock3 size={11} />
      Pending
    </span>
  )
}

/* ===========================================================
   DETAIL MODAL
=========================================================== */

function DetailModal({
  receipt,
  onClose,
}) {
  const verdict =
    getVerdictConfig(
      receipt.verdict
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >

      <div
        className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* Header */}

        <div className="flex items-start justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
              <ReceiptText size={19} />
            </div>

            <div>

              <h2 className="text-lg font-semibold text-white">
                Detail Klaim
              </h2>

              <p className="mt-0.5 text-xs text-slate-600">
                Receipt #{receipt.id}
              </p>

            </div>

          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
          >
            <X size={16} />
          </button>

        </div>

        {/* Basic Info */}

        <div className="mt-6 grid grid-cols-2 gap-3">

          <DetailItem
            label="Nomor Nota"
            value={
              receipt.receiptNumber
            }
          />

            <DetailItem
              label="Tanggal"
              value={formatDate(
                receipt.date
              )}
            />

          <DetailItem
            label="Nama Toko"
            value={receipt.storeName}
          />

          <DetailItem
            label="Nominal"
            value={formatCurrency(
              receipt.amount
            )}
          />

        </div>

        {/* Analysis */}

        <div className="mt-4 rounded-2xl border border-white/[0.10] bg-white/[0.025] p-4">

          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Hasil Analisis
          </p>

          <div className="mt-3 flex items-center justify-between">

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${verdict.badge}`}
            >
              <verdict.icon
                size={13}
              />

              {verdict.label}
            </div>

            <span className="text-sm font-semibold text-white">
              {receipt.tamperScore}
              <span className="text-xs font-normal text-slate-600">
                {' '}
                / 100
              </span>
            </span>

          </div>

        </div>

        {/* Blockchain */}

        <div className="mt-4 rounded-2xl border border-white/[0.10] bg-white/[0.025] p-4">

          <div className="flex items-center justify-between">

            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Status Blockchain
            </p>

            <BlockchainBadge
              status={
                receipt.status
              }
            />

          </div>

          {receipt.txHash && (
            <div className="mt-4">

              <p className="text-[10px] text-slate-600">
                Transaction Hash
              </p>

              <div className="mt-2 flex items-center gap-2">

                <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-slate-400">
                  {receipt.txHash}
                </p>

                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      receipt.txHash
                    )
                  }
                  className="shrink-0 text-slate-600 transition hover:text-slate-300"
                >
                  <Copy size={13} />
                </button>

              </div>

              <a
                href={`https://scan.bohr.life/tx/${receipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-blue-300 transition hover:text-blue-200"
              >
                Buka di Explorer
                <ExternalLink
                  size={11}
                />
              </a>

            </div>
          )}

        </div>

        {/* Hash */}

        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/[0.08] p-4">

          <div className="flex items-center justify-between">

            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Canonical Hash
            </p>

            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  receipt.canonicalHash
                )
              }
              className="text-slate-600 transition hover:text-slate-300"
            >
              <Copy size={13} />
            </button>

          </div>

          <p className="mt-2 break-all font-mono text-[9px] leading-5 text-slate-500">
            {receipt.canonicalHash}
          </p>

        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
        >
          Tutup
        </button>

      </div>

    </div>
  )
}

/* ===========================================================
   DETAIL ITEM
=========================================================== */

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">

      <p className="text-[10px] text-slate-600">
        {label}
      </p>

      <p className="mt-1.5 truncate text-xs font-medium text-slate-300">
        {value}
      </p>

    </div>
  )
}

/* ===========================================================
   VERDICT CONFIG
=========================================================== */

function getVerdictConfig(
  verdict
) {
  if (verdict === 'tampered') {
    return {
      label: 'Terindikasi Perubahan',
      icon: ShieldAlert,
      badge:
        'border-red-300/10 bg-red-400/[0.06] text-red-300',
    }
  }

  if (verdict === 'suspicious') {
    return {
      label: 'Perlu Ditinjau',
      icon: AlertTriangle,
      badge:
        'border-amber-300/10 bg-amber-400/[0.06] text-amber-300',
    }
  }

  return {
    label: 'Bersih',
    icon: ShieldCheckIcon,
    badge:
      'border-emerald-300/10 bg-emerald-400/[0.06] text-emerald-300',
  }
}

function ShieldCheckIcon({
  size = 14,
}) {
  return (
    <CheckCircle2 size={size} />
  )
}

/* ===========================================================
   HELPERS
=========================================================== */

function shortWallet(address) {
  if (!address) return ''

  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(
    'id-ID',
    {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }
  ).format(amount)
}

function formatDate(date) {
  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(new Date(date))
}

export default History