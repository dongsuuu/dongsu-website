import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CoinMetadata } from '@/lib/constants/symbols';

// 차트 상태
interface ChartState {
  // 현재 선택된 코인
  selectedCoin: CoinMetadata;
  setSelectedCoin: (coin: CoinMetadata) => void;
  
  // 듀얼 모드
  isDualMode: boolean;
  toggleDualMode: () => void;
  
  // 두 번째 차트 코인 (듀얼 모드)
  secondCoin: CoinMetadata | null;
  setSecondCoin: (coin: CoinMetadata | null) => void;
  
  // 시간 간격
  timeframe: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
  setTimeframe: (tf: ChartState['timeframe']) => void;
  
  // 크로스헤어 동기화
  crosshairTime: number | null;
  setCrosshairTime: (time: number | null) => void;
  
  // 차트 가시 범위 동기화
  visibleRange: { from: number; to: number } | null;
  setVisibleRange: (range: { from: number; to: number } | null) => void;
  
  // 지표 표시
  showMA: boolean;
  toggleMA: () => void;
  showVolume: boolean;
  toggleVolume: () => void;
  
  // 즐겨찾기
  favorites: string[];
  toggleFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
}

export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      selectedCoin: {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        nameKo: '비트코인',
        color: '#F7931A',
        marketCapRank: 1,
      },
      setSelectedCoin: (coin) => set({ selectedCoin: coin }),
      
      isDualMode: false,
      toggleDualMode: () => set((state) => ({ isDualMode: !state.isDualMode })),
      
      secondCoin: null,
      setSecondCoin: (coin) => set({ secondCoin: coin }),
      
      timeframe: '1h',
      setTimeframe: (tf) => set({ timeframe: tf }),
      
      crosshairTime: null,
      setCrosshairTime: (time) => set({ crosshairTime: time }),
      
      visibleRange: null,
      setVisibleRange: (range) => set({ visibleRange: range }),
      
      showMA: true,
      toggleMA: () => set((state) => ({ showMA: !state.showMA })),
      showVolume: true,
      toggleVolume: () => set((state) => ({ showVolume: !state.showVolume })),
      
      favorites: [],
      toggleFavorite: (symbol) => set((state) => ({
        favorites: state.favorites.includes(symbol)
          ? state.favorites.filter((s) => s !== symbol)
          : [...state.favorites, symbol],
      })),
      isFavorite: (symbol) => get().favorites.includes(symbol),
    }),
    {
      name: 'chart-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        timeframe: state.timeframe,
        showMA: state.showMA,
        showVolume: state.showVolume,
      }),
    }
  )
);

// 시장 데이터 상태 (WebSocket 데이터)
interface MarketDataState {
  // 실시간 가격 데이터
  prices: Record<string, {
    price: number;
    change24h: number;
    change24hValue: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    volume24hQuote: number;
    lastUpdate: number;
  }>;
  updatePrice: (symbol: string, data: Partial<MarketDataState['prices'][string]>) => void;
  getPrice: (symbol: string) => MarketDataState['prices'][string] | undefined;
  
  // WebSocket 연결 상태
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  setWsStatus: (status: MarketDataState['wsStatus']) => void;
  lastWsMessage: number;
  updateLastMessage: () => void;
}

export const useMarketDataStore = create<MarketDataState>()((set, get) => ({
  prices: {},
  updatePrice: (symbol, data) => set((state) => ({
    prices: {
      ...state.prices,
      [symbol]: {
        ...state.prices[symbol],
        ...data,
        lastUpdate: Date.now(),
      },
    },
  })),
  getPrice: (symbol) => get().prices[symbol],
  
  wsStatus: 'disconnected',
  setWsStatus: (status) => set({ wsStatus: status }),
  lastWsMessage: 0,
  updateLastMessage: () => set({ lastWsMessage: Date.now() }),
}));
