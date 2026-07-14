import { db } from '../firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
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
    const q = query(collection(db, 'news'), orderBy('published', 'desc'), limit(300))
    const snap = await getDocs(q)
    if (snap.empty) return mockNews.map(normalize)
    return snap.docs.map(d => normalize(d.data()))
  } catch {
    return mockNews.map(normalize)
  }
}
