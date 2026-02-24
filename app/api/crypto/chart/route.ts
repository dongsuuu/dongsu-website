import { NextResponse } from 'next/server';

const BINANCE_API = 'https://api.binance.com/api/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    console.log(`Fetching chart data: ${symbol}, ${interval}, ${limit}`);
    
    // Kline 데이터 가져오기
    const klinesUrl = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    console.log('Klines URL:', klinesUrl);
    
    const klinesRes = await fetch(klinesUrl, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!klinesRes.ok) {
      const errorText = await klinesRes.text();
      console.error('Klines API error:', klinesRes.status, errorText);
      throw new Error(`Klines API error: ${klinesRes.status}`);
    }
    
    const klines = await klinesRes.json();
    console.log('Klines received:', klines.length);
    
    // 24h 티커 데이터
    const tickerUrl = `${BINANCE_API}/ticker/24hr?symbol=${symbol}`;
    console.log('Ticker URL:', tickerUrl);
    
    const tickerRes = await fetch(tickerUrl, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!tickerRes.ok) {
      const errorText = await tickerRes.text();
      console.error('Ticker API error:', tickerRes.status, errorText);
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
    
    const response = {
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
    };
    
    console.log('Response prepared successfully');
    return NextResponse.json(response);
    
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
    }, { status: 200 }); // 200으로 반환하여 클라이언트에서 처리
  }
}
