import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, Badge, EmptyState, pnlColor, pnlSign } from '../components/Card'
import { useToast } from '../components/Toast'
import { fetchAnalyticsData } from '../services/analyticsService'
import { fetchPositions } from '../services/positionService'
import { fetchLatestBrief } from '../services/dailyBriefService'
import { fetchNews } from '../services/newsService'
import { fetchSavedArticles, saveArticle, deleteSavedArticle } from '../services/savedArticlesService'
import {
  addDoc, collection, getDocs, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  Plus, Zap, SearchX, TrendingUp, TrendingDown, Minus, Brain, AlertCircle, Map,
  ExternalLink, Bookmark, BookmarkCheck, FileText, StickyNote, Trash2,
  Rss, CheckCircle2, Circle, ListTodo,
} from 'lucide-react'

const REC_LABELS = {
  strong_buy:   { label: 'Strong Buy',   color: 'green'  },
  buy:          { label: 'Buy',          color: 'blue'   },
  hold:         { label: 'Hold',         color: 'yellow' },
  underperform: { label: 'Underperform', color: 'red'    },
  sell:         { label: 'Sell',         color: 'red'    },
}

const VERDICT_STYLE = {
  'BUY NOW': { color: 'green',  icon: TrendingUp  },
  'WAIT':    { color: 'blue',   icon: Minus       },
  'WATCH':   { color: 'yellow', icon: AlertCircle },
  'AVOID':   { color: 'red',    icon: TrendingDown },
}

const STATUS_COLORS = {
  watching:  'blue',
  'on hold': 'yellow',
  bought:    'green',
  avoided:   'red',
}

const TODO_TYPES = {
  buy:      { label: 'Buy',      color: 'green' },
  sell:     { label: 'Sell',     color: 'red'   },
  research: { label: 'Research', color: 'blue'  },
  other:    { label: 'Other',    color: 'gray'  },
}

