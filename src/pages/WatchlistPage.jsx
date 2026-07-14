import { useEffect, useRef, useState } from 'react'
import { Card, CardTitle, PageTitle, Badge, EmptyState, pnlColor, pnlSign } from '../components/Card'
import { useToast } from '../components/Toast'
import { watchlist as mockWatchlist, news } from '../data/mockData'
import { fetchWatchlist, addWatchlistItem, removeWatchlistItem } from '../services/watchlistService'
import { Plus, ChevronDown, ChevronUp, ExternalLink, Eye, Trash2 } from 'lucide-react'

const convictionColor = { High: 'green', Medium: 'blue', Exploring: 'gray' }

function pctToTarget(current, target) {
  if (!target || !current) return null
  return ((current - target) / target) * 100
}

export default function WatchlistPage() {
  const [items, setItems]       = useState(mockWatchlist)
  const [expanded, setExpanded] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const showToast = useToast()

  const tickerRef     = useRef()
  const nameRef       = useRef()
  const targetRef     = useRef()
  const convictionRef = useRef()
  const thesisRef     = useRef()

  useEffect(() => {
    fetchWatchlist()
      .then(data => { if (data.length > 0) setItems(data) })
      .catch(() => {})
  }, [])

  async function handleSave() {
    const ticker = tickerRef.current?.value.trim().toUpperCase()
    if (!ticker) return showToast('Please enter a ticker symbol')
    setSaving(true)
    try {
      await addWatchlistItem({
        ticker,
        name:        nameRef.current?.value.trim() || ticker,
        targetPrice: parseFloat(targetRef.current?.value) || null,
        conviction:  convictionRef.current?.value || 'Exploring',
        thesis:      thesisRef.current?.value.trim() || '',
        status:      'Watching',
        tags:        [],
      })
      const updated = await fetchWatchlist()
      setItems(updated)
      setShowAdd(false)
      showToast('Added to your watchlist')
      if (tickerRef.current) tickerRef.current.value = ''
      if (nameRef.current)   nameRef.current.value = ''
      if (targetRef.current) targetRef.current.value = ''
      if (thesisRef.current) thesisRef.current.value = ''
    } catch {
      showToast('Failed to save — try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id, ticker) {
    try {
      await removeWatchlistItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      showToast(`Removed ${ticker} from watchlist`)
    } catch {
      showToast('Failed to remove — try again')
    }
  }

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
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: showAdd ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <Card className="mb-0">
            <CardTitle>Add to watchlist</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Ticker symbol</label>
                <input ref={tickerRef} placeholder="e.g. DSV.CO" className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Company name</label>
                <input ref={nameRef} placeholder="e.g. DSV A/S" className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Target buy price (DKK)</label>
                <input ref={targetRef} type="number" placeholder="e.g. 450" className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Conviction</label>
                <select ref={convictionRef} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Exploring</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted mb-1.5 block">Investment thesis</label>
                <textarea ref={thesisRef} placeholder="Why do you want to buy this stock?" rows={2} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors" />
              </div>
              <div className="md:col-span-3 flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-surface-2 border border-border text-muted text-xs font-semibold rounded-md hover:text-ink transition-colors">Cancel</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Watchlist items */}
      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Eye} title="Your watchlist is empty" sub="Add stocks you're considering buying to track them against a target price and jot down your thesis." />
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map(item => {
            const pct        = pctToTarget(item.currentPrice, item.targetPrice)
            const isExpanded = expanded === item.ticker
            const relatedNews = news.filter(n => n.ticker === item.ticker)

            return (
              <Card key={item.id || item.ticker}>
                <div className="flex items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-ink">{item.name}</span>
                      <span className="text-xs text-muted bg-surface-2 px-2 py-0.5 rounded font-mono">{item.ticker}</span>
                      <Badge color={convictionColor[item.conviction]}>{item.conviction}</Badge>
                    </div>
                    <p className="text-xs text-muted line-clamp-2">{item.thesis}</p>
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map(t => (
                          <span key={t} className="text-xs bg-surface-2 text-muted px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 ml-auto">
                    {item.currentPrice && (
                      <p className="text-base font-bold text-ink tabular-nums">{item.currentPrice} {item.currency}</p>
                    )}
                    {item.targetPrice ? (
                      <>
                        <p className="text-xs text-muted tabular-nums">Target: {item.targetPrice}</p>
                        {pct != null && (
                          <p className={`text-xs font-semibold tabular-nums ${pnlColor(-pct)}`}>
                            {pct > 0 ? '+' : ''}{pct.toFixed(1)}% vs target
                          </p>
                        )}
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

                <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs text-muted font-semibold mb-1">Full thesis</p>
                        <p className="text-xs text-ink2 leading-relaxed">{item.thesis || '—'}</p>
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
                      <p className="text-xs text-muted">Added {item.dateAdded || '—'}</p>
                      <div className="flex gap-2">
                        {item.id && (
                          <button onClick={() => handleRemove(item.id, item.ticker)} className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors font-medium">
                            <Trash2 size={11} /> Remove
                          </button>
                        )}
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
