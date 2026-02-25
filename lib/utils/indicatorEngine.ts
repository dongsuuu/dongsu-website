// RSI 계산
export function computeRSI(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) return [];
  
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;
  
  // 초기 평균
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

// MACD 계산
export function computeMACD(
  closes: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  
  const macd: number[] = [];
  const startIdx = slow - 1;
  
  for (let i = startIdx; i < closes.length; i++) {
    macd.push(emaFast[i] - emaSlow[i]);
  }
  
  const signalLine = calculateEMA(macd, signal);
  const histogram: number[] = [];
  
  for (let i = 0; i < macd.length; i++) {
    histogram.push(macd[i] - (signalLine[i] || 0));
  }
  
  return { macd, signal: signalLine, histogram };
}

// EMA 계산
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // 초기 SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
    ema.push(sum / (i + 1));
  }
  
  // EMA 계산
  for (let i = period; i < data.length; i++) {
    const value = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(value);
  }
  
  return ema;
}

// 이동평균 계산
export function calculateMA(data: number[], period: number): number[] {
  const ma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    ma.push(sum / period);
  }
  return ma;
}
