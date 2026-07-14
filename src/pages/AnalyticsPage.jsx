import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardTitle, PageTitle, InsightCallout, pnlColor, pnlSign } from '../components/Card'
import { positions, watchlistTickers, fundamentals, riskMetrics } from '../data/mockData'
import { X, Sparkles } from 'lucide-react'

const COLORS = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ec4899', '#fbbf24', '#06b6d4', '#f43f5e']
const fmtPct = (n) => n != null ? `${pnlSign(n)}${n.toFixed(1)}%` : '—'
const fmt2 = (n) => n != null ? n.toFixed(2) : '—'

const PERIODS = [
  { label: '1M',  weeks: 4,  returnKey: 'return1m',  col: '1M' },
  { label: '3M',  weeks: 13, returnKey: 'return3m',  col: '3M' },
  { label: '6M',  weeks: 26, returnKey: 'return6m',  col: '6M' },
  { label: '1Y',  weeks: 52, returnKey: 'return1y',  col: '1Y' },
]

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

// All selectable tickers: portfolio + watchlist
const allSelectableTickers = [
  ...positions.map(p => ({ ticker: p.ticker, name: p.name, badge: 'Portfolio' })),
  ...watchlistTickers.map(p => ({ ticker: p.ticker, name: p.name, badge: 'Watchlist' })),
]

// Returns data (1Y) for any ticker we know about
const allReturns = Object.fromEntries(
  [...positions, ...watchlistTickers].map(p => [p.ticker, p])
)

