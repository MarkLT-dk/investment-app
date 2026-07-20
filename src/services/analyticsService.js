import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function fetchAnalyticsData() {
  const [fundSnap, riskSnap, dimSnap, watchSnap, summarySnap, analystSnap, priceSnap] = await Promise.all([
    getDocs(collection(db, 'fundamentals')),
    getDocs(collection(db, 'riskMetrics')),
    getDocs(collection(db, 'dimTicker')),
    getDocs(collection(db, 'watchlist')),
    getDocs(collection(db, 'tickerSummary')),
    getDocs(collection(db, 'analystRatings')),
    getDocs(collection(db, 'marketPrices')),
  ])

  const fundamentals = {}
  fundSnap.docs.forEach(d => { fundamentals[d.id] = d.data() })

  // riskMetrics keyed ticker → period → data
  const riskMetrics = {}
  riskSnap.docs.forEach(d => {
    const { ticker, period, ...rest } = d.data()
    if (!ticker || !period) return
    if (!riskMetrics[ticker]) riskMetrics[ticker] = {}
    riskMetrics[ticker][period] = rest
  })

  const dimTicker = {}
  dimSnap.docs.forEach(d => { dimTicker[d.id] = d.data() })

  const watchlistTickers = watchSnap.docs
    .map(d => d.data())
    .filter(d => d.ticker)
    .map(d => ({ ticker: d.ticker.toUpperCase(), ...d }))

  const tickerSummary = {}
  summarySnap.docs.forEach(d => { tickerSummary[d.id] = d.data() })

  const analystRatings = {}
  analystSnap.docs.forEach(d => { analystRatings[d.id] = d.data() })

  const marketPrices = {}
  priceSnap.docs.forEach(d => { marketPrices[d.id] = d.data() })

  return { fundamentals, riskMetrics, dimTicker, watchlistTickers, tickerSummary, analystRatings, marketPrices }
}
