import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc, getDocs, serverTimestamp,
} from 'firebase/firestore'

export async function fetchSavedArticles() {
  const snap = await getDocs(collection(db, 'savedArticles'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
}

export async function saveArticle(data) {
  return addDoc(collection(db, 'savedArticles'), {
    ...data,
    savedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  })
}

export async function deleteSavedArticle(id) {
  return deleteDoc(doc(db, 'savedArticles', id))
}
