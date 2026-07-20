import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, Badge, EmptyState, pnlColor } from '../components/Card'
import { useToast } from '../components/Toast'
import { fetchWatchlist, addWatchlistItem, updateWatchlistItem, removeWatchlistItem } from '../services/watchlistService'
import { Plus, Eye, Trash2, Pencil, X, TrendingUp, Map } from 'lucide-react'

const STATUS_OPTIONS = ['watching', 'on hold', 'bought', 'avoided']
const STATUS_COLORS  = { watching: 'blue', 'on hold': 'yellow', bought: 'green', avoided: 'red' }

const EMPTY_STOCK = { entryType: 'stock', ticker: '', name: '', targetBuyPriceDkk: '', stopLossDkk: '', status: 'watching', thesis: '', notes: '' }
const EMPTY_AREA  = { entryType: 'area',  areaName: '',                                                 status: 'watching', thesis: '', notes: '' }

function pctToTarget(current, target) {
  if (!target || !current) return null
  return ((current - target) / target) * 100
}

function EntryModal({ entry, onClose, onSaved, showToast }) {
  const isEdit = !!entry
  const [tab, setTab]     = useState(isEdit ? entry.entryType ?? 'stock' : 'stock')
  const [form, setForm]   = useState(isEdit ? {
    entryType:         entry.entryType ?? 'stock',
    ticker:            entry.ticker    ?? '',
    name:              entry.name      ?? '',
    areaName:          entry.areaName  ?? '',
    targetBuyPriceDkk: entry.targetBuyPriceDkk != null ? String(entry.targetBuyPriceDkk) : (entry.targetPrice != null ? String(entry.targetPrice) : ''),
    stopLossDkk:       entry.stopLossDkk != null ? String(entry.stopLossDkk) : '',
    status:            entry.status    ?? 'watching',
    thesis:            entry.thesis    ?? '',
    notes:             entry.notes     ?? '',
  } : EMPTY_STOCK)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function switchTab(t) {
    setTab(t)
    set('entryType', t)
  }

  async function handleSave() {
    if (form.entryType === 'stock' && !form.ticker.trim()) return showToast('Please enter a ticker symbol')
    if (form.entryType === 'area'  && !form.areaName.trim()) return showToast('Please enter an area name')
    setSaving(true)
    try {
      const payload = {
        entryType:  form.entryType,
        status:     form.status,
        thesis:     form.thesis.trim(),
        notes:      form.notes.trim(),
      }
      if (form.entryType === 'stock') {
        payload.ticker            = form.ticker.trim().toUpperCase()
        payload.name              = form.name.trim() || form.ticker.trim().toUpperCase()
        payload.targetBuyPriceDkk = form.targetBuyPriceDkk ? parseFloat(form.targetBuyPriceDkk) : null
        payload.stopLossDkk       = form.stopLossDkk ? parseFloat(form.stopLossDkk) : null
      } else {
        payload.areaName = form.areaName.trim()
      }

      if (isEdit) {
        await updateWatchlistItem(entry.id, payload)
        showToast('Watchlist entry updated')
      } else {
        await addWatchlistItem(payload)
        showToast(form.entryType === 'stock' ? `${payload.ticker} added to watchlist` : `"${payload.areaName}" added`)
      }
      onSaved()
      onClose()
    } catch {
      showToast('Failed to save — try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">{isEdit ? 'Edit entry' : 'Add to watchlist'}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={16} /></button>
        </div>

        {/* Type tabs — only shown when adding */}
        {!isEdit && (
          <div className="flex gap-1 px-5 pt-4">
            <button
              onClick={() => switchTab('stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'stock' ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink border border-border'}`}
            >
              <TrendingUp size={11} /> Stock / ETF
            </button>
            <button
              onClick={() => switchTab('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'area' ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink border border-border'}`}
            >
              <Map size={11} /> Investment area
            </button>
          </div>
        )}

        <div className="p-5 space-y-3">
          {tab === 'stock' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Ticker symbol</label>
                <input
                  value={form.ticker} onChange={e => set('ticker', e.target.value)}
                  placeholder="e.g. DSV.CO"
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Company name</label>
                <input
                  value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. DSV A/S"
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Target buy price (DKK)</label>
                <input
                  type="number" value={form.targetBuyPriceDkk} onChange={e => set('targetBuyPriceDkk', e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Stop loss (DKK)</label>
                <input
                  type="number" value={form.stopLossDkk} onChange={e => set('stopLossDkk', e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-muted mb-1.5 block">Area name</label>
              <input
                value={form.areaName} onChange={e => set('areaName', e.target.value)}
                placeholder="e.g. European Renewable Energy ETFs"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="text-[11px] text-muted mt-1.5">The daily brief will research this theme and suggest specific instruments.</p>
            </div>
          )}

          <div>
            <label className="text-xs text-muted mb-1.5 block">Status</label>
            <select
              value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors capitalize"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted mb-1.5 block">Investment thesis</label>
            <textarea
              value={form.thesis} onChange={e => set('thesis', e.target.value)}
              placeholder="Why are you interested in this?"
              rows={2}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted mb-1.5 block">Notes</label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes…"
              rows={2}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-2 border border-border text-muted text-xs font-semibold rounded-md hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WatchlistPage() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const showToast = useToast()

  async function reload() {
    try {
      const data = await fetchWatchlist()
      setItems(data)
    } catch {}
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  async function handleRemove(id, label) {
    if (!window.confirm(`Remove "${label}" from your watchlist?`)) return
    try {
      await removeWatchlistItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Removed from watchlist')
    } catch {
      showToast('Failed to remove — try again')
    }
  }

  const stocks = items.filter(i => !i.entryType || i.entryType === 'stock')
  const areas  = items.filter(i => i.entryType === 'area')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitle sub="Stocks and investment areas you're tracking">Watchlist</PageTitle>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {loading && (
        <Card><p className="text-xs text-muted py-6 text-center animate-pulse">Loading watchlist…</p></Card>
      )}

      {!loading && items.length === 0 && (
        <Card>
          <EmptyState icon={Eye} title="Your watchlist is empty" sub="Add stocks or investment areas you're considering." />
        </Card>
      )}

      {/* Stocks */}
      {stocks.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-1">Stocks & ETFs</p>
          {stocks.map(item => {
            const pct = pctToTarget(item.currentPrice, item.targetBuyPriceDkk ?? item.targetPrice)
            const label = item.name || item.ticker
            return (
              <Card key={item.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-ink">{item.name || item.ticker}</span>
                      {item.ticker && (
                        <span className="text-xs text-muted bg-surface-2 px-2 py-0.5 rounded font-mono">{item.ticker}</span>
                      )}
                      <Badge color={STATUS_COLORS[item.status] ?? 'gray'}>{item.status ?? 'watching'}</Badge>
                    </div>
                    {item.thesis && <p className="text-xs text-muted line-clamp-2">{item.thesis}</p>}
                    {item.notes && <p className="text-xs text-muted/70 mt-1 italic line-clamp-1">{item.notes}</p>}
                  </div>

                  <div className="text-right flex-shrink-0 space-y-0.5">
                    {item.targetBuyPriceDkk != null && (
                      <p className="text-xs text-muted tabular-nums">Target {item.targetBuyPriceDkk} DKK</p>
                    )}
                    {item.stopLossDkk != null && (
                      <p className="text-xs text-muted tabular-nums">Stop {item.stopLossDkk} DKK</p>
                    )}
                    {pct != null && (
                      <p className={`text-xs font-semibold tabular-nums ${pnlColor(-pct)}`}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}% vs target
                      </p>
                    )}
                    <p className="text-[11px] text-muted">Added {item.dateAdded ?? '—'}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setEditEntry(item)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-blue-400 transition-colors font-medium"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleRemove(item.id, label)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors font-medium"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Investment areas */}
      {areas.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-1">Investment areas</p>
          {areas.map(item => (
            <Card key={item.id}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-purple-950/60 border border-purple-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Map size={13} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-ink">{item.areaName}</span>
                    <Badge color={STATUS_COLORS[item.status] ?? 'gray'}>{item.status ?? 'watching'}</Badge>
                  </div>
                  {item.thesis && <p className="text-xs text-muted">{item.thesis}</p>}
                  {item.notes && <p className="text-xs text-muted/70 mt-1 italic">{item.notes}</p>}
                  <p className="text-[11px] text-muted mt-1.5">Daily brief will research this theme and suggest instruments.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => setEditEntry(item)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-blue-400 transition-colors font-medium"
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={() => handleRemove(item.id, item.areaName)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors font-medium"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <EntryModal onClose={() => setShowAdd(false)} onSaved={reload} showToast={showToast} />
      )}
      {editEntry && (
        <EntryModal entry={editEntry} onClose={() => setEditEntry(null)} onSaved={reload} showToast={showToast} />
      )}
    </div>
  )
}
