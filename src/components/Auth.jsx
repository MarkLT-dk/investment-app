import { useEffect, useState } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import logo from '../assets/logo.png'

export function useAuth() {
  const [user, setUser]       = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u ?? null)
      setLoading(false)
    })
    return unsub
  }, [])

  return { user, loading }
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function signOutUser() {
  return signOut(auth)
}

export function LoginScreen() {
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="" className="w-16 h-16 rounded-full border border-border object-cover mb-4 shadow-lg" />
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Stackfolio</h1>
          <p className="text-sm text-muted mt-1">Your personal portfolio tracker</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.24)]">
          <p className="text-sm text-ink2 text-center mb-5">Sign in to access your portfolio</p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-surface-2 hover:bg-surface text-sm font-semibold text-ink transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && <p className="text-xs text-red-400 text-center mt-3">{error}</p>}
        </div>

        <p className="text-xs text-muted text-center mt-6">Private — only you can access this app.</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
