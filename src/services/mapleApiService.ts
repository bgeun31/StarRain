/// <reference types="vite/client" />
import type { NexonCharacterBasic, NexonGuildBasic } from '../types'
import { nexonLimiter } from './rateLimiter'

const BASE = import.meta.env.DEV
  ? '/nexon-api'
  : 'https://open.api.nexon.com'

function apiKey(): string {
  return import.meta.env.VITE_NEXON_API_KEY ?? ''
}

interface NexonErrorBody {
  error?: { name?: string; message?: string }
}

/**
 * 넥슨 API 오류 코드
 * OPENAPI00007 = 초당 요청 한도 초과 (재시도 가능)
 * OPENAPI00008 = 일일 요청 한도 초과 (재시도 불가)
 */
function classifyError(status: number, body: NexonErrorBody): Error {
  const code = body?.error?.name ?? ''
  const msg  = body?.error?.message ?? ''

  if (status === 429) {
    if (code === 'OPENAPI00008') {
      return new Error(
        '일일 요청 한도 초과 (OPENAPI00008)\n' +
        '개발 단계 API 키는 하루 1,000회로 제한됩니다.\n' +
        '자정(KST) 이후 초기화되거나, openapi.nexon.com에서 서비스 단계로 업그레이드하세요.',
      )
    }
    // OPENAPI00007: 초당 한도 — 호출부에서 retry 처리
    return Object.assign(new Error(`초당 요청 한도 초과 (${code || '429'}): ${msg}`), {
      retryable: true,
    })
  }

  return new Error(`넥슨 API 오류 (${status}): ${msg || code}`)
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const tid = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(tid); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}

async function get<T>(
  path: string,
  params: Record<string, string> = {},
  signal?: AbortSignal,
  attempt = 0,
): Promise<T> {
  await nexonLimiter.acquire(signal)

  const url = new URL(`${BASE}${path}`, location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { 'x-nxopen-api-key': apiKey() },
    signal,
  })

  if (!res.ok) {
    const body: NexonErrorBody = await res.json().catch(() => ({}))
    const err = classifyError(res.status, body)

    // 초당 한도 초과 → 최대 2회 재시도 (지수 백오프)
    if ((err as Error & { retryable?: boolean }).retryable && attempt < 2) {
      const retryAfterSec = parseInt(res.headers.get('Retry-After') ?? '1', 10)
      const waitMs = Math.max(retryAfterSec * 1000, (attempt + 1) * 600)
      await sleep(waitMs, signal)
      return get<T>(path, params, signal, attempt + 1)
    }

    throw err
  }

  return res.json() as Promise<T>
}

export async function fetchGuildId(
  guildName: string,
  worldName: string,
  signal?: AbortSignal,
): Promise<string> {
  const data = await get<{ oguild_id: string }>(
    '/maplestory/v1/guild/id',
    { guild_name: guildName, world_name: worldName },
    signal,
  )
  return data.oguild_id
}

export async function fetchGuildBasic(
  oguildId: string,
  signal?: AbortSignal,
): Promise<NexonGuildBasic> {
  return get<NexonGuildBasic>('/maplestory/v1/guild/basic', { oguild_id: oguildId }, signal)
}

export async function fetchCharacterOcid(
  characterName: string,
  signal?: AbortSignal,
): Promise<string> {
  const data = await get<{ ocid: string }>(
    '/maplestory/v1/id',
    { character_name: characterName },
    signal,
  )
  return data.ocid
}

export async function fetchCharacterBasic(
  ocid: string,
  signal?: AbortSignal,
): Promise<NexonCharacterBasic> {
  return get<NexonCharacterBasic>('/maplestory/v1/character/basic', { ocid }, signal)
}

