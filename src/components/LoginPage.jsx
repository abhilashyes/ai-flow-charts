import { useState } from 'react'
import { Share2, LogIn, Loader2 } from 'lucide-react'

/**
 * Sample login page. The demo sign-in has no password — it's a placeholder until
 * Microsoft Entra is wired in (see server/auth/entraProvider.js). The "Sign in
 * with Microsoft" button marks that seam and is disabled for now.
 */
export default function LoginPage({ onSignIn }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const signIn = async () => {
    setBusy(true)
    setError('')
    try {
      await onSignIn()
    } catch {
      setError('Sign-in failed. Is the API server running?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <Share2 size={22} />
          </div>
          <h1 className="text-[18px] font-bold text-slate-800">Value Chain Mapper</h1>
          <p className="text-[13px] text-slate-400">Sign in to continue</p>
        </div>

        <button
          onClick={signIn}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Sign in (demo)
        </button>

        <button
          disabled
          title="Configure Microsoft Entra to enable (see SETUP.md)"
          className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] font-semibold text-slate-400"
        >
          <MicrosoftLogo /> Sign in with Microsoft
          <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">SOON</span>
        </button>

        {error && <p className="mt-3 text-center text-[12px] font-medium text-red-500">{error}</p>}

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
          Demo sign-in uses a placeholder account. Wire Microsoft Entra in
          <code className="mx-1 rounded bg-slate-100 px-1">server/auth/entraProvider.js</code>
          to enable org sign-in.
        </p>
      </div>
    </div>
  )
}

function MicrosoftLogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
