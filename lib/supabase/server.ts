import 'server-only'
import { cookies } from 'next/headers'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import type { Query } from 'firebase-admin/firestore'

export const FIREBASE_SESSION_COOKIE = 'provia-firebase-session'

type Filter = { field: string; value: unknown }

function mapUser(decoded: { uid: string; email?: string; name?: string | null }) {
  return { id: decoded.uid, email: decoded.email ?? null, user_metadata: { full_name: decoded.name ?? '' } }
}

async function getUser() {
  const token = (await cookies()).get(FIREBASE_SESSION_COOKIE)?.value
  if (!token) return null
  try { return mapUser(await getAdminAuth().verifySessionCookie(token, true)) }
  catch { return null }
}

function toDocValue(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  return value
}

class QueryBuilder {
  private table: string
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: Record<string, unknown> | Record<string, unknown>[] | undefined
  private filters: Filter[] = []
  private orderBy: { field: string; ascending: boolean } | undefined
  private selectColumns: string | undefined
  private wantsSingle = false
  private wantsMaybeSingle = false

  constructor(table: string) { this.table = table }
  select(columns?: string) { this.selectColumns = columns; return this }
  eq(field: string, value: unknown) { this.filters.push({ field, value }); return this }
  order(field: string, options?: { ascending?: boolean }) { this.orderBy = { field, ascending: options?.ascending ?? true }; return this }
  insert(payload: Record<string, unknown> | Record<string, unknown>[]) { this.operation = 'insert'; this.payload = payload; return this }
  update(payload: Record<string, unknown>) { this.operation = 'update'; this.payload = payload; return this }
  delete() { this.operation = 'delete'; return this }
  single() { this.wantsSingle = true; return this.execute() }
  maybeSingle() { this.wantsMaybeSingle = true; return this.execute() }
  then(resolve: (value: any) => any, reject?: (reason: unknown) => any) { return this.execute().then(resolve, reject) }

  private async execute() {
    const user = await getUser()
    if (!user) return { data: null, error: { message: 'Not authenticated.', code: 'AUTH' } }
    const db = getAdminDb()
    const base = this.table === 'profiles' ? db.collection('users').doc(user.id) : db.collection('users').doc(user.id).collection('resumes')

    try {
      if (this.operation === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload!]
        const results: Record<string, unknown>[] = []
        for (const item of items) {
          const id = typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID()
          const clean = Object.fromEntries(Object.entries(item).map(([k, v]) => [k, toDocValue(v)]))
          if (this.table === 'profiles') {
            await base.set({ ...clean, id: user.id }, { merge: true })
            results.push({ ...clean, id: user.id })
          } else {
            await base.doc(id).set({ ...clean, id }, { merge: true })
            results.push({ ...clean, id })
          }
        }
        return { data: results, error: null }
      }

      if (this.table === 'profiles') {
        const snap = await base.get()
        let row = snap.exists ? { id: user.id, ...snap.data() } : null
        if (this.operation === 'update' && row) {
          const patch = Object.fromEntries(Object.entries(this.payload ?? {}).map(([k, v]) => [k, toDocValue(v)]))
          await base.set(patch, { merge: true }); row = { ...row, ...patch }
        }
        if (this.operation === 'delete') { await base.delete(); row = null }
        if (row) row = applyFilters([row], this.filters)[0] ?? null
        return { data: this.wantsSingle || this.wantsMaybeSingle ? row : row ? [row] : [], error: null }
      }

      let query: Query = base
      for (const f of this.filters) if (f.field !== 'user_id') query = query.where(f.field, '==', f.value)
      if (this.orderBy) query = query.orderBy(this.orderBy.field, this.orderBy.ascending ? 'asc' : 'desc')
      const snap = await query.get()
      let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (this.operation === 'update') {
        for (const row of rows) await base.doc(String(row.id)).set(this.payload ?? {}, { merge: true })
        rows = rows.map((row) => ({ ...row, ...(this.payload ?? {}) }))
      } else if (this.operation === 'delete') {
        for (const row of rows) await base.doc(String(row.id)).delete()
        rows = []
      }
      return { data: this.wantsSingle || this.wantsMaybeSingle ? (rows[0] ?? null) : rows, error: null }
    } catch (error) {
      console.error('[provia] Firestore compatibility error:', error)
      return { data: null, error: { message: error instanceof Error ? error.message : 'Database operation failed.' } }
    }
  }
}

function applyFilters(rows: Record<string, unknown>[], filters: Filter[]) {
  return rows.filter((row) => filters.every((f) => f.field === 'user_id' || row[f.field] === f.value))
}

class StorageShim {
  from() {
    return {
      async upload(path: string, bytes: Buffer, options?: { contentType?: string }) {
        const user = await getUser(); if (!user) return { data: null, error: { message: 'Not authenticated.' } }
        const contentType = options?.contentType ?? 'image/jpeg'
        const photoUrl = `data:${contentType};base64,${bytes.toString('base64')}`
        await getAdminDb().collection('users').doc(user.id).set({ photo_path: path, photoUrl, updated_at: new Date().toISOString() }, { merge: true })
        return { data: { path }, error: null }
      },
      async remove(paths: string[]) {
        const user = await getUser(); if (user && paths.length) await getAdminDb().collection('users').doc(user.id).set({ photo_path: null, photoUrl: null }, { merge: true })
        return { data: null, error: null }
      },
      async createSignedUrl() {
        const user = await getUser(); if (!user) return { data: null, error: { message: 'Not authenticated.' } }
        const snap = await getAdminDb().collection('users').doc(user.id).get()
        return { data: { signedUrl: snap.data()?.photoUrl ?? null }, error: null }
      },
    }
  }
}

export async function createClient() {
  const user = await getUser()
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: user ? null : { message: 'Not authenticated.' } }),
      signOut: async () => {
        const store = await cookies(); store.delete(FIREBASE_SESSION_COOKIE); return { error: null }
      },
    },
    from: (table: string) => new QueryBuilder(table),
    storage: new StorageShim(),
  }
}
