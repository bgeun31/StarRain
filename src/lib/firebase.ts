/// <reference types="vite/client" />
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp
let db: Firestore

if (getApps().length === 0) {
  // 최초 초기화: experimentalForceLongPolling으로 WebSocket Watch Stream 비활성화
  // → React StrictMode / Vite HMR에서 동시 쿼리 Watch Stream 충돌("Unexpected state") 방지
  app = initializeApp(firebaseConfig)
  db = initializeFirestore(app, { experimentalForceLongPolling: true })
} else {
  // HMR로 모듈이 재실행될 때 기존 앱 재사용
  app = getApps()[0]
  db = getFirestore(app)
}

export { db }
export const storage = getStorage(app)
