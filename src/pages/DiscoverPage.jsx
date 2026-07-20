import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, Badge, EmptyState, pnlColor, pnlSign } from '../components/Card'
import { useToast } from '../components/Toast'
import { etfIdeas } from '../data/mockData'
import { fetchAnalyticsData } from '../services/analyticsService'
import { fetchPositions } from '../services/positionService'
import { fetchLatestBrief } from '../services/dailyBriefService'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Zap, SearchX, TrendingUp, TrendingDown, Minus, Brain, AlertCircle, Map } from 'lucide-react'

const labelColor = { Core: 'green', Growth: 'blue', Diversifier: 'purple', Explore: 'gray' }

const REC_LABELS = {
  strong_buy:   { label: 'Strong Buy',   color: 'green'  },
  buy:          { label: 'Buy',          color: 'blue'   },
  hold:         { label: 'Hold',         color: 'yellow' },
  underperform: { label: 'Underperform', color: 'red'    },
  sell:         { label: 'Sell',         color: 'red'    },
}

const VERDICT_STYLE = {
  'BUY NOW': { color: 'green', icon: TrendingUp  },
  'WAIT':    { color: 'blue',  icon: Minus        },
  'WATCH':   { color: 'yellow',icon: AlertCircle  },
  'AVOID':   { color: 'red',   icon: TrendingDown },
}

const STATUS_COLORS = {
  watching:  'blue',
  'on hold': 'yellow',
  bought:    'green',
  avoided:   'red',
}

