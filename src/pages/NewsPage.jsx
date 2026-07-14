import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, EmptyState } from '../components/Card'
import { useToast } from '../components/Toast'
import { fetchNews } from '../services/newsService'
import { fetchSavedArticles, saveArticle, deleteSavedArticle } from '../services/savedArticlesService'
import { ExternalLink, Rss, Bookmark, BookmarkCheck } from 'lucide-react'

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

export default function NewsPage() {
  const [allNews, setAllNews]   = useState([])
  const [ticker, setTicker]     = useState('all')
  const [loading, setLoading]   = useState(true)
  const [savedMap, setSavedMap] = useState({})  // url → savedArticle.id
  const showToast = useToast()

  useEffect(() => {
    fetchNews()
      .then(items => { setAllNews(items); setLoading(false) })
      .catch(() => setLoading(false))
    loadSaved()
  }, [])

  async function loadSaved() {
    try {
      const articles = await fetchSavedArticles()
      const map = {}
      for (const a of articles) {
        if (a.url) map[a.url] = a.id
      }
      setSavedMap(map)
    } catch {}
  }

  async function handleBookmark(item) {
    if (!item.url) return
    if (savedMap[item.url]) {
      // Already saved — remove
      try {
        await deleteSavedArticle(savedMap[item.url])
        setSavedMap(m => { const next = { ...m }; delete next[item.url]; return next })
        showToast('Removed from research')
      } catch {
        showToast('Could not remove — try again')
      }
    } else {
      // Save
      try {
        const doc = await saveArticle({
          type:      'article',
          url:       item.url,
          headline:  item.headline,
          tickers:   item.ticker ? [item.ticker] : [],
          source:    item.source || '',
          published: item.published || '',
        })
        setSavedMap(m => ({ ...m, [item.url]: doc.id }))
        showToast('Saved to your research')
      } catch {
        showToast('Failed to save — try again')
      }
    }
  }

  const tickers = ['all', ...Array.from(new Set(allNews.map(n => n.ticker))).sort()]
  const filtered = ticker === 'all' ? allNews : allNews.filter(n => n.ticker === ticker)

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageTitle sub="Latest headlines from your portfolio and watchlist">News</PageTitle>

      {/* Ticker filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {tickers.map(t => (
          <button
            key={t}
            onClick={() => setTicker(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap
              ${ticker === t
                ? 'bg-blue-600 text-white'
                : 'bg-surface-2 text-muted hover:text-ink border border-border'
              }`}
          >
            {t === 'all' ? 'All tickers' : t}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle>
          {ticker === 'all' ? 'All headlines' : ticker} — {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </CardTitle>

        {loading && (
          <div className="py-10 text-center text-xs text-muted animate-pulse">Loading news…</div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Rss}
            title="No headlines yet"
            sub="Run the pipeline to fetch news for your portfolio and watchlist tickers."
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-border -mx-4 sm:-mx-5 px-4 sm:px-5">
            {filtered.map((item, i) => {
              const isSaved = item.url && !!savedMap[item.url]
              return (
                <div key={i} className="flex items-start gap-3 py-3 hover:bg-surface-2 -mx-4 sm:-mx-5 px-4 sm:px-5 transition-colors">
                  {/* Ticker badge */}
                  <span className="flex-shrink-0 mt-0.5 font-mono text-[10px] font-bold text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded w-20 text-center truncate">
                    {item.ticker}
                  </span>

                  {/* Headline + meta */}
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

                  {/* Actions */}
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
                        tabIndex={-1}
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
      </Card>
    </div>
  )
}
