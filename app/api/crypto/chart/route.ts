import { NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// 코인 심볼 매핑
const COIN_MAP: Record<string, string> = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'BNBUSDT': 'binancecoin',
  'SOLUSDT': 'solana',
  'XRPUSDT': 'ripple',
  'ADAUSDT': 'cardano',
  'DOGEUSDT': 'dogecoin',
  'AVAXUSDT': 'avalanche-2',
  'DOTUSDT': 'polkadot',
  'LINKUSDT': 'chainlink',
  'PEPEUSDT': 'pepe',
  'SHIBUSDT': 'shiba-inu',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const days = searchParams.get('days') || '1';
  
  const coinId = COIN_MAP[symbol] || 'bitcoin';
  
  try {
    // 시장 차트 데이터 가져오기
    const chartUrl = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    
    const chartRes = await fetch(chartUrl, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!chartRes.ok) {
      const errorText = await chartRes.text();
      console.error('CoinGecko API error:', chartRes.status, errorText);
      throw new Error(`CoinGecko API error: ${chartRes.status}`);
    }
    
    const chartData = await chartRes.json();
    
    // 현재 가격 데이터
    const priceUrl = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_24hr_high=true&include_24hr_low=true`;
    
    const priceRes = await fetch(priceUrl, {
      headers: { 'Accept': 'application/json' },
    });
    
    let currentPrice = 0;
    let change24h = 0;
    let high24h = 0;
    let low24h = 0;
    let volume24h = 0;
    
    if (priceRes.ok) {
      const priceData = await priceRes.json();
      const coin = priceData[coinId];
      if (coin) {
        currentPrice = coin.usd || 0;
        change24h = coin.usd_24h_change || 0;
        high24h = coin.usd_24h_high || 0;
        low24h = coin.usd_24h_low || 0;
        volume24h = coin.usd_24h_vol || 0;
      }
    }
    
    // OHLC 데이터 변환 (prices를 기반으로 간단한 캔들 생성)
    const prices = chartData.prices || [];
    const volumes = chartData.total_volumes || [];
    
    // 1시간 간격으로 샘플링 (CoinGecko는 5분 간격 데이터 제공)
    const ohlcData = [];
    const intervalMs = 60 * 60 * 1000; // 1시간
    
    for (let i = 0; i < prices.length; i += 12) { // 12개 샘플 = 1시간
      const chunk = prices.slice(i, i + 12);
      if (chunk.length === 0) continue;
      
      const open = chunk[0][1];
      const close = chunk[chunk.length - 1][1];
      const high = Math.max(...chunk.map((p: any) => p[1]));
      const low = Math.min(...chunk.map((p: any) => p[1]));
      const time = Math.floor(chunk[0][0] / 1000);
      
      ohlcData.push({
        time,
        open,
        high,
        low,
        close,
        volume: volumes[i] ? volumes[i][1] : 0,
      });
    }
    
    const response = {
      success: true,
      symbol,
      interval: days + 'd',
      currentPrice,
      change24h,
      high24h,
      low24h,
      volume24h,
      chartData: ohlcData,
      lastUpdated: new Date().toISOString(),
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Chart API error:', error);
    
    return NextResponse.json({
      success: false,
      symbol,
      interval: days + 'd',
      currentPrice: 0,
      change24h: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      chartData: [],
      lastUpdated: new Date().toISOString(),
      error: error.message || 'Failed to fetch chart data',
    }, { status: 200 });
  }
}
