// RSI (Relative Strength Index) 계산
export function calculateRSI(data: { close: number }[], period: number = 14): { time: number; value: number }[] {
  if (data.length < period + 1) return [];
  
  const rsi = [];
  let gains = 0;
  let losses = 0;
  
  // 초기 평균 계산
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // RSI 계산
  for (let i = period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    // Smoothing (Wilder's method)
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    
    rsi.push({
      time: i,
      value: Math.round(rsiValue * 100) / 100,
    });
  }
  
  return rsi;
}

// MACD 계산
export function calculateMACD(
  data: { close: number }[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}[] {
  if (data.length < slowPeriod + signalPeriod) return [];
  
  const emaFast = calculateEMA(data.map(d => d.close), fastPeriod);
  const emaSlow = calculateEMA(data.map(d => d.close), slowPeriod);
  
  // MACD Line = EMA(fast) - EMA(slow)
  const macdLine = emaFast.map((fast, i) => ({
    time: i,
    value: fast - emaSlow[i],
  }));
  
  // Signal Line = EMA(MACD, signalPeriod)
  const signalLine = calculateEMA(
    macdLine.map(m => m.value),
    signalPeriod
  );
  
  // Histogram = MACD - Signal
  const result = [];
  for (let i = signalPeriod - 1; i < macdLine.length; i++) {
    const macd = macdLine[i].value;
    const signal = signalLine[i - signalPeriod + 1] || 0;
    result.push({
      time: i,
      macd: Math.round(macd * 100) / 100,
      signal: Math.round(signal * 100) / 100,
      histogram: Math.round((macd - signal) * 100) / 100,
    });
  }
  
  return result;
}

// EMA 계산
function calculateEMA(data: number[], period: number): number[] {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // 초기 SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);
  
  // EMA 계산
  for (let i = period; i < data.length; i++) {
    const currentValue: number = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentValue);
  }
  
  return ema;
}

// 볼린저 밴드 (추가)
export function calculateBollingerBands(
  data: { close: number }[],
  period: number = 20,
  stdDev: number = 2
): {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}[] {
  const bands = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map(d => d.close);
    
    const sma = closes.reduce((a, b) => a + b, 0) / period;
    const variance = closes.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    bands.push({
      time: i,
      upper: Math.round((sma + stdDev * std) * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round((sma - stdDev * std) * 100) / 100,
    });
  }
  
  return bands;
}
