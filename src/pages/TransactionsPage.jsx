import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Coins, Plus, Wallet, TrendingUp, X } from 'lucide-react'
import { Card, CardTitle, PageTitle, StatCard, Badge, EmptyState, pnlColor, pnlSign } from '../components/Card'
import { addTransaction, addDividend, addCashTransaction, fetchAllEntries } from '../services/transactionService'

const fmt    = n => n?.toLocaleString('da-DK', { maximumFractionDigits: 0 }) ?? '—'
const fmtDec = n => n?.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'

const TYPE_LABELS  = { BUY: 'Buy', SELL: 'Sell', DIVIDEND: 'Dividend', DEPOSIT: 'Deposit', WITHDRAWAL: 'Withdrawal' }
const FILTER_TABS  = ['All', 'Buys', 'Sells', 'Dividends', 'Cash']

function entryType(e) {
  if (e.entryType === 'DIVIDEND') return 'DIVIDEND'
  if (e.type === 'DEPOSIT' || e.type === 'WITHDRAWAL') return e.type
  return e.type
}

function typeBadge(type) {
  const map = {
    BUY:        { color: 'green',  label: 'Buy'        },
    SELL:       { color: 'red',    label: 'Sell'       },
    DIVIDEND:   { color: 'purple', label: 'Dividend'   },
    DEPOSIT:    { color: 'blue',   label: 'Deposit'    },
    WITHDRAWAL: { color: 'yellow', label: 'Withdrawal' },
  }
  const { color, label } = map[type] ?? { color: 'gray', label: type }
  return <Badge color={color}>{label}</Badge>
}

function typeIcon(type) {
  if (type === 'BUY')        return <ArrowDownLeft size={14} className="text-green-400" />
  if (type === 'SELL')       return <ArrowUpRight  size={14} className="text-red-400"   />
  if (type === 'DIVIDEND')   return <Coins         size={14} className="text-purple-300" />
  if (type === 'DEPOSIT')    return <ArrowDownLeft size={14} className="text-blue-400"  />
  if (type === 'WITHDRAWAL') return <ArrowUpRight  size={14} className="text-yellow-400" />
  return null
}

function filterMatch(e, tab) {
  const t = entryType(e)
  if (tab === 'All')       return true
  if (tab === 'Buys')      return t === 'BUY'
  if (tab === 'Sells')     return t === 'SELL'
  if (tab === 'Dividends') return t === 'DIVIDEND'
  if (tab === 'Cash')      return t === 'DEPOSIT' || t === 'WITHDRAWAL'
  return true
}

function entryDescription(e) {
  const t = entryType(e)
  if (t === 'BUY')        return `Bought ${e.shares?.toLocaleString('da-DK')} shares of ${e.ticker}`
  if (t === 'SELL')       return `Sold ${e.shares?.toLocaleString('da-DK')} shares of ${e.ticker}`
  if (t === 'DIVIDEND')   return `Dividend from ${e.ticker}`
  if (t === 'DEPOSIT')    return e.note || 'Cash deposit'
  if (t === 'WITHDRAWAL') return e.note || 'Cash withdrawal'
  return '—'
}

function entryAmount(e) {
  const t = entryType(e)
  if (t === 'BUY')        return { label: `${fmt(e.costBasisDkk)} DKK`, color: 'text-red-400' }
  if (t === 'SELL')       return { label: `${fmt(e.shares * e.priceDkk - (e.feeDkk || 0))} DKK`, color: 'text-green-400' }
  if (t === 'DIVIDEND')   return { label: `+${fmt(e.amountDkk)} DKK`, color: 'text-purple-300' }
  if (t === 'DEPOSIT')    return { label: `+${fmt(e.amountDkk)} DKK`, color: 'text-blue-400' }
  if (t === 'WITHDRAWAL') return { label: `-${fmt(e.amountDkk)} DKK`, color: 'text-yellow-400' }
  return { label: '—', color: 'text-muted' }
}

