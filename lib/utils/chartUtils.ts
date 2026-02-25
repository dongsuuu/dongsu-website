// 심볼 표준화
export function normalizeSymbol(uiSymbol: string): string {
  // UI: BTC/USD, BTCUSD, BTC → Coinbase: BTC-USD
  const clean = uiSymbol.toUpperCase().replace(/[^A-Z]/g, '');
  
  const mapping: Record<string, string> = {
    'BTC': 'BTC-USD',
    'ETH': 'ETH-USD',
    'SOL': 'SOL-USD',
    'BNB': 'BNB-USD',
    'XRP': 'XRP-USD',
    'ADA': 'ADA-USD',
    'DOGE': 'DOGE-USD',
    'AVAX': 'AVAX-USD',
    'DOT': 'DOT-USD',
    'LINK': 'LINK-USD',
    'MATIC': 'MATIC-USD',
    'UNI': 'UNI-USD',
    'LTC': 'LTC-USD',
    'NEAR': 'NEAR-USD',
    'APT': 'APT-USD',
    'FIL': 'FIL-USD',
  };
  
  const result = mapping[clean];
  if (!result) {
    throw new Error(`SYMBOL_MAPPING_FAILED: ${uiSymbol} → ?`);
  }
  return result;
}

// 시간간격 → 초
export function resolutionToSeconds(res: string): number {
  const map: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
  };
  return map[res] || 3600;
}

// 버킷 시간 계산 (WS 업데이트용)
export function bucketTime(tsSec: number, resolution: string): number {
  const gran = resolutionToSeconds(resolution);
  return Math.floor(tsSec / gran) * gran;
}

// 검증 함수들
export function assertSortedAsc(bars: Array<{ time: number }>): boolean {
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].time <= bars[i-1].time) {
      console.error('❌ Bars not sorted:', bars[i-1].time, bars[i].time);
      return false;
    }
  }
  return true;
}

export function dedupeByTime<T extends { time: number }>(bars: T[]): T[] {
  const seen = new Set<number>();
  return bars.filter((b) => {
    if (seen.has(b.time)) return false;
    seen.add(b.time);
    return true;
  });
}

export function mergePrependDedup<T extends { time: number }>(
  existing: T[],
  incoming: T[]
): T[] {
  const merged = [...incoming, ...existing];
  const deduped = dedupeByTime(merged);
  return deduped.sort((a, b) => a.time - b.time);
}

// 로그
export function logEvent(event: string, data: Record<string, any>) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${event}:`, JSON.stringify(data));
}

// 타임아웃 래퍼
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// 재시도
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: { retries: number; baseMs: number }
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= opts.retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (i < opts.retries) {
        const delay = opts.baseMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError!;
}
