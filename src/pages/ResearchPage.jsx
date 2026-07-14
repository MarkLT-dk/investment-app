import { useEffect, useState } from 'react'
import { Card, CardTitle, PageTitle, EmptyState } from '../components/Card'
import { useToast } from '../components/Toast'
import { savedResearch } from '../data/mockData'
import { fetchNews } from '../services/newsService'
import { Plus, ExternalLink, FileText, StickyNote, Trash2, Newspaper } from 'lucide-react'

export default function ResearchPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [noteType, setNoteType] = useState('article')
  const [news, setNews] = useState([])
  const showToast = useToast()

  useEffect(() => {
    fetchNews().then(setNews).catch(() => {})
  }, [])

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
                <input placeholder="https://..." className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="text-xs text-muted mb-1.5 block">{noteType === 'article' ? 'Headline / title' : 'Note'}</label>
              <textarea rows={2} placeholder={noteType === 'article' ? 'Article headline...' : 'Write your note here...'} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Linked tickers (comma separated)</label>
              <input placeholder="e.g. AMZN, DSV.CO" className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => { setShowAdd(false); showToast(noteType === 'article' ? 'Article saved' : 'Note saved') }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors">Save</button>
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
          {savedResearch.length === 0 ? (
            <EmptyState icon={StickyNote} title="Nothing saved yet" sub="Save articles or jot notes on stocks you're researching — they'll show up here." />
          ) : (
          <div className="space-y-0">
            {savedResearch.map(item => (
              <div key={item.id} className="py-3.5 border-b border-border last:border-0">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {item.type === 'note'
                      ? <StickyNote size={13} className="text-yellow-400" />
                      : <FileText size={13} className="text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted mb-1 tabular-nums">{item.source} · {item.savedAt}</p>
                    <p className="text-xs text-ink2 leading-relaxed">{item.headline}</p>
                    {item.notes && (
                      <p className="text-xs text-muted mt-1.5 italic border-l-2 border-border pl-2">{item.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tickers.map(t => (
                        <span key={t} className="font-mono text-xs bg-surface-2 text-blue-300 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.url && <button onClick={() => showToast('Opening link…')} className="p-1 rounded hover:bg-surface-2 transition-colors"><ExternalLink size={12} className="text-muted hover:text-ink transition-colors" /></button>}
                    <button onClick={() => showToast('Removed')} className="p-1 rounded hover:bg-red-950/60 transition-colors"><Trash2 size={12} className="text-muted hover:text-red-400 transition-colors" /></button>
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
                <p className="text-xs text-muted mb-1 tabular-nums">{item.source} · {item.time}</p>
                <p className="text-xs text-ink2 leading-relaxed mb-2">{item.headline}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs bg-surface-2 text-blue-300 px-1.5 py-0.5 rounded">{item.ticker}</span>
                  <button onClick={() => showToast('Saved to your research')} className="text-xs text-muted hover:text-blue-400 transition-colors flex items-center gap-1 font-medium">
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