// ── Add Transaction Modal ────────────────────────────────────────────────────
const TICKERS = [
  'NOBI.ST','NIBE-B.ST','GMAB.CO','GN.CO','DFDS.CO','CLA-B.ST',
  'NOVO-B.CO','VUSA.AS','AMZN','COLO-B.CO','PNDORA.CO','DSV.CO',
]
const TICKER_NAMES = {
  'NOBI.ST':'Nobia AB','NIBE-B.ST':'NIBE Industrier B','GMAB.CO':'Genmab A/S',
  'GN.CO':'GN Store Nord A/S','DFDS.CO':'DFDS A/S','CLA-B.ST':'Cloetta AB',
  'NOVO-B.CO':'Novo Nordisk B','VUSA.AS':'Vanguard S&P 500 UCITS',
  'AMZN':'Amazon.com Inc.','COLO-B.CO':'Coloplast B','PNDORA.CO':'Pandora A/S',
  'DSV.CO':'DSV A/S',
}

const EMPTY_FORM = { type: 'BUY', ticker: 'NOBI.ST', date: '', shares: '', priceDkk: '', feeDkk: '', amountDkk: '', note: '' }

function AddModal({ onClose, onSaved }) {
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isTrade    = form.type === 'BUY' || form.type === 'SELL'
  const isDividend = form.type === 'DIVIDEND'
  const isCash     = form.type === 'DEPOSIT' || form.type === 'WITHDRAWAL'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isTrade) {
        await addTransaction({
          type:     form.type,
          ticker:   form.ticker,
          name:     TICKER_NAMES[form.ticker] ?? form.ticker,
          date:     form.date,
          shares:   parseFloat(form.shares),
          priceDkk: parseFloat(form.priceDkk),
          feeDkk:   parseFloat(form.feeDkk || 0),
        })
      } else if (isDividend) {
        await addDividend({
          ticker:    form.ticker,
          name:      TICKER_NAMES[form.ticker] ?? form.ticker,
          date:      form.date,
          amountDkk: parseFloat(form.amountDkk),
        })
      } else {
        await addCashTransaction({
          type:      form.type,
          date:      form.date,
          amountDkk: parseFloat(form.amountDkk),
          note:      form.note,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-semibold text-ink text-sm">Add Transaction</p>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Type</label>
            <div className="flex flex-wrap gap-2">
              {['BUY','SELL','DIVIDEND','DEPOSIT','WITHDRAWAL'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => set('type', t)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    form.type === t ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink'
                  }`}
                >{TYPE_LABELS[t]}</button>
              ))}
            </div>
          </div>

          {/* Ticker */}
          {(isTrade || isDividend) && (
            <div>
              <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Ticker</label>
              <select
                value={form.ticker}
                onChange={e => set('ticker', e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
              >
                {TICKERS.map(t => <option key={t} value={t}>{t} — {TICKER_NAMES[t]}</option>)}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Date</label>
            <input
              type="date" required value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Trade fields */}
          {isTrade && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Shares</label>
                <input
                  type="number" required min="0" step="any" placeholder="0"
                  value={form.shares} onChange={e => set('shares', e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Price per share (DKK)</label>
                <input
                  type="number" required min="0" step="any" placeholder="0.00"
                  value={form.priceDkk} onChange={e => set('priceDkk', e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Fee (DKK)</label>
                <input
                  type="number" min="0" step="any" placeholder="0"
                  value={form.feeDkk} onChange={e => set('feeDkk', e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Total (DKK)</label>
                <p className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink2 tabular-nums">
                  {form.shares && form.priceDkk
                    ? fmt(parseFloat(form.shares) * parseFloat(form.priceDkk) + parseFloat(form.feeDkk || 0))
                    : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Dividend / Cash amount */}
          {(isDividend || isCash) && (
            <div>
              <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Amount (DKK)</label>
              <input
                type="number" required min="0" step="any" placeholder="0.00"
                value={form.amountDkk} onChange={e => set('amountDkk', e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Note (cash only) */}
          {isCash && (
            <div>
              <label className="block text-xs text-muted mb-1.5 font-semibold uppercase tracking-wider">Note (optional)</label>
              <input
                type="text" placeholder="e.g. Monthly deposit"
                value={form.note} onChange={e => set('note', e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {form.type === 'SELL' && (
            <p className="text-xs text-muted bg-surface-2 rounded-md px-3 py-2">
              Realized P&L will be calculated automatically using FIFO.
            </p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md bg-surface-2 text-sm text-muted hover:text-ink transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [entries, setEntries]     = useState([])
  const [filter, setFilter]       = useState('All')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    setLoading(true)
    const { transactions, dividends, cash } = await fetchAllEntries()
    const all = [...transactions, ...dividends, ...cash]
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    setEntries(all)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Summary stats
  const transactions = entries.filter(e => e.type === 'BUY' || e.type === 'SELL')
  const dividends    = entries.filter(e => e.entryType === 'DIVIDEND')
  const cash         = entries.filter(e => e.type === 'DEPOSIT' || e.type === 'WITHDRAWAL')

  const totalDeposits    = cash.filter(c => c.type === 'DEPOSIT').reduce((s, c) => s + (c.amountDkk || 0), 0)
  const totalWithdrawals = cash.filter(c => c.type === 'WITHDRAWAL').reduce((s, c) => s + (c.amountDkk || 0), 0)
  const totalBuyCost     = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + (t.costBasisDkk || 0), 0)
  const totalSellProc    = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + (t.shares * t.priceDkk - (t.feeDkk || 0)), 0)
  const totalDividends   = dividends.reduce((s, d) => s + (d.amountDkk || 0), 0)
  const realizedPnl      = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + (t.realizedPnlDkk || 0), 0)
  const cashBalance      = totalDeposits - totalWithdrawals - totalBuyCost + totalSellProc + totalDividends

  const filtered = entries.filter(e => filterMatch(e, filter))

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between">
        <PageTitle sub="All your buys, sells, dividends, and cash movements">Transactions</PageTitle>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Cash Balance"
          icon={Wallet}
          value={`${fmt(cashBalance)} DKK`}
          sub={`Deposited: ${fmt(totalDeposits)} DKK`}
        />
        <StatCard
          label="Realized P&L"
          icon={TrendingUp}
          iconColor={realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}
          iconBg={realizedPnl >= 0 ? 'bg-green-950/60' : 'bg-red-950/60'}
          value={<span className={pnlColor(realizedPnl)}>{pnlSign(realizedPnl)}{fmt(realizedPnl)} DKK</span>}
          sub={`From ${transactions.filter(t => t.type === 'SELL').length} sell(s)`}
          subColor={pnlColor(realizedPnl)}
        />
        <StatCard
          label="Dividends Received"
          icon={Coins}
          iconColor="text-purple-300"
          iconBg="bg-purple-950/60"
          value={`${fmt(totalDividends)} DKK`}
          sub={`${dividends.length} payment(s)`}
        />
      </div>

      {/* Filter tabs + list */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>History</CardTitle>
          <div className="flex gap-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  filter === tab ? 'bg-blue-600 text-white' : 'bg-surface-2 text-muted hover:text-ink'
                }`}
              >{tab}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Plus} title="No transactions yet" sub="Click Add to log your first transaction." />
        ) : (
          <div className="space-y-1 -mx-1">
            {filtered.map((e, i) => {
              const t   = entryType(e)
              const amt = entryAmount(e)
              return (
                <div key={e.id ?? i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                    {typeIcon(t)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-ink font-medium truncate">{entryDescription(e)}</p>
                      {typeBadge(t)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-muted">{e.date}</p>
                      {t === 'BUY'  && <p className="text-xs text-muted">{fmtDec(e.priceDkk)} DKK/share · fee {fmt(e.feeDkk || 0)} DKK</p>}
                      {t === 'SELL' && (
                        <p className={`text-xs font-semibold ${pnlColor(e.realizedPnlDkk)}`}>
                          Realized P&L: {pnlSign(e.realizedPnlDkk)}{fmt(e.realizedPnlDkk)} DKK
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums whitespace-nowrap ${amt.color}`}>{amt.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {showModal && <AddModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  )
}
