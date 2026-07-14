import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardTitle, PageTitle, InsightCallout, pnlColor, pnlSign } from '../components/Card'
import { positions as mockPositions, watchlistTickers as mockWatchlist, fundamentals as mockFundamentals, riskMetrics as mockRiskMetrics } from '../data/mockData'
import { fetchAnalyticsData } from '../services/analyticsService'
import { fetchPositions } from '../services/positionService'
import { X, Sparkles } from 'lucide-react'

const COLORS = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ec4899', '#fbbf24', '#06b6d4', '#f43f5e']
const fmtPct = (n) => n != null ? `${pnlSign(n)}${n.toFixed(1)}%` : '—'
const fmt2   = (n) => n != null ? n.toFixed(2) : '—'

const PERIODS = [
  { label: '1M',  weeks: 4  },
  { label: '3M',  weeks: 13 },
  { label: '6M',  weeks: 26 },
  { label: '1Y',  weeks: 52 },
]

function PeriodSelector({ selected, onChange }) {
  return (
    <div className="flex gap-1">
      {PERIODS.map(p => (
        <button
          key={p.label}
          onClick={() => onChange(p)}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            selected.label === p.label ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// Build normalised weekly performance chart data from tickerSummary
function buildChartData(selected, tickerSummary, period) {
  const refTicker = selected.find(t => tickerSummary[t]?.weeklyDates?.length)
  if (!refTicker) return null

  const weeks     = period.weeks
  const refDates  = tickerSummary[refTicker].weeklyDates.slice(-weeks)

  return refDates.map((isoDate, i) => {
    const label = new Date(isoDate).toLocaleDateString('en-DK', { day: 'numeric', month: 'short' })
    const row   = { date: label }
    for (const ticker of selected) {
      const s      = tickerSummary[ticker]
      if (!s?.weeklyCloses?.length) continue
      const closes = s.weeklyCloses.slice(-weeks)
      const base   = closes[0]
      if (!base || i >= closes.length) continue
      row[ticker]  = parseFloat(((closes[i] / base - 1) * 100).toFixed(1))
    }
    return row
  })
}

// Fallback synthetic chart (same logic as before)
function generateFallbackHistory(tickers) {
  const WEEKS   = 52
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
    const row   = { date: label }
    tickers.forEach(t => {
      const target   = targets[t] ?? 10
      const progress = i / (WEEKS - 1)
      const noise    = Math.sin(i * 0.7 + t.charCodeAt(0) * 0.1) * 5
      row[t] = parseFloat((target * progress + noise * (1 - progress * 0.5)).toFixed(1))
    })
    return row
  })
}

export default function AnalyticsPage() {
  const [selected, setSelected] = useState(['CLA-B.ST', 'AMZN', 'NOVO-B.CO'])
  const [period, setPeriod]     = useState(PERIODS[3])
  const [liveData, setLiveData] = useState(null)
  const [livePos,  setLivePos]  = useState([])

  useEffect(() => {
    fetchAnalyticsData().then(setLiveData).catch(() => {})
    fetchPositions().then(p => { if (p.length) setLivePos(p) }).catch(() => {})
  }, [])

  // Selectable ticker list — portfolio + watchlist
  const allTickers = useMemo(() => {
    if (!liveData) {
      return [
        ...mockPositions.map(p => ({ ticker: p.ticker, name: p.name, badge: 'Portfolio' })),
        ...mockWatchlist.map(p => ({ ticker: p.ticker, name: p.name, badge: 'Watchlist' })),
      ]
    }
    const portSet  = new Set(livePos.map(p => p.ticker))
    const portList = livePos.map(p => ({ ticker: p.ticker, name: p.name, badge: 'Portfolio' }))
    const watchList = (liveData.watchlistTickers || [])
      .filter(w => !portSet.has(w.ticker))
      .map(w => ({ ticker: w.ticker, name: liveData.dimTicker[w.ticker]?.name || w.ticker, badge: 'Watchlist' }))
    return [...portList, ...watchList]
  }, [liveData, livePos])

  // Fundamentals: Firestore field names → display shape
  const fundMap = useMemo(() => {
    if (!liveData?.fundamentals) return mockFundamentals
    const out = {}
    for (const [ticker, f] of Object.entries(liveData.fundamentals)) {
      const ar = liveData.analystRatings?.[ticker] || {}
      out[ticker] = {
        pe:             f.peRatio,
        pb:             f.pbRatio,
        evEbitda:       f.evEbitda,
        profitMargin:   f.profitMargin,
        upside:         f.upsideToTarget,
        recommendation: ar.recommendationKey || null,
      }
    }
    return Object.keys(out).length ? out : mockFundamentals
  }, [liveData])

  // Risk metrics: decimal → display (multiply vol/drawdown/alpha by 100)
  const riskMap = useMemo(() => {
    if (!liveData?.riskMetrics) return mockRiskMetrics
    const out = {}
    for (const [ticker, periods] of Object.entries(liveData.riskMetrics)) {
      const d = periods['1Y'] || periods['2Y'] || {}
      out[ticker] = {
        beta:          d.beta,
        sharpe:        d.sharpeRatio,
        maxDrawdown:   d.maxDrawdown   != null ? d.maxDrawdown   * 100 : null,
        volatilityPct: d.volatilityAnn != null ? d.volatilityAnn * 100 : null,
        alpha:         d.alpha         != null ? d.alpha         * 100 : null,
      }
    }
    return Object.keys(out).length ? out : mockRiskMetrics
  }, [liveData])

  // Return data per ticker (for table + scatter)
  const returnMap = useMemo(() => {
    const base = Object.fromEntries(
      [...mockPositions, ...mockWatchlist].map(p => [p.ticker, p])
    )
    if (!liveData?.tickerSummary) return base
    for (const [ticker, s] of Object.entries(liveData.tickerSummary)) {
      base[ticker] = {
        ...base[ticker],
        ticker,
        name: liveData.dimTicker[ticker]?.name || base[ticker]?.name || ticker,
        return1d:  s.return1d,
        return1m:  s.return1m,
        returnYtd: s.returnYtd,
        return1y:  s.return1y,
      }
    }
    return base
  }, [liveData])

  const toggle = (ticker) => {
    if (selected.includes(ticker)) setSelected(selected.filter(t => t !== ticker))
    else if (selected.length < 6)  setSelected([...selected, ticker])
  }

  const selectedData = selected.map(t => returnMap[t]).filter(Boolean)

  // Performance chart
  const priceHistory = useMemo(() => {
    const live = liveData?.tickerSummary
      ? buildChartData(selected, liveData.tickerSummary, period)
      : null
    if (live) {
      // Slice for period
      return live
    }
    const raw = generateFallbackHistory(selected)
    return raw.slice(Math.max(0, raw.length - period.weeks))
  }, [liveData, selected, period])

  // Scatter data
  const scatterData = selected.map((t, i) => {
    const r = riskMap[t] ?? {}
    const p = returnMap[t] ?? {}
    return {
      ticker: t,
      name:   allTickers.find(x => x.ticker === t)?.name ?? t,
      x: r.volatilityPct ?? 0,
      y: p.return1y       ?? 0,
      color: COLORS[i],
    }
  })

  const bestOfSelection    = selectedData.length ? [...selectedData].sort((a, b) => (b.return1y ?? 0) - (a.return1y ?? 0))[0] : null
  const riskiestOfSelection = selectedData.length ? [...selectedData].sort((a, b) => (riskMap[b.ticker]?.volatilityPct ?? 0) - (riskMap[a.ticker]?.volatilityPct ?? 0))[0] : null

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="Compare performance, fundamentals and risk side by side">Analytics</PageTitle>

      {bestOfSelection && riskiestOfSelection && bestOfSelection.return1y != null && (
        <InsightCallout icon={Sparkles}>
          Of your selected stocks, <span className="text-ink font-medium">{bestOfSelection.name}</span> has the strongest 1Y return ({pnlSign(bestOfSelection.return1y)}{bestOfSelection.return1y?.toFixed(1)}%),
          while <span className="text-ink font-medium">{riskiestOfSelection.name}</span> carries the most volatility ({riskMap[riskiestOfSelection.ticker]?.volatilityPct?.toFixed(1)}% annualised).
        </InsightCallout>
      )}

      {/* Ticker selector */}
      <Card>
        <CardTitle>Select stocks to compare (max 6 — portfolio &amp; watchlist)</CardTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((t, i) => {
            const info = allTickers.find(x => x.ticker === t)
            return (
              <div
                key={t}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md text-xs font-semibold"
                style={{ background: COLORS[i] + '22', color: COLORS[i], border: `1px solid ${COLORS[i]}44` }}
              >
                {info?.name ?? t}
                {info?.badge === 'Watchlist' && <span className="opacity-60 text-xs">(W)</span>}
                <button onClick={() => toggle(t)} className="p-0.5 rounded opacity-70 hover:opacity-100 hover:bg-black/20 transition"><X size={11} /></button>
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
                {allTickers.filter(x => x.badge === 'Portfolio' && !selected.includes(x.ticker)).map(p => (
                  <option key={p.ticker} value={p.ticker}>{p.name} ({p.ticker})</option>
                ))}
              </optgroup>
              <optgroup label="Watchlist">
                {allTickers.filter(x => x.badge === 'Watchlist' && !selected.includes(x.ticker)).map(p => (
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
                  { label: '1D',  key: 'return1d'  },
                  { label: '1M',  key: 'return1m'  },
                  { label: 'YTD', key: 'returnYtd' },
                  { label: '1Y',  key: 'return1y'  },
                ].map(col => (
                  <th key={col.label} className="py-2 px-2 text-center text-muted font-semibold">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedData.map((p, i) => (
                <tr key={p.ticker} className="border-b border-border last:border-0">
                  <td className="py-2 px-2 font-semibold" style={{ color: COLORS[i] }}>{p.name ?? p.ticker}</td>
                  {['return1d', 'return1m', 'returnYtd', 'return1y'].map((k, j) => (
                    <td key={j} className={`py-2 px-2 text-center ${pnlColor(p[k])}`}>{fmtPct(p[k])}</td>
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
            <Tooltip formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, padding: '8px 10px' }} labelStyle={{ color: 'var(--color-muted)', marginBottom: 4 }} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="3 3" />
            {selected.map((t, i) => {
              const info = allTickers.find(x => x.ticker === t)
              return <Line key={t} type="monotone" dataKey={t} name={info?.name ?? t} stroke={COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls />
            })}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {selected.map((t, i) => {
            const info = allTickers.find(x => x.ticker === t)
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
                    const f    = fundMap[t] ?? {}
                    const info = allTickers.find(x => x.ticker === t)
                    return (
                      <tr key={t} className="border-b border-border last:border-0">
                        <td className="py-2 px-2 font-semibold text-xs" style={{ color: COLORS[i] }}>{info?.name ?? t}</td>
                        <td className="py-2 px-2 text-center text-ink2">{f.pe   != null ? f.pe.toFixed(1)   : '—'}</td>
                        <td className="py-2 px-2 text-center text-ink2">{f.pb   != null ? f.pb.toFixed(2)   : '—'}</td>
                        <td className="py-2 px-2 text-center text-ink2">{f.evEbitda != null ? f.evEbitda.toFixed(2) : '—'}</td>
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
            <CardTitle>Risk Metrics (1Y)</CardTitle>
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
                    const r    = riskMap[t] ?? {}
                    const info = allTickers.find(x => x.ticker === t)
                    return (
                      <tr key={t} className="border-b border-border last:border-0">
                        <td className="py-2 px-2 font-semibold text-xs" style={{ color: COLORS[i] }}>{info?.name ?? t}</td>
                        <td className="py-2 px-2 text-center text-ink2">{fmt2(r.beta)}</td>
                        <td className={`py-2 px-2 text-center ${pnlColor(r.sharpe)}`}>{fmt2(r.sharpe)}</td>
                        <td className="py-2 px-2 text-center text-red-400">{r.maxDrawdown   != null ? `${r.maxDrawdown.toFixed(1)}%`   : '—'}</td>
                        <td className="py-2 px-2 text-center text-ink2">{r.volatilityPct != null ? `${r.volatilityPct.toFixed(1)}%` : '—'}</td>
                        <td className={`py-2 px-2 text-center ${pnlColor(r.alpha)}`}>{r.alpha != null ? `${pnlSign(r.alpha)}${Math.abs(r.alpha).toFixed(1)}%` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle>Risk (Volatility %) vs Return (1Y %)</CardTitle>
          <ScatterPlot data={scatterData} />
        </Card>
      </div>
    </div>
  )
}

function ScatterPlot({ data }) {
  const W = 320, H = 200, PAD = { top: 10, right: 20, bottom: 36, left: 44 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom
  if (!data.length) return null

  const xs   = data.map(d => d.x)
  const ys   = data.map(d => d.y)
  const xMin = Math.max(0, Math.min(...xs) - 5)
  const xMax = Math.max(...xs) + 5
  const yMin = Math.min(...ys) - 10
  const yMax = Math.max(...ys) + 10

  const toSvgX = x => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW
  const toSvgY = y => PAD.top  + ((yMax - y) / (yMax - yMin)) * innerH
  const zeroY  = toSvgY(0)

  const xTicks = [Math.round(xMin), Math.round((xMin + xMax) / 2), Math.round(xMax)]
  const yTicks = [Math.round(yMin), 0, Math.round(yMax)]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
      {zeroY > PAD.top && zeroY < PAD.top + innerH && (
        <line x1={PAD.left} y1={zeroY} x2={PAD.left + innerW} y2={zeroY} stroke="var(--color-border)" strokeDasharray="3 3" />
      )}
      {xTicks.map(v => (
        <g key={v}>
          <line x1={toSvgX(v)} y1={PAD.top + innerH} x2={toSvgX(v)} y2={PAD.top + innerH + 4} stroke="var(--color-border)" />
          <text x={toSvgX(v)} y={PAD.top + innerH + 14} textAnchor="middle" fill="var(--color-muted)" fontSize={9}>{v}%</text>
        </g>
      ))}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.left - 4} y1={toSvgY(v)} x2={PAD.left} y2={toSvgY(v)} stroke="var(--color-border)" />
          <text x={PAD.left - 7} y={toSvgY(v) + 3} textAnchor="end" fill="var(--color-muted)" fontSize={9}>{v}%</text>
        </g>
      ))}
      <text x={PAD.left + innerW / 2} y={H - 2} textAnchor="middle" fill="var(--color-muted)" fontSize={9}>Volatility (annualised)</text>
      <text x={10} y={PAD.top + innerH / 2} textAnchor="middle" fill="var(--color-muted)" fontSize={9} transform={`rotate(-90 10 ${PAD.top + innerH / 2})`}>1Y Return</text>
      {data.map((d) => (
        <g key={d.ticker}>
          <circle cx={toSvgX(d.x)} cy={toSvgY(d.y)} r={6} fill={d.color} fillOpacity={0.85} />
          <text x={toSvgX(d.x) + 8} y={toSvgY(d.y) + 4} fill={d.color} fontSize={9}>{d.ticker.split('.')[0]}</text>
        </g>
      ))}
    </svg>
  )
}
