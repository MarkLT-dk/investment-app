import { useEffect, useRef, useState } from 'react'
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardTitle, PageTitle, StatCard, Badge, InsightCallout, AnimatedNumber, pnlColor, pnlSign } from '../components/Card'
import { positions, portfolioStats, portfolioHistory, returnHistory, distribution } from '../data/mockData'
import { Wallet, TrendingUp, TrendingDown, ShieldAlert, SlidersHorizontal, Sparkles, Star } from 'lucide-react'

const fmt = (n) => n?.toLocaleString('da-DK', { maximumFractionDigits: 0 }) ?? '—'
const fmtPct = (n) => n != null ? `${pnlSign(n)}${n.toFixed(1)}%` : '—'

const PERIODS = [
  { label: '1M', weeks: 4 },
  { label: '3M', weeks: 13 },
  { label: '6M', weeks: 26 },
  { label: '1Y', weeks: 52 },
  { label: 'All', weeks: 999 },
]

function ReturnRow({ label, d, m, ytd, y, bold }) {
  const cls = bold ? 'font-semibold text-ink' : 'text-ink2'
  return (
    <tr className={`border-b border-border last:border-0 ${bold ? 'bg-surface-2' : ''}`}>
      <td className={`py-2 px-3 text-sm ${cls}`}>{label}</td>
      {[d, m, ytd, y].map((v, i) => (
        <td key={i} className={`py-2 px-3 text-sm text-center ${pnlColor(v)}`}>{fmtPct(v)}</td>
      ))}
    </tr>
  )
}

