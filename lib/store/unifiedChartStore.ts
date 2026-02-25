import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStats {
  lastPrice: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
}

interface ChartState {
  symbol: string;
  resolution: string;
  bars: Bar[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
}

interface UnifiedChartStore {
  // 모드
  mode: 'single' | 'dual';
  setMode: (mode: 'single' | 'dual') => void;
  
  // 활성 패널 (dual 모드용)
  activePane: 'left' | 'right';
  setActivePane: (pane: 'left' | 'right') => void;
  
  // 차트 상태 (2개)
  left: ChartState;
  right: ChartState;
  
  // 액션
  setSymbol: (pane: 'left' | 'right', symbol: string) => void;
  setResolution: (pane: 'left' | 'right', resolution: string) => void;
  setBars: (pane: 'left' | 'right', bars: Bar[]) => void;
  prependBars: (pane: 'left' | 'right', bars: Bar[]) => void;
  setLoading: (pane: 'left' | 'right', loading: boolean) => void;
  setLoadingMore: (pane: 'left' | 'right', loading: boolean) => void;
  setError: (pane: 'left' | 'right', error: string | null) => void;
  markNoMore: (pane: 'left' | 'right') => void;
  resetChart: (pane: 'left' | 'right') => void;
  
  // 헤더 상태 (심볼별)
  marketStats: Record<string, MarketStats>;
  setMarketStats: (symbol: string, stats: MarketStats) => void;
  updatePrice: (symbol: string, price: number, change24h: number, change24hPct: number) => void;
  
  // 현재 표시용 getter
  getActiveSymbol: () => string;
  getActiveResolution: () => string;
  getActiveBars: () => Bar[];
}

const defaultChartState: ChartState = {
  symbol: 'BTC',
  resolution: '1h',
  bars: [],
  isLoading: false,
  error: null,
  hasMore: true,
  isLoadingMore: false,
};

export const useUnifiedChartStore = create<UnifiedChartStore>()(
  persist(
    (set, get) => ({
      mode: 'single',
      setMode: (mode) => set({ mode }),
      
      activePane: 'left',
      setActivePane: (activePane) => set({ activePane }),
      
      left: { ...defaultChartState },
      right: { ...defaultChartState, symbol: 'ETH' },
      
      setSymbol: (pane, symbol) => set((state) => ({
        [pane]: { ...state[pane], symbol, bars: [], hasMore: true, error: null },
      })),
      
      setResolution: (pane, resolution) => set((state) => ({
        [pane]: { ...state[pane], resolution, bars: [], hasMore: true, error: null },
      })),
      
      setBars: (pane, bars) => set((state) => ({
        [pane]: { ...state[pane], bars },
      })),
      
      prependBars: (pane, newBars) => set((state) => {
        const existing = state[pane].bars;
        const merged = [...newBars, ...existing];
        const seen = new Set<number>();
        const deduped = merged.filter((b) => {
          if (seen.has(b.time)) return false;
          seen.add(b.time);
          return true;
        });
        deduped.sort((a, b) => a.time - b.time);
        return { [pane]: { ...state[pane], bars: deduped } };
      }),
      
      setLoading: (pane, isLoading) => set((state) => ({
        [pane]: { ...state[pane], isLoading },
      })),
      
      setLoadingMore: (pane, isLoadingMore) => set((state) => ({
        [pane]: { ...state[pane], isLoadingMore },
      })),
      
      setError: (pane, error) => set((state) => ({
        [pane]: { ...state[pane], error, isLoading: false },
      })),
      
      markNoMore: (pane) => set((state) => ({
        [pane]: { ...state[pane], hasMore: false, isLoadingMore: false },
      })),
      
      resetChart: (pane) => set((state) => ({
        [pane]: { ...defaultChartState, symbol: state[pane].symbol },
      })),
      
      marketStats: {},
      setMarketStats: (symbol, stats) => set((state) => ({
        marketStats: { ...state.marketStats, [symbol]: stats },
      })),
      
      updatePrice: (symbol, price, change24h, change24hPct) => set((state) => ({
        marketStats: {
          ...state.marketStats,
          [symbol]: {
            ...state.marketStats[symbol],
            lastPrice: price,
            change24h,
            change24hPct,
            lastUpdate: Date.now(),
          },
        },
      })),
      
      getActiveSymbol: () => {
        const state = get();
        return state[state.activePane].symbol;
      },
      
      getActiveResolution: () => {
        const state = get();
        return state[state.activePane].resolution;
      },
      
      getActiveBars: () => {
        const state = get();
        return state[state.activePane].bars;
      },
    }),
    {
      name: 'unified-chart-store',
      partialize: (state) => ({
        mode: state.mode,
        activePane: state.activePane,
        left: { symbol: state.left.symbol, resolution: state.left.resolution },
        right: { symbol: state.right.symbol, resolution: state.right.resolution },
      }),
    }
  )
);
