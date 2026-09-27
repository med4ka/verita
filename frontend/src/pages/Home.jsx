import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileImage,
  FileSearch,
  Loader2,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Wallet,
  X,
  ExternalLink,
} from 'lucide-react'

const DEMO_EXPLORER_URL = 'https://scan.bohr.life'

function Home() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const [wallet, setWallet] = useState(null)

  const [form, setForm] = useState({
    receiptNumber: '',
    amount: '',
    receiptDate: '',
    storeName: '',
  })

  const [analysis, setAnalysis] = useState(null)
  const [duplicate, setDuplicate] = useState(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [registering, setRegistering] = useState(false)

  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState(null)

  const [showSuccess, setShowSuccess] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)

  /* =========================================================
     FILE UPLOAD
  ========================================================= */

  const handleFile = (selectedFile) => {
    if (!selectedFile) return

    setError('')

    const allowedTypes = [
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        'Format file harus JPG atau PNG.'
      )
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(
        'Ukuran file maksimal 5 MB.'
      )
      return
    }

    setFile(selectedFile)

    const objectUrl =
      URL.createObjectURL(selectedFile)

    setPreview(objectUrl)

    setAnalysis(null)
    setDuplicate(null)
    setTxHash(null)
  }

  const handleDrop = (event) => {
    event.preventDefault()

    const droppedFile =
      event.dataTransfer.files?.[0]

    handleFile(droppedFile)
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    setAnalysis(null)
    setDuplicate(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /* =========================================================
     FORM
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
  }

  /* =========================================================
     WALLET
     
     Hanya UI connection.
     Smart contract belum digunakan.
  ========================================================= */

  const connectWallet = async () => {
    setError('')

    if (!window.ethereum) {
      setError(
        'MetaMask belum terpasang di browser ini.'
      )
      return
    }

    try {
      const accounts =
        await window.ethereum.request({
          method: 'eth_requestAccounts',
        })

      if (accounts?.[0]) {
        setWallet(accounts[0])
      }
    } catch (err) {
      if (err?.code === 4001) {
        setError(
          'Permintaan koneksi wallet ditolak.'
        )
      } else {
        setError(
          'Gagal menghubungkan wallet.'
        )
      }
    }
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!wallet) {
      return 'Hubungkan wallet terlebih dahulu.'
    }

    if (!file) {
      return 'Silakan upload nota terlebih dahulu.'
    }

    if (!form.receiptNumber.trim()) {
      return 'Nomor nota wajib diisi.'
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      return 'Nominal harus lebih dari 0.'
    }

    if (!form.receiptDate) {
      return 'Tanggal nota wajib diisi.'
    }

    if (!form.storeName.trim()) {
      return 'Nama toko wajib diisi.'
    }

    return null
  }

  /* =========================================================
     ANALYZE
     
     SIMULASI UI
     Nanti diganti POST /api/analyze-receipt.
  ========================================================= */

  const handleAnalyze = async () => {
    setError('')
    setAnalysis(null)
    setDuplicate(null)
    setTxHash(null)

    const validationError =
      validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setAnalyzing(true)

    await new Promise((resolve) =>
      setTimeout(resolve, 1400)
    )

    /*
     * Demo result.
     * Nanti data ini berasal dari backend:
     * tamperScore
     * verdict
     * canonicalHash
     * receiptId
     */

    const demoScore = 18

    const demoAnalysis = {
      receiptId: 104,
      tamperScore: demoScore,
      verdict: 'clean',
      canonicalHash:
        '0x8f3d91b9d0f7e5e1c4f9a72b8c6e2a1d9f0c3b5a7e8d1f2c4b6a8e0d2f4c6a8',
      onchainStatus: 'pending',
    }

    setAnalysis(demoAnalysis)

    /*
     * Demo duplicate result.
     * false = belum pernah diklaim.
     */
    setDuplicate({
      exists: false,
      hash: demoAnalysis.canonicalHash,
    })

    setAnalyzing(false)
  }

  /* =========================================================
     REGISTER CLAIM
     
     SIMULASI UI
     Nanti diganti registerClaim() via MetaMask.
  ========================================================= */

  const handleRegisterClaim = async () => {
    setError('')

    if (!wallet) {
      setError(
        'Hubungkan wallet terlebih dahulu.'
      )
      return
    }

    if (!analysis) {
      setError(
        'Analisis nota terlebih dahulu.'
      )
      return
    }

    if (duplicate?.exists) {
      setShowDuplicate(true)
      return
    }

    setRegistering(true)

    await new Promise((resolve) =>
      setTimeout(resolve, 1800)
    )

    const demoTx =
      '0x71b8e2a6d4f9c3e1a7b5d8f2c6e0a4b9d3f7c1e5a8b2d6f0c4e9a3b7d1f5a9'

    setTxHash(demoTx)

    setRegistering(false)

    setShowSuccess(true)
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  const shortWallet = (address) => {
    if (!address) return ''

    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`
  }

  const formatAmount = (amount) => {
    if (!amount) return ''

    return new Intl.NumberFormat(
      'id-ID'
    ).format(Number(amount))
  }

  const verdictConfig =
    getVerdictConfig(
      analysis?.verdict
    )

  return (
    <div className="mx-auto max-w-7xl">

      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-blue-300/60">
            Verifikasi Klaim Digital
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Analisis Nota
          </h1>

          <p className="mt-2 text-sm text-slate-300/60">
            Periksa indikasi perubahan gambar dan
            verifikasi klaim sebelum dicatat.
          </p>
        </div>

        {/* Wallet */}

        <button
          onClick={connectWallet}
          className={`flex items-center gap-3 self-start rounded-xl border px-4 py-3 text-sm transition lg:self-auto ${
            wallet
              ? 'border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-200'
              : 'border-white/10 bg-slate-950/55 text-slate-300 hover:bg-white/[0.06]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              wallet
                ? 'bg-emerald-400/10 text-emerald-300'
                : 'bg-blue-400/10 text-blue-300'
            }`}
          >
            <Wallet size={16} />
          </div>

          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              {wallet
                ? 'Wallet Terhubung'
                : 'Wallet'}
            </p>

            <p className="mt-0.5 text-xs font-medium">
              {wallet
                ? shortWallet(wallet)
                : 'Connect Wallet'}
            </p>
          </div>
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300/10 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200 backdrop-blur-xl">

          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0 text-red-300"
          />

          <p>{error}</p>

          <button
            onClick={() => setError('')}
            className="ml-auto text-red-300/60 transition hover:text-red-200"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">

        {/* ===================================================
            LEFT PANEL
        ==================================================== */}

      <section className="glass-panel rounded-3xl p-6">

          {/* Header */}

          <div className="mb-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                <Upload size={19} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Upload Nota
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Upload gambar nota untuk dianalisis.
                </p>
              </div>

            </div>

          </div>

          {/* =================================================
              UPLOAD AREA
          ================================================== */}

          {!file ? (
            <div
              onClick={() =>
                fileInputRef.current?.click()
              }
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={handleDrop}
              className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/15 bg-slate-900/25 px-6 text-center backdrop-blur-xl transition hover:border-blue-300/25 hover:bg-blue-400/[0.05]"
            >

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(event) =>
                  handleFile(
                    event.target.files?.[0]
                  )
                }
              />

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-xl text-blue-300 transition group-hover:border-blue-300/20 group-hover:bg-blue-400/[0.06]">
                <Upload size={25} />
              </div>

              <p className="text-sm font-semibold text-slate-200">
                Klik untuk memilih nota
              </p>

              <p className="mt-1 text-sm text-slate-500">
                atau drag & drop file di sini
              </p>

              <span className="mt-5 rounded-full border border-white/10 bg-slate-900/30 backdrop-blur-xl px-3 py-1.5 text-[11px] text-slate-500">
                JPG / PNG · Maks. 5 MB
              </span>

            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

              <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-black/10">

                <img
                  src={preview}
                  alt="Preview nota"
                  className="max-h-[340px] max-w-full object-contain"
                />

                <button
                  onClick={removeFile}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-950/75 text-slate-300 backdrop-blur-xl transition hover:bg-red-400/10 hover:text-red-300"
                >
                  <X size={16} />
                </button>

              </div>

              <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300">
                  <FileImage size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-300">
                    {file.name}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)}{' '}
                    MB
                  </p>
                </div>

                <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                  Siap dianalisis
                </span>

              </div>

            </div>
          )}

          {/* =================================================
              FORM
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <InputField
              label="Nomor Nota"
              name="receiptNumber"
              value={form.receiptNumber}
              onChange={handleChange}
              placeholder="Contoh: INV-2026-001"
            />

            <InputField
              label="Nominal"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="Contoh: 250000"
            />

            <InputField
              label="Tanggal Nota"
              name="receiptDate"
              type="date"
              value={form.receiptDate}
              onChange={handleChange}
            />

            <InputField
              label="Nama Toko"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              placeholder="Contoh: Toko ABC"
            />

          </div>

          {/* =================================================
              ANALYZE BUTTON
          ================================================== */}

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Menganalisis Nota...
              </>
            ) : (
              <>
                <ScanSearch size={17} />
                Analisis Nota
              </>
            )}
          </button>

          <p className="mt-3 text-center text-[10px] text-slate-600">
            Analisis menggunakan indikator forensik
            gambar untuk mendeteksi perubahan.
          </p>

        </section>

        {/* ===================================================
            RIGHT PANEL
        ==================================================== */}

        <section className="glass-panel rounded-3xl p-6">

          {/* Header */}

          <div className="mb-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                <FileSearch size={19} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Hasil Analisis
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Hasil pemeriksaan indikasi perubahan gambar.
                </p>
              </div>

            </div>

          </div>

          {!analysis ? (
            <div className="flex min-h-[560px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/25 backdrop-blur-xl px-8 text-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-xl text-slate-600">
                <ScanSearch size={27} />
              </div>

              <h3 className="text-sm font-medium text-slate-300">
                Belum ada hasil analisis
              </h3>

              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                Upload nota dan lengkapi datanya
                untuk menjalankan analisis.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {/* Score */}

              <div className="rounded-2xl border border-white/10 bg-slate-900/25 backdrop-blur-xl p-5">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs text-slate-500">
                      ELA Tamper Score
                    </p>

                    <div className="mt-2 flex items-end gap-2">

                      <span className="text-4xl font-semibold tracking-tight text-white">
                        {analysis.tamperScore}
                      </span>

                      <span className="pb-1 text-sm text-slate-600">
                        / 100
                      </span>

                    </div>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${verdictConfig.iconBg} ${verdictConfig.iconColor}`}
                  >
                    <verdictConfig.icon size={21} />
                  </div>

                </div>

                {/* Progress */}

                <div className="mt-5">

                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">

                    <div
                      className={`h-full rounded-full transition-all duration-700 ${verdictConfig.bar}`}
                      style={{
                        width: `${analysis.tamperScore}%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                    <span>Bersih</span>
                    <span>Perlu Ditinjau</span>
                    <span>Perubahan</span>
                  </div>

                </div>

              </div>

              {/* Verdict */}

              <div
                className={`rounded-2xl border p-5 ${verdictConfig.container}`}
              >

                <div className="flex items-start gap-3">

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${verdictConfig.iconBg} ${verdictConfig.iconColor}`}
                  >
                    <verdictConfig.icon size={18} />
                  </div>

                  <div>

                    <p
                      className={`text-sm font-semibold ${verdictConfig.text}`}
                    >
                      {verdictConfig.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {verdictConfig.description}
                    </p>

                  </div>

                </div>

              </div>

              {/* Duplicate */}

              {duplicate && (
                <div
                  className={`rounded-2xl border p-5 ${
                    duplicate.exists
                      ? 'border-red-300/15 bg-red-400/[0.05]'
                      : 'border-emerald-300/10 bg-emerald-400/[0.035]'
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        duplicate.exists
                          ? 'bg-red-400/10 text-red-300'
                          : 'bg-emerald-400/10 text-emerald-300'
                      }`}
                    >
                      {duplicate.exists ? (
                        <ShieldAlert size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`text-sm font-semibold ${
                          duplicate.exists
                            ? 'text-red-200'
                            : 'text-emerald-200'
                        }`}
                      >
                        {duplicate.exists
                          ? 'Nota Sudah Pernah Diklaim'
                          : 'Belum Pernah Diklaim'}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {duplicate.exists
                          ? 'Nota dengan fingerprint yang sama sudah tercatat sebelumnya.'
                          : 'Tidak ditemukan klaim dengan fingerprint yang sama.'}
                      </p>

                      {duplicate.exists &&
                        duplicate.claimant && (
                          <p className="mt-3 font-mono text-[10px] text-red-300/70">
                            {shortWallet(
                              duplicate.claimant
                            )}
                          </p>
                        )}

                    </div>

                  </div>

                </div>
              )}

              {/* Register */}

              <button
                onClick={
                  duplicate?.exists
                    ? () =>
                        setShowDuplicate(true)
                    : handleRegisterClaim
                }
                disabled={
                  registering ||
                  !duplicate
                }
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                  duplicate?.exists
                    ? 'border border-red-300/15 bg-red-400/10 text-red-200 hover:bg-red-400/15'
                    : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-400'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {registering ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Menunggu Konfirmasi...
                  </>
                ) : duplicate?.exists ? (
                  <>
                    <ShieldAlert size={17} />
                    Nota Sudah Diklaim
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Daftarkan ke Blockchain
                  </>
                )}
              </button>

              {/* Hash */}

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Canonical Hash
                  </p>

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        analysis.canonicalHash
                      )
                    }
                    className="text-slate-600 transition hover:text-slate-300"
                    title="Copy hash"
                  >
                    <Copy size={13} />
                  </button>

                </div>

                <p className="break-all font-mono text-[10px] leading-5 text-slate-500">
                  {analysis.canonicalHash}
                </p>

              </div>

              <p className="text-center text-[10px] leading-4 text-slate-600">
                Hasil ELA merupakan indikator forensik
                gambar dan bukan bukti mutlak adanya
                manipulasi.
              </p>

            </div>
          )}

        </section>

      </div>

      {/* =====================================================
          SUCCESS MODAL
      ====================================================== */}

      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={() =>
            setShowSuccess(false)
          }
        >

          <div
            className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/15 bg-slate-900/25 px-6 text-center backdrop-blur-xl transition hover:border-blue-300/25 hover:bg-blue-400/[0.05]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <CheckCircle2 size={30} />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-white">
                Klaim Berhasil Dicatat
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Klaim berhasil diproses dan
                transaction hash sudah tersedia.
              </p>

            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Transaction Hash
              </p>

              <p className="mt-2 break-all font-mono text-[10px] leading-5 text-slate-400">
                {txHash}
              </p>

            </div>

            <div className="mt-5 flex gap-3">

              <a
                href={`${DEMO_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Buka Explorer
                <ExternalLink size={14} />
              </a>

              <button
                onClick={() =>
                  setShowSuccess(false)
                }
                className="flex-1 rounded-xl bg-blue-500 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                Selesai
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          DUPLICATE MODAL
      ====================================================== */}

      {showDuplicate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={() =>
            setShowDuplicate(false)
          }
        >

          <div
            className="w-full max-w-md rounded-3xl border border-red-300/15 bg-slate-950/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <ShieldAlert size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Nota Sudah Pernah Diklaim
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Nota dengan fingerprint yang sama
                  tidak dapat didaftarkan kembali.
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Wallet Klaim Pertama
              </p>

              <p className="mt-2 break-all font-mono text-xs text-slate-300">
                {duplicate?.claimant ||
                  '0x742d...f44e'}
              </p>

              {duplicate?.timestamp && (
                <p className="mt-2 text-[11px] text-slate-600">
                  {new Date(
                    duplicate.timestamp * 1000
                  ).toLocaleString(
                    'id-ID'
                  )}
                </p>
              )}

            </div>

            <button
              onClick={() =>
                setShowDuplicate(false)
              }
              className="mt-5 w-full rounded-xl bg-white/[0.06] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
            >
              Tutup
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-900/30 backdrop-blur-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:bg-white/[0.055] focus:ring-2 focus:ring-blue-500/10"
      />

    </label>
  )
}

/* =========================================================
   VERDICT CONFIG
========================================================= */

function getVerdictConfig(verdict) {
  if (verdict === 'tampered') {
    return {
      title: 'Terindikasi Perubahan',
      description:
        'Ditemukan indikasi perubahan pada struktur gambar nota. Hasil ini perlu ditinjau lebih lanjut.',
      icon: ShieldAlert,
      iconBg: 'bg-red-400/10',
      iconColor: 'text-red-300',
      text: 'text-red-200',
      container:
        'border-red-300/15 bg-red-400/[0.045]',
      bar: 'bg-red-400',
    }
  }

  if (verdict === 'suspicious') {
    return {
      title: 'Perlu Ditinjau',
      description:
        'Terdapat beberapa indikasi yang perlu diperiksa lebih lanjut sebelum klaim dicatat.',
      icon: AlertTriangle,
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-300',
      text: 'text-amber-200',
      container:
        'border-amber-300/15 bg-amber-400/[0.045]',
      bar: 'bg-amber-400',
    }
  }

  return {
    title: 'Nota Terindikasi Bersih',
    description:
      'Tidak ditemukan indikasi perubahan yang signifikan berdasarkan analisis gambar.',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-300',
    text: 'text-emerald-200',
    container:
      'border-emerald-300/15 bg-emerald-400/[0.045]',
    bar: 'bg-emerald-400',
  }
}

export default Home