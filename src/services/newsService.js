import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import { news as mockNews } from '../data/mockData'

function normalize(item) {
  return {
    ticker:    item.ticker    || '',
    headline:  item.title     || item.headline || '',
    source:    item.publisher || item.source   || '',
    published: item.published || item.time     || '',
    url:       item.url       || null,
  }
}

export async function fetchNews() {
  try {
    const snap = await getDocs(collection(db, 'news'))
    if (snap.empty) return mockNews.map(normalize)
    const items = snap.docs.map(d => normalize(d.data()))
    return items.sort((a, b) => (b.published || '').localeCompare(a.published || ''))
  } catch {
    return mockNews.map(normalize)
  }
}
