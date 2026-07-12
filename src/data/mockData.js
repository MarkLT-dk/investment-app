// Mock data based on real transactions.csv
// Real holdings (net shares after sells):
//   NOBI.ST 26,910 | NIBE-B.ST 1,091 | GMAB.CO 8 | GN.CO 59 | DFDS.CO 55
//   CLA-B.ST 953   | NOVO-B.CO 54    | VUSA.AS 24 | AMZN 8   | COLO-B.CO 27 | PNDORA.CO 45
// Watchlist: DSV.CO

export const positions = [
  // Core
  { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS ETF', type: 'ETF',   category: 'Core',      sector: 'ETF',               country: 'Netherlands', shares: 24,     avgCostDkk: 735,   currentPrice: 94.2,  currency: 'EUR', currentValueDkk: 21010, unrealizedPnlDkk: 3880, unrealizedPnlPct: 22.7, weight: 0.10, return1d: 0.2,  return1m: 3.4,  returnYtd: 7.1,  return1y: 18.3 },
  // Satellite
  { ticker: 'NOBI.ST',   name: 'Nobia AB',                   type: 'Stock', category: 'Satellite', sector: 'Consumer Cyclical', country: 'Sweden',      shares: 26910,  avgCostDkk: 2.18,  currentPrice: 1.6,   currency: 'SEK', currentValueDkk: 6110,  unrealizedPnlDkk: -2610, unrealizedPnlPct: -29.9, weight: 0.03, return1d: -1.2, return1m: -8.4,  returnYtd: -12.1, return1y: -36.2 },
  { ticker: 'NIBE-B.ST', name: 'NIBE Industrier B',           type: 'Stock', category: 'Satellite', sector: 'Industrials',       country: 'Sweden',      shares: 1091,   avgCostDkk: 38.4,  currentPrice: 28.3,  currency: 'SEK', currentValueDkk: 22010, unrealizedPnlDkk: -3910, unrealizedPnlPct: -26.4, weight: 0.11, return1d: 0.4,  return1m: -2.1,  returnYtd: -5.8,  return1y: -24.1 },
  { ticker: 'GMAB.CO',   name: 'Genmab A/S',                  type: 'Stock', category: 'Satellite', sector: 'Healthcare',        country: 'Denmark',     shares: 8,      avgCostDkk: 1975,  currentPrice: 1655,  currency: 'DKK', currentValueDkk: 13240, unrealizedPnlDkk: -2560, unrealizedPnlPct: -16.2, weight: 0.06, return1d: -0.8, return1m: -4.2,  returnYtd: -8.3,  return1y: -9.8 },
  { ticker: 'GN.CO',     name: 'GN Store Nord A/S',           type: 'Stock', category: 'Satellite', sector: 'Technology',        country: 'Denmark',     shares: 59,     avgCostDkk: 166.5, currentPrice: 128,   currency: 'DKK', currentValueDkk: 7552,  unrealizedPnlDkk: -2272, unrealizedPnlPct: -23.1, weight: 0.04, return1d: -1.4, return1m: -9.2,  returnYtd: -18.4, return1y: -35.8 },
  { ticker: 'DFDS.CO',   name: 'DFDS A/S',                    type: 'Stock', category: 'Satellite', sector: 'Industrials',       country: 'Denmark',     shares: 55,     avgCostDkk: 179.5, currentPrice: 162,   currency: 'DKK', currentValueDkk: 8910,  unrealizedPnlDkk: -963,  unrealizedPnlPct: -9.8,  weight: 0.04, return1d: -0.3, return1m: -6.1,  returnYtd: -9.4,  return1y: -12.8 },
  { ticker: 'CLA-B.ST',  name: 'Cloetta AB',                  type: 'Stock', category: 'Satellite', sector: 'Consumer Defensive',country: 'Sweden',      shares: 953,    avgCostDkk: 17.87, currentPrice: 48.3,  currency: 'SEK', currentValueDkk: 30980, unrealizedPnlDkk: 13920, unrealizedPnlPct: 81.9,  weight: 0.15, return1d: -0.4, return1m: -1.1,  returnYtd: 23.1,  return1y: 84.2 },
  { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',              type: 'Stock', category: 'Satellite', sector: 'Healthcare',        country: 'Denmark',     shares: 54,     avgCostDkk: 491,   currentPrice: 488,   currency: 'DKK', currentValueDkk: 26352, unrealizedPnlDkk: -162,  unrealizedPnlPct: -0.6,  weight: 0.13, return1d: 0.6,  return1m: 2.1,   returnYtd: -4.8,  return1y: -38.2 },
  { ticker: 'AMZN',      name: 'Amazon.com Inc.',              type: 'Stock', category: 'Satellite', sector: 'Consumer Cyclical', country: 'USA',         shares: 8,      avgCostDkk: 1241,  currentPrice: 250.1, currency: 'USD', currentValueDkk: 12550, unrealizedPnlDkk: 2622,  unrealizedPnlPct: 26.4,  weight: 0.06, return1d: 1.1,  return1m: 22.3,  returnYtd: 7.8,   return1y: 49.1 },
  { ticker: 'COLO-B.CO', name: 'Coloplast B',                 type: 'Stock', category: 'Satellite', sector: 'Healthcare',        country: 'Denmark',     shares: 27,     avgCostDkk: 545.6, currentPrice: 527,   currency: 'DKK', currentValueDkk: 14229, unrealizedPnlDkk: -503,  unrealizedPnlPct: -3.4,  weight: 0.07, return1d: 0.5,  return1m: 2.1,   returnYtd: -4.2,  return1y: -14.8 },
  { ticker: 'PNDORA.CO', name: 'Pandora A/S',                 type: 'Stock', category: 'Satellite', sector: 'Consumer Cyclical', country: 'Denmark',     shares: 45,     avgCostDkk: 659,   currentPrice: 820,   currency: 'DKK', currentValueDkk: 36900, unrealizedPnlDkk: 7245,  unrealizedPnlPct: 24.5,  weight: 0.18, return1d: 0.8,  return1m: 5.2,   returnYtd: 14.3,  return1y: 52.1 },
]

// Watchlist tickers — available in Analytics but not portfolio
export const watchlistTickers = [
  { ticker: 'DSV.CO', name: 'DSV A/S', type: 'Stock', category: 'Watchlist', sector: 'Industrials', country: 'Denmark', return1d: 0.0, return1m: 11.2, returnYtd: 6.4, return1y: 43.4 },
]

export const portfolioStats = {
  totalValueDkk: 209843,
  totalCostDkk: 186340,
  totalUnrealizedDkk: 17842,
  totalUnrealizedPct: 9.3,
  return1d: -0.3,
  return1m: 7.4,
  returnYtd: -9.1,
  return1y: 13.8,
  marketReturn1d: 0.2,
  marketReturn1m: 6.7,
  marketReturnYtd: 3.5,
  marketReturn1y: 33.1,
  maxDrawdown: -28.1,
  riskScore: 39,
  cashPct: 49,
}

export const distribution = {
  byCountry: [
    { label: 'Denmark', pct: 51, color: '#3b82f6' },
    { label: 'Sweden',  pct: 28, color: '#a855f7' },
    { label: 'USA',     pct: 6,  color: '#f97316' },
    { label: 'ETF/NL',  pct: 10, color: '#22c55e' },
    { label: 'Other',   pct: 5,  color: '#64748b' },
  ],
  bySector: [
    { label: 'Healthcare',  pct: 26, color: '#ec4899' },
    { label: 'Consumer',    pct: 36, color: '#3b82f6' },
    { label: 'Industrials', pct: 15, color: '#f97316' },
    { label: 'Technology',  pct: 4,  color: '#a855f7' },
    { label: 'ETF',         pct: 10, color: '#22c55e' },
    { label: 'Other',       pct: 9,  color: '#64748b' },
  ],
}

// 52 weeks of weekly portfolio value history (for time filter)
function buildHistory() {
  const points = []
  const start = 158000
  const end = 209843
  const weeks = 52
  const seed = [0, -1.2, 2.1, -0.8, 1.5, 3.2, -2.1, 0.8, -1.8, 4.1, 2.3, -3.2, 1.1, -0.5, 2.8, -1.9, 3.4, 1.2, -2.8, 4.2, 0.9, -1.4, 2.6, 3.8, -2.3, 1.7, -0.9, 2.2, -3.1, 4.8, 1.4, -2.6, 3.1, 0.6, -1.8, 2.9, -0.7, 3.6, -2.4, 1.9, 4.3, -1.6, 2.8, 0.4, -2.2, 3.7, 1.1, -1.3, 4.6, 2.1, -0.8, 1.9]
  let val = start
  const now = new Date()
  for (let i = 0; i < weeks; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - (weeks - i) * 7)
    val = val * (1 + seed[i] / 100)
    // Nudge toward end value in final weeks
    if (i > 44) val = val + (end - val) * 0.3
    const label = d.toLocaleDateString('en-DK', { day: 'numeric', month: 'short' })
    points.push({ date: label, value: Math.round(val), weekIndex: i })
  }
  points[weeks - 1].value = end
  return points
}

export const portfolioHistory = buildHistory()

export const returnHistory = portfolioHistory.map((p, i) => ({
  date: p.date,
  weekIndex: i,
  portfolio: parseFloat(((p.value - portfolioHistory[0].value) / portfolioHistory[0].value).toFixed(4)),
  market: parseFloat((i * 0.33 / 51 + Math.sin(i * 0.3) * 0.02).toFixed(4)),
}))

export const fundamentals = {
  'VUSA.AS':   { pe: 21.8, pb: 4.1, evEbitda: null, profitMargin: null,  dividendYield: 0.013, analystTarget: null, upside: null,  recommendation: 'none',       numAnalysts: 0 },
  'NOBI.ST':   { pe: null, pb: 1.1, evEbitda: 8.3,  profitMargin: -0.03, dividendYield: 0.0,   analystTarget: 2.1,  upside: 0.31,  recommendation: 'hold',       numAnalysts: 6 },
  'NIBE-B.ST': { pe: 22.4, pb: 2.8, evEbitda: 12.1, profitMargin: 0.06,  dividendYield: 0.018, analystTarget: 38,   upside: 0.34,  recommendation: 'buy',        numAnalysts: 14 },
  'GMAB.CO':   { pe: 14.2, pb: 2.1, evEbitda: 9.4,  profitMargin: 0.22,  dividendYield: 0.0,   analystTarget: 1920, upside: 0.16,  recommendation: 'buy',        numAnalysts: 18 },
  'GN.CO':     { pe: null, pb: 0.9, evEbitda: 7.1,  profitMargin: -0.08, dividendYield: 0.0,   analystTarget: 175,  upside: 0.37,  recommendation: 'buy',        numAnalysts: 12 },
  'DFDS.CO':   { pe: 11.8, pb: 0.8, evEbitda: 6.2,  profitMargin: 0.04,  dividendYield: 0.035, analystTarget: 195,  upside: 0.20,  recommendation: 'buy',        numAnalysts: 10 },
  'CLA-B.ST':  { pe: 17.4, pb: 2.4, evEbitda: 12.7, profitMargin: 0.09,  dividendYield: 0.028, analystTarget: null, upside: null,  recommendation: 'none',       numAnalysts: 0 },
  'NOVO-B.CO': { pe: 18.2, pb: 6.2, evEbitda: 14.8, profitMargin: 0.33,  dividendYield: 0.022, analystTarget: 550,  upside: 0.13,  recommendation: 'buy',        numAnalysts: 24 },
  'AMZN':      { pe: 34.9, pb: 6.5, evEbitda: 18.8, profitMargin: 0.11,  dividendYield: 0.0,   analystTarget: 282,  upside: 0.13,  recommendation: 'strong_buy', numAnalysts: 64 },
  'COLO-B.CO': { pe: 22.1, pb: 5.2, evEbitda: 14.1, profitMargin: 0.17,  dividendYield: 0.021, analystTarget: 622,  upside: 0.18,  recommendation: 'buy',        numAnalysts: 15 },
  'PNDORA.CO': { pe: 14.8, pb: 8.1, evEbitda: 10.2, profitMargin: 0.20,  dividendYield: 0.028, analystTarget: 980,  upside: 0.20,  recommendation: 'strong_buy', numAnalysts: 20 },
  'DSV.CO':    { pe: 48.2, pb: 3.5, evEbitda: 22.7, profitMargin: 0.03,  dividendYield: 0.004, analystTarget: 2038, upside: 0.19,  recommendation: 'strong_buy', numAnalysts: 19 },
}

export const riskMetrics = {
  'VUSA.AS':   { beta: 1.00, sharpe: 1.12, maxDrawdown: -19.1, volatilityPct: 14.2, alpha: 0.00 },
  'NOBI.ST':   { beta: 1.21, sharpe: -0.88, maxDrawdown: -52.1, volatilityPct: 42.8, alpha: -0.42 },
  'NIBE-B.ST': { beta: 1.18, sharpe: -0.54, maxDrawdown: -41.3, volatilityPct: 38.1, alpha: -0.28 },
  'GMAB.CO':   { beta: 0.62, sharpe: 0.22, maxDrawdown: -31.4, volatilityPct: 26.4, alpha: -0.08 },
  'GN.CO':     { beta: 1.42, sharpe: -1.12, maxDrawdown: -48.2, volatilityPct: 44.6, alpha: -0.48 },
  'DFDS.CO':   { beta: 0.88, sharpe: -0.14, maxDrawdown: -24.2, volatilityPct: 22.1, alpha: -0.15 },
  'CLA-B.ST':  { beta: 0.76, sharpe: 2.28, maxDrawdown: -13.2, volatilityPct: 24.8, alpha: 0.70 },
  'NOVO-B.CO': { beta: 0.58, sharpe: -0.42, maxDrawdown: -44.8, volatilityPct: 28.2, alpha: -0.52 },
  'AMZN':      { beta: 1.38, sharpe: 0.51, maxDrawdown: -28.9, volatilityPct: 31.6, alpha: 0.03 },
  'COLO-B.CO': { beta: 0.71, sharpe: 0.34, maxDrawdown: -27.8, volatilityPct: 19.8, alpha: -0.04 },
  'PNDORA.CO': { beta: 0.92, sharpe: 1.44, maxDrawdown: -18.6, volatilityPct: 22.4, alpha: 0.28 },
  'DSV.CO':    { beta: 1.03, sharpe: 0.67, maxDrawdown: -32.1, volatilityPct: 30.8, alpha: 0.14 },
}

export const watchlist = [
  {
    ticker: 'DSV.CO',
    name: 'DSV A/S',
    currentPrice: 1711,
    currency: 'DKK',
    targetPrice: null,
    conviction: 'Medium',
    status: 'Watching',
    thesis: 'Global logistics leader. DB Schenker acquisition positions them as #2 in the world. Strong execution track record. Watching valuation — expensive but high quality.',
    tags: ['Industrials', 'Denmark', 'Quality'],
    dateAdded: '2026-04-18',
  },
]

export const news = [
  { ticker: 'AMZN',      source: 'Reuters',          headline: 'Amazon raises Prime prices in Europe for the first time since 2022',                         time: '2h ago',  url: '#' },
  { ticker: 'CLA-B.ST',  source: 'Bloomberg',         headline: 'Cloetta reports Q2 beat — volumes up 4% driven by Nordic impulse category',                  time: '5h ago',  url: '#' },
  { ticker: 'DSV.CO',    source: 'Børsen',            headline: 'DSV confirms DB Schenker integration on track, raises full-year guidance',                    time: '1d ago',  url: '#' },
  { ticker: 'GMAB.CO',   source: 'Financial Times',   headline: 'Genmab pipeline review: daratumumab combination trials show promise in myeloma',              time: '1d ago',  url: '#' },
  { ticker: 'NOVO-B.CO', source: 'Reuters',           headline: 'Novo Nordisk wins EU approval for oral semaglutide weight-loss pill',                         time: '2d ago',  url: '#' },
  { ticker: 'PNDORA.CO', source: 'Bloomberg',         headline: 'Pandora raises full-year outlook after strong US and China sales',                             time: '2d ago',  url: '#' },
  { ticker: 'NIBE-B.ST', source: 'Reuter',            headline: 'NIBE revenue falls as heat pump demand remains weak across Europe',                            time: '3d ago',  url: '#' },
  { ticker: 'GN.CO',     source: 'Børsen',            headline: 'GN Store Nord Q2: Jabra headset sales recover, but hearing aid division still under pressure', time: '3d ago',  url: '#' },
  { ticker: 'DFDS.CO',   source: 'Børsen',            headline: 'DFDS cuts ferry routes amid weak freight volumes on English Channel',                         time: '4d ago',  url: '#' },
  { ticker: 'COLO-B.CO', source: 'Financial Times',   headline: 'Coloplast beats estimates on strong wound care growth in emerging markets',                    time: '5d ago',  url: '#' },
]

export const savedResearch = [
  { id: 1, type: 'article', source: 'Financial Times',   headline: 'DSV acquires DB Schenker — what it means for the logistics giant',                         tickers: ['DSV.CO'],    savedAt: '2026-07-10', notes: '', url: '#' },
  { id: 2, type: 'note',    source: 'Personal note',     headline: 'Novo Nordisk — Q2 earnings notes. Semaglutide volumes strong but US pricing pressure.',     tickers: ['NOVO-B.CO'], savedAt: '2026-07-08', notes: 'Watch the US drug pricing bill. If it passes, revisit target.', url: null },
  { id: 3, type: 'article', source: "Barron's",          headline: 'Why European small caps look cheap vs US peers heading into H2',                             tickers: ['General'],   savedAt: '2026-06-28', notes: '', url: '#' },
  { id: 4, type: 'article', source: 'Seeking Alpha',     headline: 'Genmab: The case for holding through the pipeline read-out',                                tickers: ['GMAB.CO'],   savedAt: '2026-06-15', notes: '', url: '#' },
]

export const signals = [
  { type: 'earnings', message: 'AMZN earnings in 4 days',             ticker: 'AMZN',      severity: 'info' },
  { type: 'earnings', message: 'NOVO-B.CO earnings in 11 days',       ticker: 'NOVO-B.CO', severity: 'info' },
  { type: 'price',    message: 'NOVO-B.CO near your cost basis — down 0.6%', ticker: 'NOVO-B.CO', severity: 'warn' },
]

export const etfIdeas = [
  { ticker: 'VWRL.AS',  name: 'Vanguard FTSE All-World',    label: 'Core',        description: 'All-world, 1 fund, set and forget' },
  { ticker: 'EQQQ.L',   name: 'Invesco NASDAQ 100',          label: 'Growth',      description: 'Tech-heavy, high growth exposure' },
  { ticker: 'IUSN.DE',  name: 'iShares MSCI World Small Cap',label: 'Diversifier', description: 'Small cap value tilt' },
  { ticker: 'XDWD.DE',  name: 'Xtrackers MSCI World',        label: 'Core',        description: 'Low-cost developed markets' },
]
