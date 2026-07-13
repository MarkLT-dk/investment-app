import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useAuth, LoginScreen, signOutUser } from './components/Auth.jsx'

const ALLOWED_UID = 'q2MkCiCBVJedEW69vjC4gcZmoKe2'

function Root() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-border border-t-blue-400 animate-spin" />
    </div>
  )
  if (!user) return <LoginScreen />
  if (user.uid !== ALLOWED_UID) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-lg font-bold text-ink mb-2">Access denied</p>
        <p className="text-sm text-muted mb-4">This app is private.</p>
        <button onClick={signOutUser} className="px-4 py-2 rounded-lg bg-surface border border-border text-sm text-muted hover:text-ink transition-colors">
          Sign out
        </button>
      </div>
    </div>
  )
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
