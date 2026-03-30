/**
 * 슬라이딩 윈도우 Rate Limiter
 * 넥슨 오픈 API 개발 단계 한도: 5 req/s → 안전하게 4 req/s로 제한
 */
class RateLimiter {
  private slots: number[] = []
  private readonly maxPerSecond: number

  constructor(maxPerSecond = 4) {
    this.maxPerSecond = maxPerSecond
  }

  async acquire(signal?: AbortSignal): Promise<void> {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

      const now = Date.now()
      this.slots = this.slots.filter((t) => now - t < 1000)

      if (this.slots.length < this.maxPerSecond) {
        this.slots.push(now)
        return
      }

      // 가장 오래된 슬롯이 만료될 때까지 대기 (abort 시 즉시 탈출)
      const waitMs = 1000 - (now - this.slots[0]) + 20
      await this.sleep(waitMs, signal)
    }
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const tid = setTimeout(resolve, ms)
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(tid)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    })
  }
}

export const nexonLimiter = new RateLimiter(4)
