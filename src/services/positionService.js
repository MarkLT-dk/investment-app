import { db } from '../firebase'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { positions as mockPositions } from '../data/mockData'

// Calculate net shares and avg cost per ticker from Firestore transactions (FIFO)
export async function fetchPositions() {
  const snap = await getDocs(
    query(collection(db, 'transactions'), orderBy('date', 'asc'))
  )
  const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Group by ticker
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

    // Merge with mockData for live price, returns, metadata
    const mock = mockPositions.find(p => p.ticker === ticker)
    if (!mock) continue

    // Scale current value by share ratio (until we have live prices)
    const sharesRatio = netShares / mock.shares
    const currentValueDkk   = Math.round(mock.currentValueDkk * sharesRatio)
    const unrealizedPnlDkk  = Math.round(currentValueDkk - totalCost)
    const unrealizedPnlPct  = ((currentValueDkk - totalCost) / totalCost) * 100

    positions.push({
      ...mock,
      shares: netShares,
      avgCostDkk: Math.round(avgCostDkk * 100) / 100,
      currentValueDkk,
      unrealizedPnlDkk,
      unrealizedPnlPct: Math.round(unrealizedPnlPct * 10) / 10,
      weight: mock.weight * sharesRatio,
    })
  }

  return positions
}
