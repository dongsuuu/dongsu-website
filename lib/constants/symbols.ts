// 공식 암호화폐 심볼 매핑
// 출처: CoinGecko, CoinMarketCap, 공식 거래소

export interface CoinMetadata {
  id: string;           // CoinGecko ID
  symbol: string;       // 공식 심볼 (대문자)
  name: string;         // 공식 이름
  nameKo?: string;      // 한글명 (있는 경우)
  color: string;        // 브랜드 컬러
  logoUrl?: string;     // 로고 URL
  marketCapRank?: number;
}

// 시총 TOP 20 + 주요 알트코인
export const COINS: CoinMetadata[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', nameKo: '비트코인', color: '#F7931A', marketCapRank: 1 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', nameKo: '이더리움', color: '#627EEA', marketCapRank: 2 },
  { id: 'tether', symbol: 'USDT', name: 'Tether', nameKo: '테더', color: '#26A17B', marketCapRank: 3 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', nameKo: '비앤비', color: '#F3BA2F', marketCapRank: 4 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', nameKo: '솔라나', color: '#00FFA3', marketCapRank: 5 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', nameKo: '리플', color: '#23292F', marketCapRank: 6 },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', nameKo: '유에스디코인', color: '#2775CA', marketCapRank: 7 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', nameKo: '카르다노', color: '#0033AD', marketCapRank: 8 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', nameKo: '도지코인', color: '#C2A633', marketCapRank: 9 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', nameKo: '아발란체', color: '#E84142', marketCapRank: 10 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', nameKo: '체인링크', color: '#2A5ADA', marketCapRank: 11 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', nameKo: '폴카닷', color: '#E6007A', marketCapRank: 12 },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon', nameKo: '폴리곤', color: '#8247E5', marketCapRank: 13 },
  { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin', color: '#F7931A', marketCapRank: 14 },
  { id: 'tron', symbol: 'TRX', name: 'TRON', nameKo: '트론', color: '#FF060A', marketCapRank: 15 },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', nameKo: '유니스왑', color: '#FF007A', marketCapRank: 16 },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', nameKo: '라이트코인', color: '#345D9D', marketCapRank: 17 },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', nameKo: '니어프로토콜', color: '#00C1DE', marketCapRank: 18 },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', color: '#000000', marketCapRank: 19 },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', nameKo: '파일코인', color: '#0090FF', marketCapRank: 20 },
  // 알트코인
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', color: '#4CA64C' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', nameKo: '시바이누', color: '#FFA409' },
  { id: 'floki', symbol: 'FLOKI', name: 'FLOKI', color: '#F7B93C' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', color: '#F2A900' },
  { id: 'dogwifhat', symbol: 'WIF', name: 'dogwifhat', color: '#8B5CF6' },
];

// Coinbase Pro product_id 매핑
export const COINBASE_PRODUCTS: Record<string, string> = {
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  'BNB': 'BNB-USD',
  'SOL': 'SOL-USD',
  'XRP': 'XRP-USD',
  'ADA': 'ADA-USD',
  'DOGE': 'DOGE-USD',
  'AVAX': 'AVAX-USD',
  'DOT': 'DOT-USD',
  'LINK': 'LINK-USD',
  'MATIC': 'MATIC-USD',
  'UNI': 'UNI-USD',
  'LTC': 'LTC-USD',
  'NEAR': 'NEAR-USD',
  'APT': 'APT-USD',
  'FIL': 'FIL-USD',
};

// 심볼로 코인 정보 조회
export function getCoinBySymbol(symbol: string): CoinMetadata | undefined {
  return COINS.find(c => c.symbol === symbol.toUpperCase());
}

// Coinbase product_id 조회
export function getCoinbaseProductId(symbol: string): string {
  return COINBASE_PRODUCTS[symbol.toUpperCase()] || `${symbol.toUpperCase()}-USD`;
}

// 검색 (심볼, 이름, 한글명)
export function searchCoins(query: string): CoinMetadata[] {
  const lowerQuery = query.toLowerCase();
  return COINS.filter(c => 
    c.symbol.toLowerCase().includes(lowerQuery) ||
    c.name.toLowerCase().includes(lowerQuery) ||
    c.nameKo?.includes(query) ||
    false
  );
}
