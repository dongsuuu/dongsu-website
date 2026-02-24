import { NextResponse } from 'next/server';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const BINANCE_API = 'https://api.binance.com/api/v3';

// 시총 TOP 10 코인 (Binance 심볼)
const TOP_COINS = [
  { id: 'bitcoin', symbol: 'BTCUSDT', name: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETHUSDT', name: 'Ethereum', color: '#627EEA' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', color: '#26A17B' },
  { id: 'binancecoin', symbol: 'BNBUSDT', name: 'BNB', color: '#F3BA2F' },
  { id: 'solana', symbol: 'SOLUSDT', name: 'Solana', color: '#00FFA3' },
  { id: 'ripple', symbol: 'XRPUSDT', name: 'XRP', color: '#23292F' },
  { id: 'usd-coin', symbol: 'USDCUSDT', name: 'USDC', color: '#2775CA' },
  { id: 'cardano', symbol: 'ADAUSDT', name: 'Cardano', color: '#0033AD' },
  { id: 'dogecoin', symbol: 'DOGEUSDT', name: 'Dogecoin', color: '#C2A633' },
  { id: 'avalanche-2', symbol: 'AVAXUSDT', name: 'Avalanche', color: '#E84142' },
];

// 트렌딩 코인 (임시 - 실제로는 CoinGecko 트렌딩 API 사용)
const TRENDING_COINS = [
  { id: 'pepe', symbol: 'PEPEUSDT', name: 'Pepe', color: '#4CA64C' },
  { id: 'shiba-inu', symbol: 'SHIBUSDT', name: 'Shiba Inu', color: '#FFA409' },
  { id: 'chainlink', symbol: 'LINKUSDT', name: 'Chainlink', color: '#2A5ADA' },
  { id: 'polygon', symbol: 'MATICUSDT', name: 'Polygon', color: '#8247E5' },
  { id: 'polkadot', symbol: 'DOTUSDT', name: 'Polkadot', color: '#E6007A' },
  { id: 'uniswap', symbol: 'UNIUSDT', name: 'Uniswap', color: '#FF007A' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'top';
  
  const coins = type === 'trending' ? TRENDING_COINS : TOP_COINS;
  
  try {
    // 24시간 가격 변동률 가져오기
    const tickersRes = await fetch(`${BINANCE_API}/ticker/24hr`);
    const tickers = await tickersRes.json();
    
    const coinData = coins.map(coin => {
      const ticker = tickers.find((t: any) => t.symbol === coin.symbol);
      return {
        ...coin,
        price: ticker ? parseFloat(ticker.lastPrice) : 0,
        change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
        volume24h: ticker ? parseFloat(ticker.volume) : 0,
        high24h: ticker ? parseFloat(ticker.highPrice) : 0,
        low24h: ticker ? parseFloat(ticker.lowPrice) : 0,
      };
    });
    
    return NextResponse.json({
      success: true,
      type,
      coins: coinData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      type,
      coins: coins.map(c => ({ ...c, price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0 })),
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch live data',
    });
  }
}
