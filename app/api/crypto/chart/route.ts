import { NextResponse } from 'next/server';

const BINANCE_API = 'https://api.binance.com/api/v3';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    // Kline 데이터 가져오기
    const klinesRes = await fetch(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { cache: 'no-store' }
    );
    
    if (!klinesRes.ok) {
      throw new Error(`Klines API error: ${klinesRes.status}`);
    }
    
    const klines = await klinesRes.json();
    
    // 24h 티커 데이터
    const tickerRes = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${symbol}`, {
      cache: 'no-store'
    });
    
    if (!tickerRes.ok) {
      throw new Error(`Ticker API error: ${tickerRes.status}`);
    }
    
    const ticker = await tickerRes.json();
    
    // 차트 데이터 변환
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
    
    return NextResponse.json({
      success: false,
      symbol,
      interval,
      currentPrice: 0,
      change24h: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      chartData: [],
      lastUpdated: new Date().toISOString(),
      error: error.message || 'Failed to fetch chart data',
    }, { status: 500 });
  }
}
