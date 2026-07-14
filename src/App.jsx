import { useEffect, useRef, useState } from 'react'
import { ToastProvider } from './components/Toast'
import { ThemeProvider, ThemeToggle } from './components/Theme'
import NotificationCenter from './components/NotificationCenter'
import { signOutUser } from './components/Auth'
import { LogOut } from 'lucide-react'
import PortfolioPage from './pages/PortfolioPage'
import AnalyticsPage from './pages/AnalyticsPage'
import WatchlistPage from './pages/WatchlistPage'
import DiscoverPage from './pages/DiscoverPage'
import ResearchPage from './pages/ResearchPage'
import NewsPage from './pages/NewsPage'
import TransactionsPage from './pages/TransactionsPage'
import logo from './assets/logo.png'

const tabs = [
  { id: 'portfolio',    label: 'Portfolio'     },
  { id: 'analytics',   label: 'Analytics'     },
  { id: 'watchlist',   label: 'Watchlist'     },
  { id: 'discover',    label: 'Discover'      },
  { id: 'research',    label: 'Research'      },
  { id: 'news',        label: 'News'          },
  { id: 'transactions', label: 'Transactions' },
]

const pages = {
  portfolio:    <PortfolioPage />,
  analytics:    <AnalyticsPage />,
  watchlist:    <WatchlistPage />,
  discover:     <DiscoverPage />,
  research:     <ResearchPage />,
  news:         <NewsPage />,
  transactions: <TransactionsPage />,
}

function TabBar({ active, onChange }) {
  const containerRef = useRef(null)
  const btnRefs = useRef({})
  const [pill, setPill] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = btnRefs.current[active]
    const container = containerRef.current
    if (el && container) {
      const cRect = container.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      setPill({ left: eRect.left - cRect.left + container.scrollLeft, width: eRect.width })
    }
  }, [active])

  return (
    <div ref={containerRef} className="relative flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
      <div
        className="absolute bottom-0 h-0.5 bg-blue-400 rounded-full transition-all duration-300 ease-out"
        style={{ left: pill.left, width: pill.width }}
      />
      {tabs.map(tab => (
        <button
          key={tab.id}
          ref={el => { btnRefs.current[tab.id] = el }}
          onClick={() => onChange(tab.id)}
          className={`relative px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 rounded-t-md
            ${active === tab.id
              ? 'text-blue-400'
              : 'text-muted hover:text-ink hover:bg-surface-2'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [active, setActive] = useState('portfolio')

  return (
    <ThemeProvider>
    <ToastProvider>
    <div className="min-h-screen bg-background text-ink">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="" className="w-8 h-8 rounded-full border border-border object-cover flex-shrink-0" />
              <span className="font-extrabold text-ink text-base tracking-tight">
                Stackfolio
              </span>
              <span className="hidden md:inline text-xs text-muted font-normal border-l border-border pl-2.5 ml-0.5">
                Portfolio tracker
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted hidden lg:block tabular-nums mr-1.5">
                {new Date().toLocaleDateString('en-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <ThemeToggle />
              <NotificationCenter />
              <button
                onClick={signOutUser}
                aria-label="Sign out"
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-ink hover:bg-surface-2 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Tabs — scrollable on mobile, sliding active indicator */}
          <TabBar active={active} onChange={setActive} />
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div key={active} className="animate-page-fade">
          {pages[active]}
        </div>
      </main>
    </div>
    </ToastProvider>
    </ThemeProvider>
  )
}
