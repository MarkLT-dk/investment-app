import { db } from '../firebase'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function fetchWatchlist() {
  const snap = await getDocs(collection(db, 'watchlist'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''))
}

export async function addWatchlistItem(data) {
  return addDoc(collection(db, 'watchlist'), {
    ...data,
    dateAdded: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
  })
}

export async function updateWatchlistItem(id, data) {
  return updateDoc(doc(db, 'watchlist', id), data)
}

export async function removeWatchlistItem(id) {
  return deleteDoc(doc(db, 'watchlist', id))
}