export default function AnalyticsPage() {
  const [selected, setSelected] = useState(['CLA-B.ST', 'AMZN', 'NOVO-B.CO'])
  const [period, setPeriod] = useState(PERIODS[3]) // default 1Y

  const toggle = (ticker) => {
    if (selected.includes(ticker)) {
      setSelected(selected.filter(t => t !== ticker))
    } else if (selected.length < 6) {
      setSelected([...selected, ticker])
    }
  }

  const selectedData = selected.map(t => allReturns[t]).filter(Boolean)
  const allHistory = generateHistory(selected)
  const rawSlice = allHistory.slice(Math.max(0, allHistory.length - period.weeks))
  // Rebase each ticker to 0% at the start of the selected period
  const priceHistory = rawSlice.map(row => {
    const rebased = { date: row.date }
    selected.forEach(t => {
      const base = rawSlice[0]?.[t] ?? 0
      rebased[t] = row[t] != null ? parseFloat((row[t] - base).toFixed(1)) : null
    })
    return rebased
  })

  // Scatter data for custom SVG chart
  const scatterData = selected.map((t, i) => {
    const r = riskMetrics[t] ?? {}
    const p = allReturns[t] ?? {}
    return { ticker: t, name: allSelectableTickers.find(x => x.ticker === t)?.name ?? t, x: r.volatilityPct ?? 0, y: p.return1y ?? 0, color: COLORS[i] }
  })

  // Auto-generated insight comparing the current selection
  const bestOfSelection = selectedData.length ? [...selectedData].sort((a, b) => b.return1y - a.return1y)[0] : null
  const riskiestOfSelection = selectedData.length ? [...selectedData].sort((a, b) => (riskMetrics[b.ticker]?.volatilityPct ?? 0) - (riskMetrics[a.ticker]?.volatilityPct ?? 0))[0] : null

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="Compare performance, fundamentals and risk side by side">Analytics</PageTitle>

      {bestOfSelection && riskiestOfSelection && (
        <InsightCallout icon={Sparkles}>
          Of your selected stocks, <span className="text-ink font-medium">{bestOfSelection.name}</span> has the strongest 1Y return ({pnlSign(bestOfSelection.return1y)}{bestOfSelection.return1y?.toFixed(1)}%),
          while <span className="text-ink font-medium">{riskiestOfSelection.name}</span> carries the most volatility ({riskMetrics[riskiestOfSelection.ticker]?.volatilityPct?.toFixed(1)}% annualised).
        </InsightCallout>
      )}

      {/* Ticker selector */}
      <Card>
        <CardTitle>Select stocks to compare (max 6 — portfolio &amp; watchlist)</CardTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((t, i) => {
            const info = allSelectableTickers.find(x => x.ticker === t)
            return (
              <div
                key={t}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md text-xs font-semibold"
                style={{ background: COLORS[i] + '22', color: COLORS[i], border: `1px solid ${COLORS[i]}44` }}
              >
                {info?.name ?? t}
                {info?.badge === 'Watchlist' && <span className="opacity-60 text-xs">(W)</span>}
                <button onClick={() => toggle(t)} aria-label={`Remove ${info?.name ?? t}`} className="p-0.5 rounded opacity-70 hover:opacity-100 hover:bg-black/20 transition"><X size={11} /></button>
              </div>
            )
          })}
          {selected.length < 6 && (
            <select
              className="appearance-none bg-surface-2 border border-border text-muted text-xs rounded-md px-3 py-1.5 cursor-pointer hover:border-blue-500 hover:text-ink transition-colors focus:outline-none focus:border-blue-500"
              value=""
              onChange={e => { if (e.target.value) toggle(e.target.value) }}
            >
              <option value="">+ Add ticker</option>
              <optgroup label="Portfolio">
                {positions.filter(p => !selected.includes(p.ticker)).map(p => (
                  <option key={p.ticker} value={p.ticker}>{p.name} ({p.ticker})</option>
                ))}
              </optgroup>
              <optgroup label="Watchlist">
                {watchlistTickers.filter(p => !selected.includes(p.ticker)).map(p => (
                  <option key={p.ticker} value={p.ticker}>{p.name} ({p.ticker})</option>
                ))}
              </optgroup>
            </select>
          )}
        </div>

        {/* Returns table */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-2 text-left text-muted font-semibold">Stock</th>
                {[
                  { label: '1D',  key: 'return1d' },
                  { label: '1M',  key: 'return1m' },
                  { label: 'YTD', key: 'returnYtd' },
                  { label: '1Y',  key: 'return1y' },
                ].map(col => (
                  <th
                    key={col.label}
                    className={`py-2 px-2 text-center font-semibold transition-colors ${
                      period.col === col.label ? 'text-blue-400' : 'text-muted'
                    }`}
                  >
                    {col.label}
                    {period.col === col.label && <span className="ml-0.5 text-blue-500">▴</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedData.map((p, i) => (
                <tr key={p.ticker} className="border-b border-border last:border-0">
                  <td className="py-2 px-2 font-semibold" style={{ color: COLORS[i] }}>{p.name}</td>
                  {[
                    { v: p.return1d,  col: '1D' },
                    { v: p.return1m,  col: '1M' },
                    { v: p.returnYtd, col: 'YTD' },
                    { v: p.return1y,  col: '1Y' },
                  ].map(({ v, col }, j) => (
                    <td
                      key={j}
                      className={`py-2 px-2 text-center ${pnlColor(v)} ${period.col === col ? 'font-semibold' : ''}`}
                    >
                      {fmtPct(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Price chart */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Normalised Performance (rebased to 0%)</CardTitle>
          <PeriodSelector selected={period} onChange={setPeriod} />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={priceHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(priceHistory.length / 6) - 1)} />
            <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={44} />
            <Tooltip formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, padding: '8px 10px', color: 'var(--slate-100)' }} labelStyle={{ color: 'var(--color-muted)', marginBottom: 4 }} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="3 3" />
            {selected.map((t, i) => {
              const info = allSelectableTickers.find(x => x.ticker === t)
              return <Line key={t} type="monotone" dataKey={t} name={info?.name ?? t} stroke={COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            })}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {selected.map((t, i) => {
            const info = allSelectableTickers.find(x => x.ticker === t)
            return (
              <div key={t} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-3 h-0.5 rounded" style={{ background: COLORS[i], display: 'inline-block' }} />
                {info?.name ?? t}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Fundamentals + Risk + Scatter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <Card>
            <CardTitle>Fundamentals</CardTitle>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1.5 px-2 text-left text-muted font-semibold">Stock</th>
                    {['P/E', 'P/B', 'EV/EBITDA', 'Margin', 'Upside'].map(h => (
                      <th key={h} className="py-1.5 px-2 text-center text-muted font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.map((t, i) => {
                    const f = fundamentals[t] ?? {}
                    const info = allSelectableTickers.find(x => x.ticker === t)
                    return (
                      <tr key={t} className="border-b border-border last:border-0">
                        <td className="py-2 px-2 font-semibold text-xs" style={{ color: COLORS[i] }}>{info?.name ?? t}</td>
                        <td className="py-2 px-2 text-center text-ink2">{f.pe != null ? f.pe.toFixed(1) : '—'}</td>
                        <td className="py-2 px-2 text-center text-ink2">{fmt2(f.pb)}</td>
                        <td className="py-2 px-2 text-center text-ink2">{fmt2(f.evEbitda)}</td>
                        <td className="py-2 px-2 text-center text-ink2">{f.profitMargin != null ? `${(f.profitMargin * 100).toFixed(0)}%` : '—'}</td>
                        <td className={`py-2 px-2 text-center ${pnlColor(f.upside)}`}>{f.upside != null ? `+${(f.upside * 100).toFixed(0)}%` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardTitle>Risk Metrics</CardTitle>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1.5 px-2 text-left text-muted font-semibold">Stock</th>
                    {['Beta', 'Sharpe', 'Max DD', 'Vol %', 'Alpha'].map(h => (
                      <th key={h} className="py-1.5 px-2 text-center text-muted font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.map((t, i) => {
                    const r = riskMetrics[t] ?? {}
                    const info = allSelectableTickers.find(x => x.ticker === t)
                    return (
                      <tr key={t} className="border-b border-border last:border-0">
                        <td className="py-2 px-2 font-semibold text-xs" style={{ color: COLORS[i] }}>{info?.name ?? t}</td>
                        <td className="py-2 px-2 text-center text-ink2">{fmt2(r.beta)}</td>
                        <td className={`py-2 px-2 text-center ${pnlColor(r.sharpe)}`}>{fmt2(r.sharpe)}</td>
                        <td className="py-2 px-2 text-center text-red-400">{r.maxDrawdown != null ? `${r.maxDrawdown.toFixed(1)}%` : '—'}</td>
                        <td className="py-2 px-2 text-center text-ink2">{r.volatilityPct != null ? `${r.volatilityPct.toFixed(1)}%` : '—'}</td>
                        <td className={`py-2 px-2 text-center ${pnlColor(r.alpha)}`}>{r.alpha != null ? `${pnlSign(r.alpha)}${(r.alpha * 100).toFixed(0)}%` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Risk vs Return — custom SVG scatter */}
        <Card>
          <CardTitle>Risk (Volatility %) vs Return (1Y %)</CardTitle>
          <ScatterPlot data={scatterData} />
        </Card>
      </div>
    </div>
  )
}

// Custom SVG scatter plot — avoids Recharts multi-Scatter quirks
function ScatterPlot({ data }) {
  const W = 320, H = 200, PAD = { top: 10, right: 20, bottom: 36, left: 44 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  if (!data.length) return null

  const xs = data.map(d => d.x)
  const ys = data.map(d => d.y)
  const xMin = Math.max(0, Math.min(...xs) - 5)
  const xMax = Math.max(...xs) + 5
  const yMin = Math.min(...ys) - 10
  const yMax = Math.max(...ys) + 10

  const toSvgX = x => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW
  const toSvgY = y => PAD.top + ((yMax - y) / (yMax - yMin)) * innerH
  const zeroY = toSvgY(0)

  // Axis ticks
  const xTicks = [Math.round(xMin), Math.round((xMin + xMax) / 2), Math.round(xMax)]
  const yTicks = [Math.round(yMin), 0, Math.round(yMax)]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
      {/* Zero line */}
      {zeroY > PAD.top && zeroY < PAD.top + innerH && (
        <line x1={PAD.left} y1={zeroY} x2={PAD.left + innerW} y2={zeroY} stroke="var(--color-border)" strokeDasharray="3 3" />
      )}

      {/* X axis ticks */}
      {xTicks.map(v => (
        <g key={v}>
          <line x1={toSvgX(v)} y1={PAD.top + innerH} x2={toSvgX(v)} y2={PAD.top + innerH + 4} stroke="var(--color-border)" />
          <text x={toSvgX(v)} y={PAD.top + innerH + 14} textAnchor="middle" fill="var(--color-muted)" fontSize={9}>{v}%</text>
        </g>
      ))}

      {/* Y axis ticks */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.left - 4} y1={toSvgY(v)} x2={PAD.left} y2={toSvgY(v)} stroke="var(--color-border)" />
          <text x={PAD.left - 7} y={toSvgY(v) + 3} textAnchor="end" fill="var(--color-muted)" fontSize={9}>{v}%</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={PAD.left + innerW / 2} y={H - 2} textAnchor="middle" fill="var(--color-muted)" fontSize={9}>Volatility (annualised)</text>
      <text x={10} y={PAD.top + innerH / 2} textAnchor="middle" fill="var(--color-muted)" fontSize={9} transform={`rotate(-90 10 ${PAD.top + innerH / 2})`}>1Y Return</text>

      {/* Dots */}
      {data.map((d, i) => (
        <g key={d.ticker}>
          <circle cx={toSvgX(d.x)} cy={toSvgY(d.y)} r={6} fill={d.color} fillOpacity={0.85} />
          <text x={toSvgX(d.x) + 8} y={toSvgY(d.y) + 4} fill={d.color} fontSize={9}>{d.ticker.split('.')[0]}</text>
        </g>
      ))}
    </svg>
  )
}

function generateHistory(tickers) {
  // 52 weekly data points so 1M/3M/6M/1Y slicing all work
  const WEEKS = 52
  const targets = {
    'CLA-B.ST': 84, 'VUSA.AS': 18, 'AMZN': 49, 'GMAB.CO': -10,
    'DFDS.CO': -13, 'COLO-B.CO': -15, 'NOBI.ST': -36, 'DSV.CO': 43,
    'NIBE-B.ST': -24, 'GN.CO': -36, 'NOVO-B.CO': -38, 'PNDORA.CO': 52,
  }
  const now = new Date()
  return Array.from({ length: WEEKS }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (WEEKS - 1 - i) * 7)
    const label = d.toLocaleDateString('en-DK', { day: 'numeric', month: 'short' })
    const row = { date: label }
    tickers.forEach(t => {
      const target = targets[t] ?? 10
      // Smooth curve from 0 → target with some noise
      const progress = i / (WEEKS - 1)
      const noise = Math.sin(i * 0.7 + t.charCodeAt(0) * 0.1) * 5
      row[t] = parseFloat((target * progress + noise * (1 - progress * 0.5)).toFixed(1))
    })
    return row
  })
}
