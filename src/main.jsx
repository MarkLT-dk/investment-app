import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useAuth, LoginScreen } from './components/Auth.jsx'

function Root() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user)   return <LoginScreen />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
