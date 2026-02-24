import { NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// 지원하는 코인 목록
const COINS = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  ethereum: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  'usd-coin': { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin') || 'bitcoin';
  const days = searchParams.get('days') || '1';

  try {
    // 가격 차트 데이터 가져오기
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }

    const data = await response.json();

    // TradingView 형식으로 변환
    const chartData = data.prices.map((item: [number, number]) => ({
      time: Math.floor(item[0] / 1000),
      value: item[1],
    }));

    // 현재 가격 정보
    const currentPrice = chartData[chartData.length - 1]?.value || 0;
    const previousPrice = chartData[0]?.value || 0;
    const change24h = ((currentPrice - previousPrice) / previousPrice) * 100;

    return NextResponse.json({
      success: true,
      coin: COINS[coinId as keyof typeof COINS] || COINS.bitcoin,
      currentPrice,
      change24h: Number(change24h.toFixed(2)),
      chartData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chart API error:', error);
    
    // 폴백 데이터
    return NextResponse.json({
      success: false,
      coin: COINS[coinId as keyof typeof COINS] || COINS.bitcoin,
      currentPrice: 0,
      change24h: 0,
      chartData: generateFallbackData(),
      lastUpdated: new Date().toISOString(),
      error: 'Using fallback data',
    });
  }
}

// 폴백 차트 데이터 생성
function generateFallbackData() {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  let price = 45000;
  
  for (let i = 100; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.5) * 0.02);
    data.push({
      time: now - i * 3600,
      value: price,
    });
  }
  
  return data;
}
