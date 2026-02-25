// 차트 데이터 타입
export interface Bar {
  time: number;  // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 심볼 매핑
export function resolveSymbol(uiSymbol: string): string {
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
  };
  
  const resolved = mapping[uiSymbol.toUpperCase()];
  if (!resolved) {
    throw new Error(`Invalid symbol mapping: ${uiSymbol}`);
  }
  return resolved;
}

// 시간간격을 초로 변환
export function resolutionToSeconds(resolution: string): number {
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
  return map[resolution] || 3600;
}

// 로그 유틸리티
export function logEvent(event: string, data: Record<string, any>) {
  console.log(`[${new Date().toISOString()}] ${event}:`, JSON.stringify(data, null, 2));
}

// 데이터 검증
export function assertBarsSortedAsc(bars: Bar[]): boolean {
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].time <= bars[i-1].time) {
      console.error('Bars not sorted ascending:', bars[i-1].time, bars[i].time);
      return false;
    }
  }
  return true;
}

export function assertNoDuplicateTime(bars: Bar[]): boolean {
  const times = new Set();
  for (const bar of bars) {
    if (times.has(bar.time)) {
      console.error('Duplicate time:', bar.time);
      return false;
    }
    times.add(bar.time);
  }
  return true;
}