function fmt(n, dec = 2) {
  if (n == null) return '—'
  return n.toLocaleString('da-DK', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function pctDiff(current, target) {
  if (!current || !target) return null
  return ((current - target) / target) * 100
}

export default function DiscoverPage() {
  const [filters, setFilters]       = useState({ maxPE: '', minUpside: '', recommendation: '' })
  const [watchlistFilter, setWatchlistFilter] = useState('all')
  const [positions, setPositions]   = useState([])
  const [liveData, setLiveData]     = useState(null)
  const [brief, setBrief]           = useState(null)
  const showToast = useToast()

  useEffect(() => {
    fetchPositions().then(p => { if (p.length) setPositions(p) }).catch(() => {})
    fetchAnalyticsData().then(setLiveData).catch(() => {})
    fetchLatestBrief().then(setBrief).catch(() => {})
  }, [])

  const screenerRows = positions.filter(p => {
    const f  = liveData?.fundamentals?.[p.ticker] ?? {}
    const ar = liveData?.analystRatings?.[p.ticker] ?? {}
    if (filters.maxPE         && f.peRatio != null && f.peRatio > parseFloat(filters.maxPE)) return false
    if (filters.minUpside     && (f.upsideToTarget == null || f.upsideToTarget * 100 < parseFloat(filters.minUpside))) return false
    if (filters.recommendation && ar.recommendationKey !== filters.recommendation) return false
    return true
  })

  const watchlistRows = (liveData?.watchlistTickers ?? []).filter(w =>
    watchlistFilter === 'all' || w.status === watchlistFilter
  )

  const watchlistStatuses = ['all', ...Array.from(new Set((liveData?.watchlistTickers ?? []).map(w => w.status).filter(Boolean)))]

  async function handleAddToWatchlist(ticker, name) {
    const alreadyIn = liveData?.watchlistTickers?.some(w => w.ticker === ticker)
    if (alreadyIn) { showToast(`${ticker} is already on your watchlist`); return }
    try {
      await addDoc(collection(db, 'watchlist'), { ticker, name, dateAdded: new Date().toISOString().slice(0, 10), status: 'watching' })
      showToast(`${ticker} added to watchlist`)
    } catch {
      showToast(`Failed to add ${ticker}`)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="AI-powered market intelligence and stock screening">Discover</PageTitle>

      {/* Daily Brief */}
      {brief && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-blue-400" />
            <CardTitle>Daily Intelligence Brief</CardTitle>
            <span className="ml-auto text-[11px] text-muted">{brief.date}</span>
          </div>

          {brief.marketSummary && (
            <p className="text-xs text-ink2 leading-relaxed mb-4 pb-4 border-b border-border">
              {brief.marketSummary}
            </p>
          )}

          <div className="space-y-3">
            {(brief.watchlist ?? []).map((item, i) => {
              const vs = VERDICT_STYLE[item.verdict] ?? VERDICT_STYLE['WATCH']
              const Icon = vs.icon
              return (
                <div key={i} className="flex gap-3 py-3 border-b border-border last:border-0">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon size={14} className={`text-${vs.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-ink">{item.ticker}</span>
                      <span className="text-xs text-muted">{item.name}</span>
                      <Badge color={vs.color}>{item.verdict}</Badge>
                    </div>
                    <p className="text-xs text-ink2 mb-1">{item.verdictReason}</p>
                    {item.keyMetrics && (
                      <p className="text-[11px] text-muted font-mono">{item.keyMetrics}</p>
                    )}
                    {(item.signals ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.signals.map((s, j) => (
                          <span key={j} className="text-[10px] bg-surface-2 border border-border rounded px-1.5 py-0.5 text-muted">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.newsHighlight && (
                      <p className="text-[11px] text-blue-300/80 mt-1.5 italic">"{item.newsHighlight}"</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {(brief.investmentAreas ?? []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Investment areas</p>
              {brief.investmentAreas.map((area, i) => {
                const verdictColor = area.verdict === 'GOOD TIME' ? 'green' : area.verdict === 'WAIT' ? 'yellow' : 'blue'
                return (
                  <div key={i} className="flex gap-3 py-3 border-b border-border last:border-0">
                    <Map size={13} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-ink">{area.areaName}</span>
                        {area.verdict && <Badge color={verdictColor}>{area.verdict}</Badge>}
                      </div>
                      <p className="text-xs text-ink2 mb-1.5">{area.analysis}</p>
                      {(area.suggestedInstruments ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {area.suggestedInstruments.map((s, j) => (
                            <span key={j} className="text-[10px] bg-purple-950/40 border border-purple-800/30 rounded px-1.5 py-0.5 text-purple-300">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {(brief.portfolioAlerts ?? []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Portfolio alerts</p>
              <div className="space-y-1">
                {brief.portfolioAlerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Zap size={11} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-ink2">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(brief.upcomingEarnings ?? []).length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Upcoming earnings</p>
              <div className="flex flex-wrap gap-2">
                {brief.upcomingEarnings.map((e, i) => (
                  <span key={i} className="text-[11px] bg-surface-2 border border-border rounded px-2 py-1 text-ink2">{e}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Watchlist table */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <CardTitle>Watchlist</CardTitle>
          <div className="flex gap-1.5 flex-wrap">
            {watchlistStatuses.map(s => (
              <button
                key={s}
                onClick={() => setWatchlistFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize
                  ${watchlistFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-2 text-muted hover:text-ink border border-border'
                  }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                {['Stock', 'Status', 'Current (DKK)', 'Target (DKK)', 'Distance', 'Analyst', 'Thesis'].map(h => (
                  <th key={h} className="py-2 px-2 text-left text-muted font-semibold first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchlistRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10">
                    <EmptyState icon={SearchX} title="No watchlist stocks" sub="Add stocks from the screener or ETF ideas below." />
                  </td>
                </tr>
              ) : watchlistRows.map(w => {
                const mp      = liveData?.marketPrices?.[w.ticker] ?? {}
                const ar      = liveData?.analystRatings?.[w.ticker] ?? {}
                const current = mp.currentPriceDkk ?? null
                const target  = w.target_buy_price_dkk ? parseFloat(w.target_buy_price_dkk) : null
                const diff    = pctDiff(current, target)
                const recInfo = REC_LABELS[ar.recommendationKey]

                return (
                  <tr key={w.ticker} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-2 first:pl-0">
                      <p className="font-medium text-ink">{liveData?.dimTicker?.[w.ticker]?.name ?? w.ticker}</p>
                      <p className="text-muted font-mono text-[11px] mt-0.5">{w.ticker}</p>
                    </td>
                    <td className="py-2.5 px-2">
                      <Badge color={STATUS_COLORS[w.status] ?? 'gray'}>{w.status ?? '—'}</Badge>
                    </td>
                    <td className="py-2.5 px-2 tabular-nums text-ink2">
                      {current != null ? fmt(current) : '—'}
                    </td>
                    <td className="py-2.5 px-2 tabular-nums text-ink2">
                      {target != null ? fmt(target) : '—'}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums font-semibold ${diff == null ? '' : diff <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {diff == null ? '—' : `${diff <= 0 ? '' : '+'}${diff.toFixed(1)}%`}
                    </td>
                    <td className="py-2.5 px-2">
                      {recInfo
                        ? <Badge color={recInfo.color}>{recInfo.label}</Badge>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-muted max-w-[180px] truncate" title={w.thesis ?? ''}>
                      {w.thesis || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ETF ideas + Screener */}
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
                const f   = liveData?.fundamentals?.[p.ticker]   ?? {}
                const ar  = liveData?.analystRatings?.[p.ticker] ?? {}
                const rm  = liveData?.riskMetrics?.[p.ticker]    ?? {}
                const r1  = rm['1Y'] || rm['2Y'] || {}
                const recInfo = REC_LABELS[ar.recommendationKey]

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
