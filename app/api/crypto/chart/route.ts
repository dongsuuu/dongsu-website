import { NextResponse } from 'next/server';

const BINANCE_API = 'https://api.binance.com/api/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h'; // 1m, 5m, 15m, 1h, 4h, 1d
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    // Kline (캔들스틱) 데이터 가져오기
    const response = await fetch(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { next: { revalidate: 10 } } // 10초 캐시
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch kline data');
    }
    
    const klines = await response.json();
    
    // TradingView 형식으로 변환
    const chartData = klines.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000), // timestamp
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
    
    // 현재 가격 정보
    const tickerRes = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${symbol}`);
    const ticker = await tickerRes.json();
    
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
  } catch (error) {
    console.error('Chart API error:', error);
    
    return NextResponse.json({
      success: false,
      symbol,
      interval,
      currentPrice: 0,
      change24h: 0,
      chartData: [],
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch chart data',
    });
  }
}
