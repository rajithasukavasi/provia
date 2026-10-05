'use client'

import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase-client'

let client: ReturnType<typeof getFirebaseAuth> | undefined

async function establishSession() {
  const auth = client ?? getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('No Firebase user is signed in.')
  const idToken = await user.getIdToken()
  const response = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })
  if (!response.ok) throw new Error('Could not establish your session.')
}

function firebaseError(error: unknown) {
  const e = error as { code?: string; message?: string }
  const code = e.code?.replace('auth/', '') ?? 'unknown'
  return { message: e.message ?? 'Authentication failed.', code }
}

export function createClient() {
  if (client) return clientShim
  client = getFirebaseAuth()
  return clientShim
}

const clientShim = {
  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        await signInWithEmailAndPassword(client ?? (client = getFirebaseAuth()), email, password)
        await establishSession()
        return { data: { user: client!.currentUser }, error: null }
      } catch (error) {
        return { data: { user: null }, error: firebaseError(error) }
      }
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
      try {
        const auth = client ?? (client = getFirebaseAuth())
        const result = await createUserWithEmailAndPassword(auth, email, password)
        if (options?.data?.full_name) await updateProfile(result.user, { displayName: options.data.full_name })
        await establishSession()
        return { data: { user: result.user, session: { user: result.user } }, error: null }
      } catch (error) {
        return { data: { user: null, session: null }, error: firebaseError(error) }
      }
    },
    async resetPassword(email: string) {
      try {
        await sendPasswordResetEmail(client ?? (client = getFirebaseAuth()), email)
        return { error: null }
      } catch (error) {
        return { error: firebaseError(error) }
      }
    },
    async signOut() {
      try {
        await firebaseSignOut(client ?? (client = getFirebaseAuth()))
        await fetch('/api/auth/signout', { method: 'POST' })
        return { error: null }
      } catch (error) {
        return { error: firebaseError(error) }
      }
    },
  },
}