const CustomTooltip = ({ active, payload, label, pctMode }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-medium" style={{ color: p.color }}>
          {p.name}: {pctMode || (typeof p.value === 'number' && Math.abs(p.value) < 2)
            ? fmtPct(p.value * 100)
            : fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function PeriodSelector({ selected, onChange }) {
  return (
    <div className="flex gap-1">
      {PERIODS.map(p => (
        <button
          key={p.label}
          onClick={() => onChange(p)}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            selected.label === p.label
              ? 'bg-blue-600 text-white'
              : 'bg-surface-2 text-muted hover:text-ink'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// Subtle simulated "live" jitter around a base value — cosmetic only, resets on unmount.
function useLiveJitter(base, { amplitude = 0.0009, intervalMs = 3200 } = {}) {
  const [state, setState] = useState({ value: base, flash: null, tick: 0 })
  const prevRef = useRef(base)

  useEffect(() => {
    prevRef.current = base
    setState({ value: base, flash: null, tick: 0 })
    const id = setInterval(() => {
      setState(s => {
        const jitter = (Math.random() - 0.5) * 2 * amplitude
        const next = base * (1 + jitter)
        const flash = next > prevRef.current ? 'up' : next < prevRef.current ? 'down' : null
        prevRef.current = next
        return { value: next, flash, tick: s.tick + 1 }
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [base, amplitude, intervalMs])

  return state
}

function LiveValue({ live, children }) {
  return (
    <span key={live.tick} className={live.flash === 'up' ? 'flash-up' : live.flash === 'down' ? 'flash-down' : ''}>
      {children}
    </span>
  )
}

const KPI_OPTIONS = [
  { key: 'value',    label: 'Portfolio Value' },
  { key: 'today',    label: 'Today' },
  { key: 'drawdown', label: 'Max Drawdown' },
  { key: 'return1y', label: '1Y Return' },
]

function useKpiVisibility() {
  const [visible, setVisible] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('portfolioKpiVisibility'))
      if (saved) return saved
    } catch {}
    return { value: true, today: true, drawdown: true, return1y: true }
  })
  useEffect(() => {
    localStorage.setItem('portfolioKpiVisibility', JSON.stringify(visible))
  }, [visible])
  return [visible, setVisible]
}

function KpiSettings({ visible, setVisible }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Customize stats"
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${open ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink hover:bg-surface-2'}`}
      >
        <SlidersHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-lg shadow-xl z-20 animate-pop-in p-2">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider px-2 py-1">Show stats</p>
          {KPI_OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={visible[opt.key]}
                onChange={() => setVisible(v => ({ ...v, [opt.key]: !v[opt.key] }))}
                className="accent-blue-500"
              />
              <span className="text-xs text-ink2">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PortfolioPage() {
  const [period, setPeriod] = useState(PERIODS[2]) // default 6M
  const s = portfolioStats
  const [visibleKpi, setVisibleKpi] = useKpiVisibility()
  const [pinned, setPinned] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pinnedHoldings')) || []) } catch { return new Set() }
  })
  const togglePin = (ticker) => {
    setPinned(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      localStorage.setItem('pinnedHoldings', JSON.stringify([...next]))
      return next
    })
  }

  const sortByPinned = (rows) => [...rows].sort((a, b) => (pinned.has(b.ticker) ? 1 : 0) - (pinned.has(a.ticker) ? 1 : 0))
  const core = sortByPinned(positions.filter(p => p.category === 'Core'))
  const satellite = sortByPinned(positions.filter(p => p.category === 'Satellite'))

  const sliceHistory = (data) => data.slice(Math.max(0, data.length - period.weeks))

  const filteredValue = sliceHistory(portfolioHistory)
  const filteredReturn = sliceHistory(returnHistory)
  const sparkValues = portfolioHistory.slice(-14).map(p => p.value)

  const liveValue = useLiveJitter(s.totalValueDkk)
  const liveToday = useLiveJitter(s.return1d, { amplitude: 0.02 })

  // Tick interval so labels don't crowd
  const tickInterval = filteredValue.length <= 8 ? 0
    : filteredValue.length <= 16 ? 1
    : Math.floor(filteredValue.length / 6)

  // Auto-generated insight: biggest driver of over/under-performance vs market
  const worstPerformer = [...positions].sort((a, b) => a.return1y - b.return1y)[0]
  const bestPerformer = [...positions].sort((a, b) => b.return1y - a.return1y)[0]
  const vsMarket1y = s.return1y - s.marketReturn1y

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="Your holdings, performance, and allocation">Portfolio</PageTitle>

      {/* KPI row */}
      <div className="flex items-center justify-end -mb-1">
        <KpiSettings visible={visibleKpi} setVisible={setVisibleKpi} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {visibleKpi.value && (
          <StatCard
            label="Portfolio Value"
            icon={Wallet}
            spark={sparkValues}
            value={<LiveValue live={liveValue}><AnimatedNumber value={Math.round(liveValue.value)} suffix=" DKK" /></LiveValue>}
            sub={`Unrealised: ${pnlSign(s.totalUnrealizedDkk)}${fmt(s.totalUnrealizedDkk)} DKK`}
            subColor={pnlColor(s.totalUnrealizedDkk)}
          />
        )}
        {visibleKpi.today && (
          <StatCard
            label="Today"
            icon={s.return1d >= 0 ? TrendingUp : TrendingDown}
            iconColor={s.return1d >= 0 ? 'text-green-400' : 'text-red-400'}
            iconBg={s.return1d >= 0 ? 'bg-green-950/60' : 'bg-red-950/60'}
            value={<LiveValue live={liveToday}><AnimatedNumber value={liveToday.value} decimals={1} prefix={liveToday.value > 0 ? '+' : ''} suffix="%" /></LiveValue>}
            sub={`Market ${fmtPct(s.marketReturn1d)}`}
            subColor={pnlColor(s.return1d)}
          />
        )}
        {visibleKpi.drawdown && (
          <StatCard
            label="Max Drawdown"
            icon={ShieldAlert}
            iconColor="text-yellow-400"
            iconBg="bg-yellow-950/60"
            value={<AnimatedNumber value={s.maxDrawdown} decimals={1} suffix="%" />}
            sub={`Risk score ${s.riskScore}%`}
            subColor="text-muted"
          />
        )}
        {visibleKpi.return1y && (
          <StatCard
            label="1Y Return"
            icon={s.return1y >= 0 ? TrendingUp : TrendingDown}
            iconColor={s.return1y >= 0 ? 'text-green-400' : 'text-red-400'}
            iconBg={s.return1y >= 0 ? 'bg-green-950/60' : 'bg-red-950/60'}
            value={<AnimatedNumber value={s.return1y} decimals={1} prefix={s.return1y > 0 ? '+' : ''} suffix="%" />}
            sub={`Market ${fmtPct(s.marketReturn1y)}`}
            subColor={pnlColor(s.return1y - s.marketReturn1y)}
          />
        )}
      </div>

      {/* Insight callout */}
      <InsightCallout icon={Sparkles}>
        Your portfolio {vsMarket1y >= 0 ? 'beat' : 'trailed'} the market by {Math.abs(vsMarket1y).toFixed(1)}pp over 1 year.{' '}
        <span className="text-ink font-medium">{bestPerformer.name}</span> was your top performer ({pnlSign(bestPerformer.return1y)}{bestPerformer.return1y.toFixed(1)}%),
        while <span className="text-ink font-medium">{worstPerformer.name}</span> was the biggest drag ({pnlSign(worstPerformer.return1y)}{worstPerformer.return1y.toFixed(1)}%).
      </InsightCallout>

      {/* Returns table */}
      <Card>
        <CardTitle>Performance vs Market (VUSA benchmark)</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-left text-muted text-xs font-semibold"></th>
                {['1D', '1M', 'YTD', '1Y'].map(h => (
                  <th key={h} className="py-2 px-3 text-center text-muted text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ReturnRow bold label="Portfolio" d={s.return1d} m={s.return1m} ytd={s.returnYtd} y={s.return1y} />
              <ReturnRow label="Market" d={s.marketReturn1d} m={s.marketReturn1m} ytd={s.marketReturnYtd} y={s.marketReturn1y} />
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Portfolio Value (DKK)</CardTitle>
            <PeriodSelector selected={period} onChange={setPeriod} />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={filteredValue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={tickInterval} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={38} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="value" name="Value" stroke="#3b82f6" fill="url(#valueGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Portfolio Return vs Market</CardTitle>
            <PeriodSelector selected={period} onChange={setPeriod} />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={filteredReturn} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={tickInterval} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} width={38} />
              <Tooltip content={<CustomTooltip pctMode />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="market" name="Market" stroke="var(--color-muted)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Holdings + distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <CardTitle>Core — ETFs</CardTitle>
              <Badge color="green">Passive</Badge>
            </div>
            <HoldingsTable rows={core} pinned={pinned} onTogglePin={togglePin} />
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <CardTitle>Satellite — Stocks</CardTitle>
              <Badge color="blue">Active</Badge>
            </div>
            <HoldingsTable rows={satellite} pinned={pinned} onTogglePin={togglePin} />
          </Card>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardTitle>By Country</CardTitle>
            <DonutChart data={distribution.byCountry} />
          </Card>
          <Card>
            <CardTitle>By Sector</CardTitle>
            <DonutChart data={distribution.bySector} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function HoldingsTable({ rows, pinned = new Set(), onTogglePin = () => {} }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full text-xs min-w-[440px]">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 px-2 text-left first:pl-0 w-6"></th>
            {['Name', 'Wt', '1Y', 'P&L DKK', 'P&L %'].map(h => (
              <th key={h} className="py-2 px-2 text-left text-muted font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.ticker} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
              <td className="py-2.5 px-2 first:pl-0">
                <button
                  onClick={() => onTogglePin(p.ticker)}
                  aria-label={pinned.has(p.ticker) ? 'Unpin' : 'Pin'}
                  className={`transition-colors ${pinned.has(p.ticker) ? 'text-yellow-400' : 'text-border hover:text-muted'}`}
                >
                  <Star size={12} fill={pinned.has(p.ticker) ? 'currentColor' : 'none'} />
                </button>
              </td>
              <td className="py-2.5 px-2">
                <p className="text-ink font-medium">{p.name}</p>
                <p className="text-muted font-mono text-[11px] mt-0.5">{p.ticker}</p>
              </td>
              <td className="py-2.5 px-2 text-ink2 tabular-nums">{(p.weight * 100).toFixed(0)}%</td>
              <td className={`py-2.5 px-2 tabular-nums ${pnlColor(p.return1y)}`}>{pnlSign(p.return1y)}{p.return1y?.toFixed(1)}%</td>
              <td className={`py-2.5 px-2 tabular-nums whitespace-nowrap ${pnlColor(p.unrealizedPnlDkk)}`}>{pnlSign(p.unrealizedPnlDkk)}{p.unrealizedPnlDkk?.toLocaleString('da-DK', { maximumFractionDigits: 0 })}</td>
              <td className={`py-2.5 px-2 tabular-nums ${pnlColor(p.unrealizedPnlPct)}`}>{pnlSign(p.unrealizedPnlPct)}{p.unrealizedPnlPct?.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DonutChart({ data }) {
  return (
    <div className="flex flex-col gap-2">
      <ResponsiveContainer width="100%" height={100}>
        <PieChart>
          <Pie data={data} dataKey="pct" cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11, color: 'var(--slate-100)' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-muted">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            {d.label} {d.pct}%
          </div>
        ))}
      </div>
    </div>
  )
}
