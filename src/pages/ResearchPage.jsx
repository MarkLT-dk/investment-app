import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, EmptyState } from '../components/Card'
import { useToast } from '../components/Toast'
import { fetchNews } from '../services/newsService'
import { fetchSavedArticles, saveArticle, deleteSavedArticle } from '../services/savedArticlesService'
import { Plus, ExternalLink, FileText, StickyNote, Trash2, Newspaper } from 'lucide-react'

export default function ResearchPage() {
  const [showAdd, setShowAdd]     = useState(false)
  const [noteType, setNoteType]   = useState('article')
  const [news, setNews]           = useState([])
  const [saved, setSaved]         = useState([])
  const [form, setForm]           = useState({ url: '', headline: '', tickers: '' })
  const [saving, setSaving]       = useState(false)
  const showToast = useToast()

  useEffect(() => {
    fetchNews().then(setNews).catch(() => {})
    loadSaved()
  }, [])

  async function loadSaved() {
    try {
      setSaved(await fetchSavedArticles())
    } catch {}
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
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

  async function handleDelete(id) {
    try {
      await deleteSavedArticle(id)
      setSaved(s => s.filter(x => x.id !== id))
      showToast('Removed')
    } catch {
      showToast('Could not remove — try again')
    }
  }

  async function handleSaveFromNews(item) {
    try {
      await saveArticle({
        type:      'article',
        url:       item.url || null,
        headline:  item.headline,
        tickers:   item.ticker ? [item.ticker] : [],
        source:    item.source || '',
        published: item.published || '',
      })
      showToast('Saved to your research')
      loadSaved()
    } catch {
      showToast('Failed to save — try again')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitle sub="Saved reading, notes, and the latest news on your holdings">Research</PageTitle>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={13} className={`transition-transform duration-200 ${showAdd ? 'rotate-45' : ''}`} /> Save article / note
        </button>
      </div>

      {/* Add form */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: showAdd ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <Card className="mb-0">
            <CardTitle>Save research</CardTitle>
            <div className="flex gap-2 mb-4">
              {['article', 'note'].map(t => (
                <button
                  key={t}
                  onClick={() => setNoteType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${noteType === t ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink'}`}
                >
                  {t === 'article' ? 'Article URL' : 'Personal note'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {noteType === 'article' && (
                <div className="md:col-span-2">
                  <label className="text-xs text-muted mb-1.5 block">Article URL</label>
                  <input
                    value={form.url}
                    onChange={e => setField('url', e.target.value)}
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
                  onChange={e => setField('headline', e.target.value)}
                  placeholder={noteType === 'article' ? 'Article headline...' : 'Write your note here...'}
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Linked tickers (comma separated)</label>
                <input
                  value={form.tickers}
                  onChange={e => setField('tickers', e.target.value)}
                  placeholder="e.g. AMZN, DSV.CO"
                  className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.headline.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-surface-2 border border-border text-muted text-xs font-semibold rounded-md hover:text-ink hover:border-border transition-colors">Cancel</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Saved research */}
        <Card>
          <CardTitle>Saved articles & notes</CardTitle>
          {saved.length === 0 ? (
            <EmptyState icon={StickyNote} title="Nothing saved yet" sub="Save articles or jot notes on stocks you're researching — they'll show up here." />
          ) : (
            <div className="space-y-0">
              {saved.map(item => (
                <div key={item.id} className="py-3.5 border-b border-border last:border-0">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {item.type === 'note'
                        ? <StickyNote size={13} className="text-yellow-400" />
                        : <FileText size={13} className="text-blue-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted mb-1 tabular-nums">
                        {item.source}{item.source && item.savedAt ? ' · ' : ''}{item.savedAt ? item.savedAt.slice(0, 10) : ''}
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
                      <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-950/60 transition-colors">
                        <Trash2 size={12} className="text-muted hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Live news feed */}
        <Card>
          <CardTitle>Latest news — holdings & watchlist</CardTitle>
          {news.length === 0 ? (
            <EmptyState icon={Newspaper} title="No news right now" sub="Headlines about your holdings and watchlist will show up here." />
          ) : (
            <div className="space-y-0">
              {news.map((item, i) => (
                <div key={i} className="py-3.5 border-b border-border last:border-0">
                  <p className="text-xs text-muted mb-1 tabular-nums">{item.source}{item.source && item.published ? ' · ' : ''}{item.published ? item.published.slice(0, 10) : ''}</p>
                  <p className="text-xs text-ink2 leading-relaxed mb-2">{item.headline}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs bg-surface-2 text-blue-300 px-1.5 py-0.5 rounded">{item.ticker}</span>
                    <button
                      onClick={() => handleSaveFromNews(item)}
                      className="text-xs text-muted hover:text-blue-400 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Plus size={10} /> Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
