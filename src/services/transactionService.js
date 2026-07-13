import { db } from '../firebase'
import {
  collection, addDoc, getDocs, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore'

// FIFO: calculate realized P&L for a new sell against existing buy lots
async function calcFifoRealizedPnl(ticker, sellShares, sellPriceDkk, sellFeeDkk) {
  const snap = await getDocs(query(collection(db, 'transactions'), where('ticker', '==', ticker)))
  const all  = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.localeCompare(b.date))
  const buys      = all.filter(t => t.type === 'BUY')
  const prevSells = all.filter(t => t.type === 'SELL')

  // Track shares remaining in each buy lot after prior sells
  const remaining = Object.fromEntries(buys.map(b => [b.id, b.shares]))
  for (const sell of prevSells) {
    let toConsume = sell.shares
    for (const b of buys) {
      if (toConsume <= 0) break
      const used = Math.min(remaining[b.id] ?? 0, toConsume)
      remaining[b.id] = (remaining[b.id] ?? 0) - used
      toConsume -= used
    }
  }

  // Match current sell against remaining lots (FIFO)
  let toMatch = sellShares
  let costBasisDkk = 0
  for (const b of buys) {
    if (toMatch <= 0) break
    const avail = remaining[b.id] ?? 0
    if (avail <= 0) continue
    const matched = Math.min(avail, toMatch)
    const costPerShare = (b.priceDkk * b.shares + (b.feeDkk || 0)) / b.shares
    costBasisDkk += costPerShare * matched
    toMatch -= matched
  }

  const proceeds = sellShares * sellPriceDkk - (sellFeeDkk || 0)
  return { realizedPnlDkk: proceeds - costBasisDkk, costBasisDkk }
}

export async function addTransaction(data) {
  const entry = { ...data, feeDkk: data.feeDkk || 0, createdAt: serverTimestamp() }

  if (data.type === 'BUY') {
    entry.costBasisDkk = data.shares * data.priceDkk + (data.feeDkk || 0)
  }
  if (data.type === 'SELL') {
    const { realizedPnlDkk, costBasisDkk } = await calcFifoRealizedPnl(
      data.ticker, data.shares, data.priceDkk, data.feeDkk || 0
    )
    entry.realizedPnlDkk = realizedPnlDkk
    entry.costBasisDkk = costBasisDkk
  }

  return addDoc(collection(db, 'transactions'), entry)
}

export async function addDividend(data) {
  return addDoc(collection(db, 'dividends'), { ...data, createdAt: serverTimestamp() })
}

export async function addCashTransaction(data) {
  return addDoc(collection(db, 'cashTransactions'), { ...data, createdAt: serverTimestamp() })
}

export async function fetchAllEntries() {
  const [txSnap, divSnap, cashSnap] = await Promise.all([
    getDocs(collection(db, 'transactions')),
    getDocs(collection(db, 'dividends')),
    getDocs(collection(db, 'cashTransactions')),
  ])
  return {
    transactions: txSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    dividends:    divSnap.docs.map(d => ({ id: d.id, ...d.data(), entryType: 'DIVIDEND' })),
    cash:         cashSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  }
}

