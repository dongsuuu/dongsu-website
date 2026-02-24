import { NextResponse } from 'next/server';

const UPBIT_API = 'https://api.upbit.com/v1';

// 심볼 매핑 (USDT → KRW)
const SYMBOL_MAP: Record<string, string> = {
  'BTCUSDT': 'KRW-BTC',
  'ETHUSDT': 'KRW-ETH',
  'BNBUSDT': 'KRW-BNB',
  'SOLUSDT': 'KRW-SOL',
  'XRPUSDT': 'KRW-XRP',
  'ADAUSDT': 'KRW-ADA',
  'DOGEUSDT': 'KRW-DOGE',
  'AVAXUSDT': 'KRW-AVAX',
  'DOTUSDT': 'KRW-DOT',
  'LINKUSDT': 'KRW-LINK',
  'PEPEUSDT': 'KRW-PEPE',
  'SHIBUSDT': 'KRW-SHIB',
};

// 간격 매핑
const INTERVAL_MAP: Record<string, string> = {
  '1m': 'minutes/1',
  '5m': 'minutes/5',
  '15m': 'minutes/15',
  '1h': 'minutes/60',
  '4h': 'minutes/240',
  '1d': 'days',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  const count = parseInt(searchParams.get('limit') || '100');
  
  const upbitSymbol = SYMBOL_MAP[symbol] || 'KRW-BTC';
  const upbitInterval = INTERVAL_MAP[interval] || 'minutes/60';
  
  try {
    // 캔들 데이터
    const candleUrl = `${UPBIT_API}/candles/${upbitInterval}?market=${upbitSymbol}&count=${count}`;
    
    const candleRes = await fetch(candleUrl, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
    });
    
    if (!candleRes.ok) {
      const errorText = await candleRes.text();
      console.error('Upbit API error:', candleRes.status, errorText);
      throw new Error(`Upbit API error: ${candleRes.status}`);
    }
    
    const candles = await candleRes.json();
    
    // 현재가/24시간 데이터
    const tickerUrl = `${UPBIT_API}/ticker?markets=${upbitSymbol}`;
    const tickerRes = await fetch(tickerUrl, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
    });
    
    let currentPrice = 0;
    let change24h = 0;
    let high24h = 0;
    let low24h = 0;
    let volume24h = 0;
    
    if (tickerRes.ok) {
      const tickers = await tickerRes.json();
      const ticker = tickers[0];
      if (ticker) {
        currentPrice = ticker.trade_price;
        change24h = (ticker.signed_change_rate || 0) * 100;
        high24h = ticker.high_price;
        low24h = ticker.low_price;
        volume24h = ticker.acc_trade_volume_24h;
      }
    }
    
    // 데이터 변환 (업비트는 최신이 앞에 옴 → 역순 정렬)
    const chartData = candles.reverse().map((c: any) => ({
      time: Math.floor(new Date(c.candle_date_time_kst).getTime() / 1000),
      open: c.opening_price,
      high: c.high_price,
      low: c.low_price,
      close: c.trade_price,
      volume: c.candle_acc_trade_volume,
    }));
    
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      currentPrice,
      change24h,
      high24h,
      low24h,
      volume24h,
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
