import { useEffect, useRef, useState } from 'react'
import { signals } from '../data/mockData'
import { Bell, Zap, Calendar, TrendingDown, X } from 'lucide-react'

const icons = { price: Zap, earnings: Calendar, rebalance: TrendingDown }
const dotColors = { buy: 'bg-green-400', info: 'bg-blue-400', warn: 'bg-yellow-400' }
const iconColors = { buy: 'text-green-400', info: 'text-blue-400', warn: 'text-yellow-400' }

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState([])
  const ref = useRef(null)

  const visible = signals.filter((_, i) => !dismissed.includes(i))
  const dotColorClass = visible.some(s => s.severity === 'warn')
    ? 'bg-yellow-400'
    : visible.some(s => s.severity === 'buy')
    ? 'bg-green-400'
    : 'bg-blue-500'

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${open ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink hover:bg-surface-2'}`}
      >
        <Bell size={17} />
        {visible.length > 0 && (
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-surface ${dotColorClass}`} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface border border-border rounded-lg shadow-xl z-20 animate-pop-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-ink">Alerts</p>
            {visible.length > 0 && (
              <button
                onClick={() => setDismissed(signals.map((_, i) => i))}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 && (
              <p className="text-xs text-muted text-center py-8 px-4">You're all caught up — no alerts right now.</p>
            )}
            {signals.map((s, i) => {
              if (dismissed.includes(i)) return null
              const Icon = icons[s.type] || Zap
              return (
                <div key={i} className="group flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColors[s.severity]}`} />
                  <Icon size={13} className={`mt-0.5 flex-shrink-0 ${iconColors[s.severity]}`} />
                  <p className="text-xs text-ink2 flex-1 leading-relaxed">{s.message}</p>
                  <button
                    onClick={() => setDismissed(d => [...d, i])}
                    aria-label="Dismiss"
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
