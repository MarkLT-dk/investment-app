import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, Badge, EmptyState, pnlColor, pnlSign } from '../components/Card'
import { useToast } from '../components/Toast'
import { etfIdeas, signals } from '../data/mockData'
import { fetchAnalyticsData } from '../services/analyticsService'
import { fetchPositions } from '../services/positionService'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Zap, Calendar, SearchX } from 'lucide-react'

const labelColor = { Core: 'green', Growth: 'blue', Diversifier: 'purple', Explore: 'gray' }

const REC_LABELS = {
  strong_buy: { label: 'Strong Buy', color: 'green' },
  buy:        { label: 'Buy',        color: 'blue'  },
  hold:       { label: 'Hold',       color: 'yellow' },
  underperform: { label: 'Underperform', color: 'red' },
  sell:       { label: 'Sell',       color: 'red'   },
}

export default function DiscoverPage() {
  const [filters, setFilters]     = useState({ maxPE: '', minUpside: '', recommendation: '' })
  const [positions, setPositions] = useState([])
  const [liveData, setLiveData]   = useState(null)
  const showToast = useToast()

  useEffect(() => {
    fetchPositions().then(p => { if (p.length) setPositions(p) }).catch(() => {})
    fetchAnalyticsData().then(setLiveData).catch(() => {})
  }, [])

  // Build unified screener rows from live positions + fundamentals
  const screenerRows = positions.filter(p => {
    const f  = liveData?.fundamentals?.[p.ticker] ?? {}
    const ar = liveData?.analystRatings?.[p.ticker] ?? {}
    const pe   = f.peRatio
    const upside = f.upsideToTarget
    const rec  = ar.recommendationKey

    if (filters.maxPE      && pe     != null && pe > parseFloat(filters.maxPE)) return false
    if (filters.minUpside  && (upside == null || upside * 100 < parseFloat(filters.minUpside))) return false
    if (filters.recommendation && rec !== filters.recommendation) return false
    return true
  })

  async function handleAddToWatchlist(ticker, name) {
    try {
      await addDoc(collection(db, 'watchlist'), {
        ticker,
        name,
        dateAdded: new Date().toISOString().slice(0, 10),
        status: 'watching',
      })
      showToast(`${ticker} added to watchlist`)
    } catch {
      showToast(`${ticker} added to watchlist`)
    }
  }

  const buySignals  = signals.filter(s => s.severity === 'buy')
  const infoSignals = signals.filter(s => s.severity === 'info')

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="Find new ideas from signals, ETFs, and your own screener">Discover</PageTitle>

      {/* Signals + ETF ideas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <CardTitle>Buy signals — your watchlist</CardTitle>
          {buySignals.length === 0 && infoSignals.length === 0 ? (
            <EmptyState title="No signals right now" sub="All watchlist stocks are above target. We'll notify you here when something moves." />
          ) : (
            <>
              {buySignals.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <Zap size={13} className="text-green-400 flex-shrink-0" />
                  <p className="text-xs text-ink2 flex-1">{s.message}</p>
                  <Badge color="green">Buy zone</Badge>
                </div>
              ))}
              {infoSignals.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <Calendar size={13} className="text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-ink2 flex-1">{s.message}</p>
                  <Badge color="blue">Watch</Badge>
                </div>
              ))}
            </>
          )}
        </Card>

        <Card>
          <CardTitle>ETF ideas — low effort investing</CardTitle>
          <div className="space-y-0">
            {etfIdeas.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-blue-300">{e.ticker}</span>
                    <Badge color={labelColor[e.label] ?? 'gray'}>{e.label}</Badge>
                  </div>
                  <p className="text-xs text-muted">{e.description}</p>
                </div>
                <button
                  onClick={() => handleAddToWatchlist(e.ticker, e.ticker)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-950/60 flex-shrink-0 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Screener */}
      <Card>
        <CardTitle>Screener — filter your portfolio</CardTitle>
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-4">
          <div>
            <label className="text-xs text-muted block mb-1.5">Max P/E</label>
            <input
              type="number" placeholder="e.g. 25" value={filters.maxPE}
              onChange={e => setFilters({ ...filters, maxPE: e.target.value })}
              className="w-24 bg-surface-2 border border-border rounded px-2.5 py-1.5 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Min Upside %</label>
            <input
              type="number" placeholder="e.g. 10" value={filters.minUpside}
              onChange={e => setFilters({ ...filters, minUpside: e.target.value })}
              className="w-24 bg-surface-2 border border-border rounded px-2.5 py-1.5 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Analyst rating</label>
            <select
              value={filters.recommendation}
              onChange={e => setFilters({ ...filters, recommendation: e.target.value })}
              className="bg-surface-2 border border-border rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All</option>
              <option value="strong_buy">Strong Buy</option>
              <option value="buy">Buy</option>
              <option value="hold">Hold</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ maxPE: '', minUpside: '', recommendation: '' })}
              className="text-xs text-muted hover:text-ink py-1.5 transition-colors underline decoration-dotted underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'P/E', 'Upside', 'Analyst', 'Sharpe', '1Y Return', ''].map(h => (
                  <th key={h} className="py-2 px-2 text-left text-muted font-semibold first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screenerRows.map(p => {
                const f  = liveData?.fundamentals?.[p.ticker]    ?? {}
                const ar = liveData?.analystRatings?.[p.ticker]  ?? {}
                const rm = liveData?.riskMetrics?.[p.ticker]     ?? {}
                const r1 = rm['1Y'] || rm['2Y'] || {}
                const rec = ar.recommendationKey
                const recInfo = REC_LABELS[rec]

                return (
                  <tr key={p.ticker} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-2 first:pl-0">
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-muted font-mono text-[11px] mt-0.5">{p.ticker}</p>
                    </td>
                    <td className="py-2.5 px-2 text-ink2 tabular-nums">
                      {f.peRatio != null ? f.peRatio.toFixed(1) : '—'}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums ${pnlColor(f.upsideToTarget)}`}>
                      {f.upsideToTarget != null ? `+${(f.upsideToTarget * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-2">
                      {recInfo
                        ? <Badge color={recInfo.color}>{recInfo.label}</Badge>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums ${pnlColor(r1.sharpeRatio)}`}>
                      {r1.sharpeRatio != null ? r1.sharpeRatio.toFixed(2) : '—'}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums ${pnlColor(p.return1y)}`}>
                      {p.return1y != null ? `${pnlSign(p.return1y)}${p.return1y.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => handleAddToWatchlist(p.ticker, p.name)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                      >
                        + Watchlist
                      </button>
                    </td>
                  </tr>
                )
              })}
              {screenerRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10">
                    <EmptyState icon={SearchX} title="No stocks match the current filters" sub="Try loosening your P/E, upside, or rating filters." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
