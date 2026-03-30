import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../lib/firebase'

function getExtension(file: File): string {
  const byName = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (byName) return byName.replace(/[^a-z0-9]/g, '')

  const byType = file.type.split('/').pop()?.toLowerCase() ?? 'bin'
  return byType.replace(/[^a-z0-9]/g, '')
}

export async function uploadSavedGuildIcon(guildId: string, file: File): Promise<string> {
  const ext = getExtension(file) || 'bin'
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `savedGuildIcons/${guildId}/${key}`
  const fileRef = ref(storage, path)

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
    cacheControl: 'public,max-age=31536000,immutable',
  })

  return getDownloadURL(fileRef)
}
