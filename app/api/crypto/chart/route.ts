import { NextResponse } from 'next/server';

const COINBASE_WS = 'wss://ws-feed.exchange.coinbase.com';
const COINBASE_API = 'https://api.exchange.coinbase.com';

// 심볼 매핑
const SYMBOL_MAP: Record<string, string> = {
  'BTCUSDT': 'BTC-USD',
  'ETHUSDT': 'ETH-USD',
  'BNBUSDT': 'BNB-USD',
  'SOLUSDT': 'SOL-USD',
  'XRPUSDT': 'XRP-USD',
  'ADAUSDT': 'ADA-USD',
  'DOGEUSDT': 'DOGE-USD',
  'AVAXUSDT': 'AVAX-USD',
  'DOTUSDT': 'DOT-USD',
  'LINKUSDT': 'LINK-USD',
};

// 초기 캔들 데이터 가져오기 (REST API)
async function getCandles(productId: string, granularity: number) {
  const end = new Date().toISOString();
  const start = new Date(Date.now() - granularity * 300 * 1000).toISOString();
  
  const url = `${COINBASE_API}/products/${productId}/candles?start=${start}&end=${end}&granularity=${granularity}`;
  
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  
  if (!res.ok) {
    throw new Error(`Candles API error: ${res.status}`);
  }
  
  const candles = await res.json();
  
  // Coinbase candles: [time, low, high, open, close, volume]
  return candles.reverse().map((c: number[]) => ({
    time: c[0],
    low: c[1],
    high: c[2],
    open: c[3],
    close: c[4],
    volume: c[5],
  }));
}

// 현재 가격 및 24h 데이터 가져오기
async function getTicker(productId: string) {
  const [tickerRes, statsRes] = await Promise.all([
    fetch(`${COINBASE_API}/products/${productId}/ticker`),
    fetch(`${COINBASE_API}/products/${productId}/stats`),
  ]);
  
  if (!tickerRes.ok || !statsRes.ok) {
    throw new Error('Ticker API error');
  }
  
  const ticker = await tickerRes.json();
  const stats = await statsRes.json();
  
  return {
    price: parseFloat(ticker.price),
    change24h: ((parseFloat(stats.last) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100,
    high24h: parseFloat(stats.high),
    low24h: parseFloat(stats.low),
    volume24h: parseFloat(stats.volume),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  
  const productId = SYMBOL_MAP[symbol] || 'BTC-USD';
  
  // 간격을 초로 변환
  const granularityMap: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };
  const granularity = granularityMap[interval] || 3600;
  
  try {
    const [candles, ticker] = await Promise.all([
      getCandles(productId, granularity),
      getTicker(productId),
    ]);
    
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      productId,
      currentPrice: ticker.price,
      change24h: ticker.change24h,
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      volume24h: ticker.volume24h,
      chartData: candles,
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Coinbase API error:', error);
    
    return NextResponse.json({
      success: false,
      symbol,
      interval,
      productId,
      currentPrice: 0,
      change24h: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      chartData: [],
      lastUpdated: new Date().toISOString(),
      error: error.message,
    }, { status: 200 });
  }
}
