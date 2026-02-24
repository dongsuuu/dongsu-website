import { NextResponse } from 'next/server';

// CORS 프록시 목록 (묶어서 사용)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

// Binance API 직접 호출 (Vercel 서버 위치에 따라 다름)
const BINANCE_API = 'https://api.binance.com/api/v3';

async function fetchWithProxy(url: string, retries = 2): Promise<Response> {
  // 먼저 직접 호출 시도
  try {
    const directRes = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    
    if (directRes.ok && directRes.status !== 451) {
      return directRes;
    }
  } catch (e) {
    console.log('Direct fetch failed, trying proxy...');
  }
  
  // 프록시로 시도
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const res = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      
      if (res.ok) return res;
    } catch (e) {
      console.log(`Proxy failed: ${proxy}`);
      continue;
    }
  }
  
  throw new Error('All fetch methods failed');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    // Kline 데이터
    const klinesUrl = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const klinesRes = await fetchWithProxy(klinesUrl);
    const klines = await klinesRes.json();
    
    // Ticker 데이터
    const tickerUrl = `${BINANCE_API}/ticker/24hr?symbol=${symbol}`;
    const tickerRes = await fetchWithProxy(tickerUrl);
    const ticker = await tickerRes.json();
    
    // 데이터 변환
    const chartData = klines.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
    
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      currentPrice: parseFloat(ticker.lastPrice),
      change24h: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume24h: parseFloat(ticker.volume),
      chartData,
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Chart API error:', error);
    
    // 폴드백: 더미 데이터
    return NextResponse.json({
      success: false,
      symbol,
      interval,
      currentPrice: 0,
      change24h: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      chartData: generateDummyData(),
      lastUpdated: new Date().toISOString(),
      error: error.message,
    }, { status: 200 });
  }
}

// 폴드백 데이터
function generateDummyData() {
  const data = [];
  let price = 45000;
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = 100; i >= 0; i--) {
    const open = price;
    const close = price * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, close) * 1.005;
    const low = Math.min(open, close) * 0.995;
    
    data.push({
      time: now - i * 3600,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000,
    });
    
    price = close;
  }
  
  return data;
}
