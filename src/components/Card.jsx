import { useState, useEffect, useRef } from 'react'

export function Card({ children, className = '', interactive = false }) {
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.02] ${interactive ? 'transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.32)] hover:border-border' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
      {children}
    </p>
  )
}

export function PageTitle({ children, sub }) {
  return (
    <div className="mb-1">
      <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export function StatCard({ label, value, sub, subColor = 'text-muted', icon: Icon, iconColor = 'text-blue-400', iconBg = 'bg-blue-950/60', spark, sparkColor = '#3b82f6' }) {
  return (
    <Card interactive>
      <div className="flex items-start justify-between gap-2 mb-3">
        <CardTitle>{label}</CardTitle>
        {Icon && (
          <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={12} className={iconColor} />
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-ink tabular-nums tracking-tight">{value}</p>
      <div className="flex items-end justify-between gap-2 mt-1.5">
        {sub && <p className={`text-xs tabular-nums ${subColor}`}>{sub}</p>}
        {spark && <MiniSparkline data={spark} color={sparkColor} width={64} height={22} />}
      </div>
    </Card>
  )
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-950 text-blue-300',
    green:  'bg-green-950 text-green-400',
    red:    'bg-red-950 text-red-400',
    yellow: 'bg-yellow-950 text-yellow-400',
    purple: 'bg-purple-950 text-purple-300',
    gray:   'bg-surface-2 text-muted',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${colors[color]}`}>
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mb-3">
          <Icon size={16} className="text-muted" />
        </div>
      )}
      <p className="text-sm font-medium text-ink2">{title}</p>
      {sub && <p className="text-xs text-muted mt-1 max-w-xs">{sub}</p>}
    </div>
  )
}

export function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '', locale = 'da-DK', duration = 700 }) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) return
    const from = prevValue.current
    const to = value
    const start = performance.now()
    let raf
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else prevValue.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (typeof value !== 'number' || Number.isNaN(value)) return <>{prefix}{value ?? '—'}{suffix}</>

  return (
    <>{prefix}{display.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
  )
}

export function MiniSparkline({ data, color = '#3b82f6', width = 100, height = 32 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polygon points={areaPoints} fill={color} fillOpacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function InsightCallout({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-blue-900/50 bg-blue-950/20">
      <span className="w-6 h-6 rounded-md bg-blue-950/70 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={12} className="text-blue-300" />
      </span>
      <p className="text-xs text-ink2 leading-relaxed">{children}</p>
    </div>
  )
}

export function pnlColor(val) {
  if (val > 0) return 'text-green-400'
  if (val < 0) return 'text-red-400'
  return 'text-muted'
}

export function pnlSign(val) {
  return val > 0 ? '+' : ''
}
