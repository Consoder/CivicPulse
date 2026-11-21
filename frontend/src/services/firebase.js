/**
 * Firebase client SDK — initialisation and auth helpers.
 * Import { auth, storage, db } from here everywhere in the app.
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as _signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// ─── Firebase config (from Vite env vars) ────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)

export const signOut = () => _signOut(auth)

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

// ─── Firestore realtime helpers ───────────────────────────────────────────────

/**
 * Subscribe to the issues collection with optional filters.
 * Returns an unsubscribe function.
 */
export function subscribeToIssues({ status, category } = {}, callback) {
  let q = query(
    collection(db, 'issues'),
    orderBy('createdAt', 'desc'),
    limit(100),
  )
  if (status)   q = query(q, where('status', '==', status))
  if (category) q = query(q, where('category', '==', category))

  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(issues)
  })
}

/**
 * Subscribe to a single issue document.
 * Returns an unsubscribe function.
 */
export function subscribeToIssue(issueId, callback) {
  return onSnapshot(doc(db, 'issues', issueId), (d) => {
    callback(d.exists() ? { id: d.id, ...d.data() } : null)
  })
}
