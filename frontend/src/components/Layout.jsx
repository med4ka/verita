import { useEffect, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, History, Search, ExternalLink } from 'lucide-react'

function Layout() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    let direction = 1
    let animationFrame

    const speed = 0.01

    const animate = () => {
      if (video.readyState >= 2 && video.duration) {
        video.currentTime += speed * direction

        if (video.currentTime >= video.duration) {
          video.currentTime = video.duration
          direction = -1
        }

        if (video.currentTime <= 0) {
          video.currentTime = 0
          direction = 1
        }
      }

      animationFrame = requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      animationFrame = requestAnimationFrame(animate)
    }

    video.addEventListener('loadedmetadata', startAnimation)

    if (video.readyState >= 1) {
      startAnimation()
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      video.removeEventListener('loadedmetadata', startAnimation)
    }
  }, [])

  return (
    <div className="min-h-screen text-white">

      {/* ==================== VIDEO BACKGROUND ==================== */}
      <video
        ref={videoRef}
        className="fixed inset-0 -z-20 h-full w-full object-cover"
        src="/vividmotion.mp4"
        muted
        playsInline
        preload="auto"
      />

      {/* ==================== DARK OVERLAY ==================== */}
      <div className="fixed inset-0 -z-10 bg-slate-950/25" />

      {/* ==================== SIDEBAR ==================== */}
      <aside className="fixed left-4 top-4 bottom-4 z-20 w-64 rounded-3xl border border-white/10 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-2xl">

        {/* Logo */}
        <div className="border-b border-white/10 pb-5">
          <h1 className="text-2xl font-bold tracking-tight">
            VERITA
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Digital Claim Verification
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-2">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? 'border border-blue-400/40 bg-blue-500/20 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Home size={18} />
            Home
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? 'border border-blue-400/40 bg-blue-500/20 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <History size={18} />
            History
          </NavLink>

          <NavLink
            to="/explorer"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                isActive
                  ? 'border border-blue-400/40 bg-blue-500/20 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Search size={18} />
            Public Explorer
          </NavLink>

        </nav>

        {/* Footer */}
        <div className="absolute bottom-5 left-5 right-5 border-t border-white/10 pt-4">
          <p className="text-xs text-slate-400">
            <img
              src="/bot_logo.jpeg"
              alt="BOT Chain"
              className="mr-1.5 inline h-5 w-5"
            />
            Powered by{' '}
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 transition hover:text-white hover:underline"
            >
              BOT Chain
            </a>
          </p>

          <a
            href="https://scan.botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
          >
            Explorer
            <ExternalLink size={11} />
          </a>
        </div>

      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="min-h-screen py-6 pl-72 pr-6">
        <Outlet />
      </main>

    </div>
  )
}

export default Layout