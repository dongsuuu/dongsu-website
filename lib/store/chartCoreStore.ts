import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bar } from '@/lib/utils/chartCore';

// 차트 인스턴스 참조 (TradingView chart instances)
interface ChartInstance {
  id: string;
  symbol: string;
  resolution: string;
  containerRef: HTMLDivElement | null;
}

// 단일 진실 상태
interface ChartCoreState {
  // 모드
  mode: 'single' | 'dual';
  setMode: (mode: 'single' | 'dual') => void;
  
  // 활성 설정 (single source of truth)
  activeSymbol: string;
  activeResolution: string;
  setActiveSymbol: (symbol: string) => void;
  setActiveResolution: (resolution: string) => void;
  
  // Dual 모드 설정
  leftSymbol: string;
  leftResolution: string;
  rightSymbol: string;
  rightResolution: string;
  setLeftConfig: (symbol: string, resolution: string) => void;
  setRightConfig: (symbol: string, resolution: string) => void;
  
  // 데이터
  bars: Record<string, Bar[]>; // key: "${symbol}:${resolution}"
  setBars: (key: string, bars: Bar[]) => void;
  prependBars: (key: string, bars: Bar[]) => void;
  getBars: (symbol: string, resolution: string) => Bar[];
  
  // WebSocket 구독 관리
  subscriptions: Set<string>; // "${symbol}:${resolution}"
  subscribe: (symbol: string, resolution: string) => void;
  unsubscribe: (symbol: string, resolution: string) => void;
  isSubscribed: (symbol: string, resolution: string) => boolean;
  
  // 로딩 상태
  loading: Set<string>;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (symbol: string, resolution: string) => boolean;
  
  // 에러 상태
  errors: Record<string, string>;
  setError: (key: string, error: string | null) => void;
  
  // 더 이상 데이터 없음
  noMoreHistory: Set<string>;
  markNoMoreHistory: (symbol: string, resolution: string) => void;
  hasMoreHistory: (symbol: string, resolution: string) => boolean;
  
  // 활성 패널 (우측 정보 패널용)
  activePane: 'left' | 'right';
  setActivePane: (pane: 'left' | 'right') => void;
  getActivePaneSymbol: () => string;
}

export const useChartCoreStore = create<ChartCoreState>()(
  persist(
    (set, get) => ({
      // 모드
      mode: 'single',
      setMode: (mode) => set({ mode }),
      
      // 활성 설정
      activeSymbol: 'BTC',
      activeResolution: '1h',
      setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
      setActiveResolution: (resolution) => set({ activeResolution: resolution }),
      
      // Dual 모드 설정
      leftSymbol: 'BTC',
      leftResolution: '1h',
      rightSymbol: 'ETH',
      rightResolution: '1h',
      setLeftConfig: (symbol, resolution) => set({ leftSymbol: symbol, leftResolution: resolution }),
      setRightConfig: (symbol, resolution) => set({ rightSymbol: symbol, rightResolution: resolution }),
      
      // 데이터
      bars: {},
      setBars: (key, bars) => set((state) => ({
        bars: { ...state.bars, [key]: bars },
      })),
      prependBars: (key, newBars) => set((state) => {
        const existing = state.bars[key] || [];
        // 중복 제거 및 정렬
        const merged = [...newBars, ...existing];
        const unique = merged.filter((bar, index, self) => 
          index === self.findIndex((b) => b.time === bar.time)
        );
        unique.sort((a, b) => a.time - b.time);
        return { bars: { ...state.bars, [key]: unique } };
      }),
      getBars: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        return get().bars[key] || [];
      },
      
      // 구독 관리
      subscriptions: new Set(),
      subscribe: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        set((state) => {
          const newSubs = new Set(state.subscriptions);
          newSubs.add(key);
          return { subscriptions: newSubs };
        });
      },
      unsubscribe: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        set((state) => {
          const newSubs = new Set(state.subscriptions);
          newSubs.delete(key);
          return { subscriptions: newSubs };
        });
      },
      isSubscribed: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        return get().subscriptions.has(key);
      },
      
      // 로딩
      loading: new Set(),
      setLoading: (key, isLoading) => set((state) => {
        const newLoading = new Set(state.loading);
        if (isLoading) {
          newLoading.add(key);
        } else {
          newLoading.delete(key);
        }
        return { loading: newLoading };
      }),
      isLoading: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        return get().loading.has(key);
      },
      
      // 에러
      errors: {},
      setError: (key, error) => set((state) => ({
        errors: { ...state.errors, [key]: error || '' },
      })),
      
      // 더 이상 데이터 없음
      noMoreHistory: new Set(),
      markNoMoreHistory: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        set((state) => {
          const newSet = new Set(state.noMoreHistory);
          newSet.add(key);
          return { noMoreHistory: newSet };
        });
      },
      hasMoreHistory: (symbol, resolution) => {
        const key = `${symbol}:${resolution}`;
        return !get().noMoreHistory.has(key);
      },
      
      // 활성 패널
      activePane: 'left',
      setActivePane: (pane) => set({ activePane: pane }),
      getActivePaneSymbol: () => {
        const state = get();
        return state.activePane === 'left' ? state.leftSymbol : state.rightSymbol;
      },
    }),
    {
      name: 'chart-core-storage',
      partialize: (state) => ({
        mode: state.mode,
        activeSymbol: state.activeSymbol,
        activeResolution: state.activeResolution,
        leftSymbol: state.leftSymbol,
        leftResolution: state.leftResolution,
        rightSymbol: state.rightSymbol,
        rightResolution: state.rightResolution,
      }),
    }
  )
);
