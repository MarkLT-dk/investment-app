import { db } from '../firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

export async function fetchLatestBrief() {
  try {
    const snap = await getDocs(
      query(collection(db, 'dailyBrief'), orderBy('date', 'desc'), limit(1))
    )
    if (snap.empty) return null
    return snap.docs[0].data()
  } catch {
    return null
  }
}
