import { db } from '../firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { positions as mockPositions } from '../data/mockData'

// Calculate net shares and avg cost per ticker from Firestore transactions (FIFO),
// then merge with live market prices from the Python pipeline sync.
export async function fetchPositions() {
  const [txSnap, priceSnap, metaSnap] = await Promise.all([
    getDocs(collection(db, 'transactions')),
    getDocs(collection(db, 'marketPrices')),
    getDocs(collection(db, 'dimTicker')),
  ])

  const transactions = txSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Build live price map: ticker → { currentPriceDkk, currency, ... }
  const livePrices = {}
  priceSnap.docs.forEach(d => { livePrices[d.id] = d.data() })

  // Build metadata map: ticker → { name, sector, country, ... }
  const tickerMeta = {}
  metaSnap.docs.forEach(d => { tickerMeta[d.id] = d.data() })

  // Group transactions by ticker
  const byTicker = {}
  for (const tx of transactions) {
    if (!byTicker[tx.ticker]) byTicker[tx.ticker] = { buys: [], sells: [] }
    if (tx.type === 'BUY')  byTicker[tx.ticker].buys.push(tx)
    if (tx.type === 'SELL') byTicker[tx.ticker].sells.push(tx)
  }

  const positions = []

  for (const [ticker, { buys, sells }] of Object.entries(byTicker)) {
    // Track remaining shares in each buy lot after sells (FIFO)
    const remaining = Object.fromEntries(buys.map(b => [b.id, b.shares]))
    for (const sell of sells) {
      let toConsume = sell.shares
      for (const b of buys) {
        if (toConsume <= 0) break
        const used = Math.min(remaining[b.id] ?? 0, toConsume)
        remaining[b.id] = (remaining[b.id] ?? 0) - used
        toConsume -= used
      }
    }

    // Sum remaining lots → net shares + cost basis
    let netShares = 0
    let totalCost = 0
    for (const b of buys) {
      const rem = remaining[b.id] ?? 0
      if (rem <= 0) continue
      netShares += rem
      const costPerShare = (b.priceDkk * b.shares + (b.feeDkk || 0)) / b.shares
      totalCost += costPerShare * rem
    }

    if (netShares <= 0) continue

    const avgCostDkk = totalCost / netShares

    // Prefer live price from pipeline; fall back to mock if pipeline hasn't run yet
    const live = livePrices[ticker]
    const mock = mockPositions.find(p => p.ticker === ticker)
    const meta = tickerMeta[ticker] || {}

    let currentPriceDkk, currentValueDkk, unrealizedPnlDkk, unrealizedPnlPct

    if (live?.currentPriceDkk) {
      currentPriceDkk  = live.currentPriceDkk
      currentValueDkk  = Math.round(netShares * currentPriceDkk)
      unrealizedPnlDkk = Math.round(currentValueDkk - totalCost)
      unrealizedPnlPct = Math.round(((currentValueDkk - totalCost) / totalCost) * 1000) / 10
    } else if (mock) {
      // Fallback: scale mock price by shares ratio until pipeline runs
      const sharesRatio = netShares / mock.shares
      currentValueDkk  = Math.round(mock.currentValueDkk * sharesRatio)
      currentPriceDkk  = mock.currentValueDkk / mock.shares
      unrealizedPnlDkk = Math.round(currentValueDkk - totalCost)
      unrealizedPnlPct = Math.round(((currentValueDkk - totalCost) / totalCost) * 1000) / 10
    } else {
      continue
    }

    const invType = meta.investmentType || mock?.investmentType || 'Stock'
    positions.push({
      ticker,
      name:            meta.name    || mock?.name    || ticker,
      sector:          meta.sector  || mock?.sector  || '',
      country:         meta.country || mock?.country || '',
      currency:        live?.currency || mock?.currency || 'DKK',
      investmentType:  invType,
      category:        invType === 'ETF' ? 'Core' : 'Satellite',
      shares:          netShares,
      avgCostDkk:      Math.round(avgCostDkk * 100) / 100,
      currentPriceDkk: Math.round(currentPriceDkk * 100) / 100,
      currentValueDkk,
      unrealizedPnlDkk,
      unrealizedPnlPct,
      dataSource:      live ? 'live' : 'mock',
    })
  }

  // Sort by current value descending
  return positions.sort((a, b) => b.currentValueDkk - a.currentValueDkk)
}
