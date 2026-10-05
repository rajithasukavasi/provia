import 'server-only'
import { cert, getApps, getApp, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getFirebaseAdminApp() {
  if (getApps().length) return getApp()
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured.')
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

export function getAdminAuth() { return getAuth(getFirebaseAdminApp()) }
export function getAdminDb() { return getFirestore(getFirebaseAdminApp()) }