// Seed historical data (call once)
export async function seedHistoricalData() {
  // Approximate DKK prices using historical FX rates
  // SEK/DKK ≈ 0.645 (2024), 0.648 (2025), 0.643 (2026)
  // EUR/DKK ≈ 7.46 (2024)
  // USD/DKK ≈ 6.90 (2024)

  const buys = [
    { ticker: 'NOBI.ST',   name: 'Nobia AB',               date: '2024-03-01', type: 'BUY',  shares: 2990,  priceDkk: 4.83,   feeDkk: 0  },
    { ticker: 'NOBI.ST',   name: 'Nobia AB',               date: '2024-04-17', type: 'BUY',  shares: 8970,  priceDkk: 1.61,   feeDkk: 0  },
    { ticker: 'NIBE-B.ST', name: 'NIBE Industrier B',      date: '2024-03-01', type: 'BUY',  shares: 509,   priceDkk: 37.87,  feeDkk: 0  },
    { ticker: 'NIBE-B.ST', name: 'NIBE Industrier B',      date: '2024-06-07', type: 'BUY',  shares: 582,   priceDkk: 32.82,  feeDkk: 0  },
    { ticker: 'GMAB.CO',   name: 'Genmab A/S',             date: '2024-03-01', type: 'BUY',  shares: 8,     priceDkk: 1975,   feeDkk: 0  },
    { ticker: 'GN.CO',     name: 'GN Store Nord A/S',      date: '2024-08-22', type: 'BUY',  shares: 59,    priceDkk: 166.5,  feeDkk: 0  },
    { ticker: 'DFDS.CO',   name: 'DFDS A/S',               date: '2024-08-07', type: 'BUY',  shares: 55,    priceDkk: 179.5,  feeDkk: 0  },
    { ticker: 'CLA-B.ST',  name: 'Cloetta AB',             date: '2024-03-01', type: 'BUY',  shares: 1673,  priceDkk: 11.53,  feeDkk: 0  },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2024-08-07', type: 'BUY',  shares: 17,    priceDkk: 843.15, feeDkk: 0  },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2024-09-30', type: 'BUY',  shares: 24,    priceDkk: 734.7,  feeDkk: 0  },
    { ticker: 'AMZN',      name: 'Amazon.com Inc.',         date: '2024-09-30', type: 'BUY',  shares: 8,     priceDkk: 1289.6, feeDkk: 0  },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2025-12-01', type: 'BUY',  shares: 10,    priceDkk: 314.8,  feeDkk: 25 },
    { ticker: 'COLO-B.CO', name: 'Coloplast B',            date: '2025-12-30', type: 'BUY',  shares: 27,    priceDkk: 545.6,  feeDkk: 0  },
    { ticker: 'PNDORA.CO', name: 'Pandora A/S',            date: '2025-12-30', type: 'BUY',  shares: 14,    priceDkk: 706,    feeDkk: 25 },
    { ticker: 'PNDORA.CO', name: 'Pandora A/S',            date: '2026-01-05', type: 'BUY',  shares: 15,    priceDkk: 661,    feeDkk: 25 },
    { ticker: 'PNDORA.CO', name: 'Pandora A/S',            date: '2026-01-09', type: 'BUY',  shares: 16,    priceDkk: 615,    feeDkk: 25 },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2026-02-04', type: 'BUY',  shares: 27,    priceDkk: 301.55, feeDkk: 27 },
    { ticker: 'NOBI.ST',   name: 'Nobia AB',               date: '2026-03-11', type: 'BUY',  shares: 14950, priceDkk: 1.14,   feeDkk: 0  },
  ]

  const sell = { ticker: 'CLA-B.ST', name: 'Cloetta AB', date: '2025-12-30', type: 'SELL', shares: 720, priceDkk: 26.22, feeDkk: 0 }

  const dividends = [
    { ticker: 'NIBE-B.ST', name: 'NIBE Industrier B',      date: '2024-05-23', amountDkk: 330.85  },
    { ticker: 'CLA-B.ST',  name: 'Cloetta AB',             date: '2024-04-16', amountDkk: 1673    },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2024-04-16', amountDkk: 59.5    },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2024-12-27', amountDkk: 52.62   },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2025-04-01', amountDkk: 134.4   },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2025-04-02', amountDkk: 53.06   },
    { ticker: 'CLA-B.ST',  name: 'Cloetta AB',             date: '2025-04-17', amountDkk: 1049.38 },
    { ticker: 'NIBE-B.ST', name: 'NIBE Industrier B',      date: '2025-05-22', amountDkk: 190.74  },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2025-07-02', amountDkk: 47.49   },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2025-08-19', amountDkk: 63.75   },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2025-10-01', amountDkk: 45.85   },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2025-12-31', amountDkk: 45.54   },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2026-03-31', amountDkk: 135.15  },
    { ticker: 'VUSA.AS',   name: 'Vanguard S&P 500 UCITS', date: '2026-04-01', amountDkk: 45.54   },
    { ticker: 'PNDORA.CO', name: 'Pandora A/S',            date: '2026-03-16', amountDkk: 990     },
    { ticker: 'NOVO-B.CO', name: 'Novo Nordisk B',         date: '2026-03-31', amountDkk: 294.15  },
  ]

  const cash = [
    { type: 'DEPOSIT', date: '2026-04-12', amountDkk: 200000, note: 'Opening balance' },
  ]

  // Upload buys first (FIFO needs them before sells)
  for (const tx of buys) {
    await addTransaction(tx)
  }
  await addTransaction(sell)
  for (const div of dividends) {
    await addDividend(div)
  }
  for (const c of cash) {
    await addCashTransaction(c)
  }
}