function relativeTime(published) {
  if (!published) return ''
  const d = new Date(published.replace(' ', 'T') + (published.includes('+') ? '' : 'Z'))
  if (isNaN(d)) return published.slice(0, 10)
  const diffH = Math.round((Date.now() - d.getTime()) / 3600000)
  if (diffH < 1)  return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7)  return `${diffD}d ago`
  return d.toLocaleDateString('en-DK', { day: 'numeric', month: 'short' })
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
  // Screener / analytics state
  const [filters, setFilters]           = useState({ maxPE: '', minUpside: '', recommendation: '' })
  const [screenerMode, setScreenerMode] = useState('watchlist')
  const [watchlistFilter, setWatchlistFilter] = useState('all')
  const [positions, setPositions]       = useState([])
  const [liveData, setLiveData]         = useState(null)
  const [brief, setBrief]               = useState(null)

  // News state
  const [allNews, setAllNews]           = useState([])
  const [newsTicker, setNewsTicker]     = useState('all')
  const [newsLoading, setNewsLoading]   = useState(true)
  const [savedMap, setSavedMap]         = useState({})

  // Research state
  const [showAdd, setShowAdd]   = useState(false)
  const [noteType, setNoteType] = useState('article')
  const [saved, setSaved]       = useState([])
  const [form, setForm]         = useState({ url: '', headline: '', tickers: '' })
  const [saving, setSaving]     = useState(false)

  // News / Research tab
  const [intelTab, setIntelTab] = useState('news')

  // Todo state
  const [todos, setTodos]             = useState([])
  const [showTodoAdd, setShowTodoAdd] = useState(false)
  const [todoForm, setTodoForm]       = useState({ text: '', type: 'buy', ticker: '' })
  const [addingTodo, setAddingTodo]   = useState(false)

  const showToast = useToast()

  useEffect(() => {
    fetchPositions().then(p => { if (p.length) setPositions(p) }).catch(() => {})
    fetchAnalyticsData().then(setLiveData).catch(() => {})
    fetchLatestBrief().then(setBrief).catch(() => {})
    fetchNews().then(items => { setAllNews(items); setNewsLoading(false) }).catch(() => setNewsLoading(false))
    loadSaved()
    loadTodos()
  }, [])

  async function loadSaved() {
    try {
      const articles = await fetchSavedArticles()
      setSaved(articles)
      const map = {}
      for (const a of articles) {
        if (a.url) map[a.url] = a.id
      }
      setSavedMap(map)
    } catch {}
  }

  async function loadTodos() {
    try {
      const snap  = await getDocs(collection(db, 'todos'))
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        return (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1
      })
      setTodos(items)
    } catch {}
  }

  async function handleAddTodo() {
    if (!todoForm.text.trim()) return
    setAddingTodo(true)
    try {
      await addDoc(collection(db, 'todos'), {
        text:      todoForm.text.trim(),
        type:      todoForm.type,
        ticker:    todoForm.ticker.trim().toUpperCase() || null,
        done:      false,
        createdAt: new Date().toISOString(),
      })
      setTodoForm({ text: '', type: 'buy', ticker: '' })
      setShowTodoAdd(false)
      showToast('Action added')
      loadTodos()
    } catch {
      showToast('Failed to add — try again')
    } finally {
      setAddingTodo(false)
    }
  }

  async function handleToggleTodo(todo) {
    try {
      await updateDoc(doc(db, 'todos', todo.id), { done: !todo.done })
      setTodos(ts =>
        ts.map(t => t.id === todo.id ? { ...t, done: !t.done } : t)
          .sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1
            return (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1
          })
      )
    } catch {
      showToast('Failed to update')
    }
  }

  async function handleDeleteTodo(id) {
    try {
      await deleteDoc(doc(db, 'todos', id))
      setTodos(ts => ts.filter(t => t.id !== id))
    } catch {
      showToast('Failed to delete')
    }
  }

  async function handleBookmark(item) {
    if (!item.url) return
    if (savedMap[item.url]) {
      try {
        await deleteSavedArticle(savedMap[item.url])
        setSavedMap(m => { const next = { ...m }; delete next[item.url]; return next })
        setSaved(s => s.filter(a => a.url !== item.url))
        showToast('Removed from research')
      } catch {
        showToast('Could not remove — try again')
      }
    } else {
      try {
        const d = await saveArticle({
          type:      'article',
          url:       item.url,
          headline:  item.headline,
          tickers:   item.ticker ? [item.ticker] : [],
          source:    item.source || '',
          published: item.published || '',
        })
        setSavedMap(m => ({ ...m, [item.url]: d.id }))
        showToast('Saved to research')
        loadSaved()
      } catch {
        showToast('Failed to save — try again')
      }
    }
  }

  async function handleSaveResearch() {
    if (!form.headline.trim()) return
    setSaving(true)
    try {
      await saveArticle({
        type:     noteType,
        url:      noteType === 'article' ? form.url.trim() : null,
        headline: form.headline.trim(),
        tickers:  form.tickers.split(',').map(t => t.trim()).filter(Boolean),
        source:   noteType === 'article' ? 'Manual' : 'Note',
      })
      setForm({ url: '', headline: '', tickers: '' })
      setShowAdd(false)
      showToast(noteType === 'article' ? 'Article saved' : 'Note saved')
      loadSaved()
    } catch {
      showToast('Failed to save — try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSaved(id) {
    try {
      await deleteSavedArticle(id)
      setSaved(s => s.filter(x => x.id !== id))
      showToast('Removed')
    } catch {
      showToast('Could not remove — try again')
    }
  }

  async function handleAddToWatchlist(ticker, name) {
    const alreadyIn = liveData?.watchlistTickers?.some(w => w.ticker === ticker)
    if (alreadyIn) { showToast(`${ticker} is already on your watchlist`); return }
    try {
      await addDoc(collection(db, 'watchlist'), {
        ticker,
        name,
        dateAdded: new Date().toISOString().slice(0, 10),
        status: 'watching',
      })
      showToast(`${ticker} added to watchlist`)
    } catch {
      showToast(`Failed to add ${ticker}`)
    }
  }

  const screenerRows = positions.filter(p => {
    const f  = liveData?.fundamentals?.[p.ticker] ?? {}
    const ar = liveData?.analystRatings?.[p.ticker] ?? {}
    if (filters.maxPE          && f.peRatio != null && f.peRatio > parseFloat(filters.maxPE)) return false
    if (filters.minUpside      && (f.upsideToTarget == null || f.upsideToTarget * 100 < parseFloat(filters.minUpside))) return false
    if (filters.recommendation && ar.recommendationKey !== filters.recommendation) return false
    return true
  })

  const watchlistRows     = (liveData?.watchlistTickers ?? []).filter(w =>
    watchlistFilter === 'all' || w.status === watchlistFilter
  )
  const watchlistStatuses = ['all', ...Array.from(new Set(
    (liveData?.watchlistTickers ?? []).map(w => w.status).filter(Boolean)
  ))]

  const newsTickers  = ['all', ...Array.from(new Set(allNews.map(n => n.ticker))).sort()]
  const filteredNews = newsTicker === 'all' ? allNews : allNews.filter(n => n.ticker === newsTicker)
  const pendingTodos = todos.filter(t => !t.done)
  const doneTodos    = todos.filter(t =>  t.done)

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="Actions, intelligence, news and stock screening">Discover</PageTitle>

      {/* ── Actions / To-Do ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListTodo size={14} className="text-blue-400" />
            <CardTitle>Actions</CardTitle>
            {pendingTodos.length > 0 && (
              <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full px-1.5 py-0.5 leading-none">
                {pendingTodos.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowTodoAdd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            <Plus size={13} className={`transition-transform duration-200 ${showTodoAdd ? 'rotate-45' : ''}`} />
            Add action
          </button>
        </div>

        {/* Add form */}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: showTodoAdd ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="pb-4 border-b border-border mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(TODO_TYPES).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setTodoForm(f => ({ ...f, type: key }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                      ${todoForm.type === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-surface-2 text-muted hover:text-ink border border-border'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <input
                  value={todoForm.ticker}
                  onChange={e => setTodoForm(f => ({ ...f, ticker: e.target.value }))}
                  placeholder="Ticker (opt.)"
                  className="w-28 flex-shrink-0 bg-surface-2 border border-border rounded px-2.5 py-1.5 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase"
                />
                <input
                  value={todoForm.text}
                  onChange={e => setTodoForm(f => ({ ...f, text: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                  placeholder="Describe the action..."
                  className="flex-1 min-w-0 bg-surface-2 border border-border rounded px-2.5 py-1.5 text-xs text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleAddTodo}
                  disabled={addingTodo || !todoForm.text.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {addingTodo ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => setShowTodoAdd(false)}
                  className="px-3 py-1.5 bg-surface-2 border border-border text-muted text-xs font-semibold rounded-md hover:text-ink transition-colors flex-shrink-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Todo list */}
        {todos.length === 0 ? (
          <EmptyState icon={ListTodo} title="No actions yet" sub="Add buy, sell, or research actions to track your investment to-dos." />
        ) : (
          <div>
            {pendingTodos.map(todo => {
              const typeInfo = TODO_TYPES[todo.type] ?? TODO_TYPES.other
              return (
                <div key={todo.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <button
                    onClick={() => handleToggleTodo(todo)}
                    className="flex-shrink-0 text-muted hover:text-blue-400 transition-colors"
                  >
                    <Circle size={14} />
                  </button>
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <Badge color={typeInfo.color}>{typeInfo.label}</Badge>
                    {todo.ticker && (
                      <span className="font-mono text-xs font-bold text-ink">{todo.ticker}</span>
                    )}
                    <span className="text-xs text-ink2">{todo.text}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-red-950/60 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}

            {doneTodos.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider pt-3 pb-1">Completed</p>
                {doneTodos.map(todo => {
                  const typeInfo = TODO_TYPES[todo.type] ?? TODO_TYPES.other
                  return (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 opacity-50">
                      <button
                        onClick={() => handleToggleTodo(todo)}
                        className="flex-shrink-0 text-green-400"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <Badge color={typeInfo.color}>{typeInfo.label}</Badge>
                        {todo.ticker && (
                          <span className="font-mono text-xs font-bold text-ink line-through">{todo.ticker}</span>
                        )}
                        <span className="text-xs text-ink2 line-through">{todo.text}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-950/60 text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </Card>

      {/* ── Daily Intelligence Brief ── */}
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
              const vs   = VERDICT_STYLE[item.verdict] ?? VERDICT_STYLE['WATCH']
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
                            <span key={j} className="text-[10px] bg-purple-950/40 border border-purple-800/30 rounded px-1.5 py-0.5 text-purple-300">
                              {s}
                            </span>
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

      {/* ── News & Research ── */}
      <Card>
        <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-border">
          {[['news', 'News'], ['research', 'Research']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setIntelTab(id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors
                ${intelTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-2 text-muted hover:text-ink border border-border'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* News tab */}
        {intelTab === 'news' && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {newsTickers.map(t => (
                <button
                  key={t}
                  onClick={() => setNewsTicker(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap
                    ${newsTicker === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-surface-2 text-muted hover:text-ink border border-border'
                    }`}
                >
                  {t === 'all' ? 'All tickers' : t}
                </button>
              ))}
            </div>

            {newsLoading && (
              <div className="py-10 text-center text-xs text-muted animate-pulse">Loading news…</div>
            )}
            {!newsLoading && filteredNews.length === 0 && (
              <EmptyState icon={Rss} title="No headlines yet" sub="Run the pipeline to fetch news for your portfolio and watchlist tickers." />
            )}
            {!newsLoading && filteredNews.length > 0 && (
              <div className="divide-y divide-border -mx-4 sm:-mx-5 px-4 sm:px-5">
                {filteredNews.map((item, i) => {
                  const isSaved = item.url && !!savedMap[item.url]
                  return (
                    <div key={i} className="flex items-start gap-3 py-3 hover:bg-surface-2 -mx-4 sm:-mx-5 px-4 sm:px-5 transition-colors">
                      <span className="flex-shrink-0 mt-0.5 font-mono text-[10px] font-bold text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded w-20 text-center truncate">
                        {item.ticker}
                      </span>
                      <div className="flex-1 min-w-0">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ink2 leading-snug hover:text-blue-300 transition-colors line-clamp-2"
                          >
                            {item.headline}
                          </a>
                        ) : (
                          <p className="text-xs text-ink2 leading-snug line-clamp-2">{item.headline}</p>
                        )}
                        <p className="text-[11px] text-muted mt-0.5">
                          {item.source}{item.source && item.published ? ' · ' : ''}{relativeTime(item.published)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        {item.url && (
                          <button
                            onClick={() => handleBookmark(item)}
                            title={isSaved ? 'Remove from research' : 'Save to research'}
                            className="p-1 rounded hover:bg-surface-2 transition-colors"
                          >
                            {isSaved
                              ? <BookmarkCheck size={13} className="text-blue-400" />
                              : <Bookmark size={13} className="text-muted hover:text-blue-400 transition-colors" />
                            }
                          </button>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-surface-2 text-muted hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Research tab */}
        {intelTab === 'research' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted">Saved articles, notes, and research</span>
              <button
                onClick={() => setShowAdd(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
              >
                <Plus size={13} className={`transition-transform duration-200 ${showAdd ? 'rotate-45' : ''}`} />
                Save article / note
              </button>
            </div>

            {/* Add form */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: showAdd ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="flex gap-2 mb-3">
                    {['article', 'note'].map(t => (
                      <button
                        key={t}
                        onClick={() => setNoteType(t)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize
                          ${noteType === t ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink border border-border'}`}
                      >
                        {t === 'article' ? 'Article URL' : 'Personal note'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {noteType === 'article' && (
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted mb-1.5 block">Article URL</label>
                        <input
                          value={form.url}
                          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="text-xs text-muted mb-1.5 block">{noteType === 'article' ? 'Headline / title' : 'Note'}</label>
                      <textarea
                        rows={2}
                        value={form.headline}
                        onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                        placeholder={noteType === 'article' ? 'Article headline...' : 'Write your note here...'}
                        className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted mb-1.5 block">Linked tickers (comma separated)</label>
                      <input
                        value={form.tickers}
                        onChange={e => setForm(f => ({ ...f, tickers: e.target.value }))}
                        placeholder="e.g. AMZN, NOVO-B.CO"
                        className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleSaveResearch}
                        disabled={saving || !form.headline.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setShowAdd(false)}
                        className="px-4 py-2 bg-surface-2 border border-border text-muted text-xs font-semibold rounded-md hover:text-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {saved.length === 0 ? (
              <EmptyState icon={StickyNote} title="Nothing saved yet" sub="Bookmark headlines from News, or save articles and notes manually." />
            ) : (
              <div>
                {saved.map(item => (
                  <div key={item.id} className="py-3.5 border-b border-border last:border-0">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">
                        {item.type === 'note'
                          ? <StickyNote size={13} className="text-yellow-400" />
                          : <FileText  size={13} className="text-blue-400"   />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted mb-1 tabular-nums">
                          {item.source}{item.source && item.savedAt ? ' · ' : ''}
                          {item.savedAt ? item.savedAt.slice(0, 10) : ''}
                        </p>
                        <p className="text-xs text-ink2 leading-relaxed">{item.headline}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(item.tickers || []).map(t => (
                            <span key={t} className="font-mono text-xs bg-surface-2 text-blue-300 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-surface-2 transition-colors">
                            <ExternalLink size={12} className="text-muted hover:text-ink transition-colors" />
                          </a>
                        )}
                        <button onClick={() => handleDeleteSaved(item.id)} className="p-1 rounded hover:bg-red-950/60 transition-colors">
                          <Trash2 size={12} className="text-muted hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Screener ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Screener</CardTitle>
          <div className="flex gap-1">
            {[['watchlist', 'Watchlist'], ['portfolio', 'Portfolio']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setScreenerMode(id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
                  ${screenerMode === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-2 text-muted hover:text-ink border border-border'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist screener */}
        {screenerMode === 'watchlist' && (
          <>
            <div className="flex gap-1.5 flex-wrap mb-4">
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
                        <EmptyState icon={SearchX} title="No watchlist stocks" sub="Add stocks to your watchlist to see them here." />
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
          </>
        )}

        {/* Portfolio screener */}
        {screenerMode === 'portfolio' && (
          <>
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
                    const f       = liveData?.fundamentals?.[p.ticker]   ?? {}
                    const ar      = liveData?.analystRatings?.[p.ticker] ?? {}
                    const rm      = liveData?.riskMetrics?.[p.ticker]    ?? {}
                    const r1      = rm['1Y'] || rm['2Y'] || {}
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
          </>
        )}
      </Card>
    </div>
  )
}
