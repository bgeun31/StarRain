import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { AuditLogEntry } from '../types'

const COL = 'auditLogs'

interface WriteAuditLogInput {
  action: string
  message: string
  targetType?: string
  targetId?: string
  meta?: Record<string, unknown>
  actor?: {
    uid?: string | null
    email?: string | null
    name?: string | null
  }
}

export async function fetchAuditLogs(limitCount = 300): Promise<AuditLogEntry[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry))
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const currentUser = auth.currentUser
  const actorUid = input.actor?.uid ?? currentUser?.uid ?? ''
  const actorEmail = input.actor?.email ?? currentUser?.email ?? ''
  const actorName = input.actor?.name ?? currentUser?.displayName ?? ''

  await addDoc(collection(db, COL), {
    actorUid,
    actorEmail,
    actorName,
    action: input.action,
    message: input.message,
    targetType: input.targetType ?? '',
    targetId: input.targetId ?? '',
    meta: input.meta ?? {},
    createdAt: serverTimestamp(),
  })
}

export function writeAuditLogSilently(input: WriteAuditLogInput): void {
  writeAuditLog(input).catch((err) => {
    console.error('audit log write failed', err)
  })
}
