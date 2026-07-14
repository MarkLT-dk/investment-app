import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import { positions as mockPositions } from '../data/mockData'

export async function fetchPositions() {
  const [txSnap, priceSnap, metaSnap, summarySnap] = await Promise.all([
    getDocs(collection(db, 'transactions')),
    getDocs(collection(db, 'marketPrices')),
    getDocs(collection(db, 'dimTicker')),
    getDocs(collection(db, 'tickerSummary')),
  ])

  const transactions = txSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const livePrices = {}
  priceSnap.docs.forEach(d => { livePrices[d.id] = d.data() })

  const tickerMeta = {}
  metaSnap.docs.forEach(d => { tickerMeta[d.id] = d.data() })

  const tickerSummary = {}
  summarySnap.docs.forEach(d => { tickerSummary[d.id] = d.data() })

  const byTicker = {}
  for (const tx of transactions) {
    if (!byTicker[tx.ticker]) byTicker[tx.ticker] = { buys: [], sells: [] }
    if (tx.type === 'BUY')  byTicker[tx.ticker].buys.push(tx)
    if (tx.type === 'SELL') byTicker[tx.ticker].sells.push(tx)
  }

  const positions = []

  for (const [ticker, { buys, sells }] of Object.entries(byTicker)) {
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

    let netShares = 0
    let totalCost  = 0
    for (const b of buys) {
      const rem = remaining[b.id] ?? 0
      if (rem <= 0) continue
      netShares += rem
      const costPerShare = (b.priceDkk * b.shares + (b.feeDkk || 0)) / b.shares
      totalCost += costPerShare * rem
    }

    if (netShares <= 0) continue

    const avgCostDkk = totalCost / netShares
    const live  = livePrices[ticker]
    const mock  = mockPositions.find(p => p.ticker === ticker)
    const meta  = tickerMeta[ticker] || {}
    const summ  = tickerSummary[ticker] || {}

    let currentPriceDkk, currentValueDkk, unrealizedPnlDkk, unrealizedPnlPct

    if (live?.currentPriceDkk) {
      currentPriceDkk  = live.currentPriceDkk
      currentValueDkk  = Math.round(netShares * currentPriceDkk)
      unrealizedPnlDkk = Math.round(currentValueDkk - totalCost)
      unrealizedPnlPct = Math.round(((currentValueDkk - totalCost) / totalCost) * 1000) / 10
    } else if (mock) {
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
      // Period returns — live from tickerSummary, fall back to mock
      return1d:   summ.return1d   ?? mock?.return1d   ?? null,
      return1m:   summ.return1m   ?? mock?.return1m   ?? null,
      returnYtd:  summ.returnYtd  ?? mock?.returnYtd  ?? null,
      return1y:   summ.return1y   ?? mock?.return1y   ?? null,
      dataSource: live ? 'live' : 'mock',
    })
  }

  // Compute portfolio weights after all positions are known
  const totalValue = positions.reduce((s, p) => s + p.currentValueDkk, 0)
  return positions
    .map(p => ({ ...p, weight: totalValue > 0 ? p.currentValueDkk / totalValue : 0 }))
    .sort((a, b) => b.currentValueDkk - a.currentValueDkk)
}
