/// <reference types="vite/client" />
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp
let db: Firestore
let auth: Auth

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
  db = initializeFirestore(app, { experimentalForceLongPolling: true })
} else {
  app = getApps()[0]
  db = getFirestore(app)
}

auth = getAuth(app)

export { db, auth }
export const storage = getStorage(app)
