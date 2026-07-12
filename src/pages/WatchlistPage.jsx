import { useState } from 'react'
import { Card, CardTitle, PageTitle, Badge, EmptyState, pnlColor, pnlSign } from '../components/Card'
import { useToast } from '../components/Toast'
import { watchlist, news } from '../data/mockData'
import { Plus, ChevronDown, ChevronUp, ExternalLink, Eye } from 'lucide-react'

const convictionColor = { High: 'green', Medium: 'blue', Exploring: 'gray' }

function pctToTarget(current, target) {
  if (!target) return null
  return ((current - target) / target) * 100
}

export default function WatchlistPage() {
  const [expanded, setExpanded] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const showToast = useToast()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitle sub="Stocks you're tracking before you buy">Watchlist</PageTitle>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={13} className={`transition-transform duration-200 ${showAdd ? 'rotate-45' : ''}`} /> Add stock
        </button>
      </div>

      {/* Add form */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: showAdd ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <Card className="mb-0">
            <CardTitle>Add to watchlist</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Ticker symbol</label>
                <input placeholder="e.g. NOVO-B.CO" className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Target buy price</label>
                <input placeholder="e.g. 450" className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Conviction</label>
                <select className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Exploring</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-xs text-muted mb-1.5 block">Investment thesis</label>
                <textarea placeholder="Why do you want to buy this stock?" rows={2} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors" />
              </div>
              <div className="md:col-span-3 flex gap-2 pt-1">
                <button onClick={() => { setShowAdd(false); showToast('Added to your watchlist') }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors">Save</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-surface-2 border border-border text-muted text-xs font-semibold rounded-md hover:text-ink hover:border-border transition-colors">Cancel</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Watchlist items */}
      {watchlist.length === 0 ? (
        <Card>
          <EmptyState
            icon={Eye}
            title="Your watchlist is empty"
            sub="Add stocks you're considering buying to track them against a target price and jot down your thesis."
          />
        </Card>
      ) : (
      <div className="space-y-3 sm:space-y-4">
        {watchlist.map(item => {
          const pct = pctToTarget(item.currentPrice, item.targetPrice)
          const isExpanded = expanded === item.ticker
          const relatedNews = news.filter(n => n.ticker === item.ticker)

          return (
            <Card key={item.ticker}>
              <div className="flex items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-ink">{item.name}</span>
                    <span className="text-xs text-muted bg-surface-2 px-2 py-0.5 rounded font-mono">{item.ticker}</span>
                    <Badge color={convictionColor[item.conviction]}>{item.conviction}</Badge>
                  </div>
                  <p className="text-xs text-muted line-clamp-2">{item.thesis}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(t => (
                      <span key={t} className="text-xs bg-surface-2 text-muted px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Price vs target */}
                <div className="text-right flex-shrink-0 ml-auto">
                  <p className="text-base font-bold text-ink tabular-nums">{item.currentPrice} {item.currency}</p>
                  {item.targetPrice ? (
                    <>
                      <p className="text-xs text-muted tabular-nums">Target: {item.targetPrice}</p>
                      <p className={`text-xs font-semibold tabular-nums ${pnlColor(pct != null ? -pct : 0)}`}>
                        {pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs target` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-blue-400 font-medium">DCA — any price</p>
                  )}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.ticker)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-blue-400 mt-1.5 ml-auto transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? 'Less' : 'More'}
                  </button>
                </div>
              </div>

              {/* Expanded section */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-xs text-muted font-semibold mb-1">Full thesis</p>
                    <p className="text-xs text-ink2 leading-relaxed">{item.thesis}</p>
                  </div>
                  {relatedNews.length > 0 && (
                    <div>
                      <p className="text-xs text-muted font-semibold mb-2">Latest news</p>
                      <div className="space-y-2">
                        {relatedNews.map((n, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-ink2">{n.headline}</p>
                              <p className="text-xs text-muted mt-0.5">{n.source} · {n.time}</p>
                            </div>
                            {n.url !== '#' && <ExternalLink size={12} className="text-muted flex-shrink-0 mt-0.5" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => showToast('Thesis updated')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">Edit thesis</button>
                    <span className="text-border">·</span>
                    <button onClick={() => showToast('Removed from watchlist')} className="text-xs text-muted hover:text-red-400 transition-colors font-medium">Remove</button>
                  </div>
                </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      )}
    </div>
  )
}
