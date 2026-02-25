'use client';

import { useEffect, useRef, useReducer, useCallback } from 'react';
import { normalizeSymbol, resolutionToSeconds, logEvent } from '@/lib/utils/chartUtils';

const COINBASE_API = 'https://api.exchange.coinbase.com';
const BATCH_SIZE = 300;

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartState {
  data: CandleData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

type ChartAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: CandleData[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'PREPEND_DATA'; payload: CandleData[] }
  | { type: 'LOAD_MORE_START' }
  | { type: 'LOAD_MORE_DONE' }
  | { type: 'MARK_NO_MORE' }
  | { type: 'RESET' };

const initialState: ChartState = {
  data: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
};

function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'PREPEND_DATA':
      const merged = [...action.payload, ...state.data];
      const seen = new Set<number>();
      const unique = merged.filter((d) => {
        if (seen.has(d.time)) return false;
        seen.add(d.time);
        return true;
      });
      unique.sort((a, b) => a.time - b.time);
      return { ...state, isLoadingMore: false, data: unique };
    case 'LOAD_MORE_START':
      return { ...state, isLoadingMore: true };
    case 'LOAD_MORE_DONE':
      return { ...state, isLoadingMore: false };
    case 'MARK_NO_MORE':
      return { ...state, hasMore: false, isLoadingMore: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Coinbase fetch with UA
async function coinbaseFetch(url: string, signal?: AbortSignal): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': 'dongsu-pro-chart/1.0' },
    signal,
  });
}

export function useChartData(symbol: string, resolution: string) {
  const [state, dispatch] = useReducer(chartReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  // 캔들 배치 로드
  const loadBatch = useCallback(async (
    sym: string,
    res: string,
    endSec: number,
    count: number,
    signal: AbortSignal
  ): Promise<CandleData[]> => {
    const gran = resolutionToSeconds(res);
    const startSec = endSec - gran * count;
    const productId = normalizeSymbol(sym);
    
    const url = `${COINBASE_API}/products/${productId}/candles?` +
      `start=${new Date(startSec * 1000).toISOString()}&` +
      `end=${new Date(endSec * 1000).toISOString()}&` +
      `granularity=${gran}`;
    
    const res_ = await coinbaseFetch(url, signal);
    if (!res_.ok) throw new Error(`HTTP ${res_.status}`);
    
    const candles = await res_.json();
    return candles
      .map((c: number[]) => ({
        time: c[0],
        low: c[1],
        high: c[2],
        open: c[3],
        close: c[4],
        volume: c[5],
      }))
      .sort((a: CandleData, b: CandleData) => a.time - b.time);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (!symbol || !resolution) return;
    
    // 이전 요청 취소
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    
    dispatch({ type: 'FETCH_START' });
    logEvent('CHART_FETCH_START', { symbol, resolution });
    
    const fetchData = async () => {
      try {
        const allData: CandleData[] = [];
        let endSec = Math.floor(Date.now() / 1000);
        let pages = 0;
        const maxPages = 5; // 1500개 최대
        
        while (allData.length < 1200 && pages < maxPages) {
          const batch = await loadBatch(symbol, resolution, endSec, BATCH_SIZE, signal);
          if (batch.length === 0) break;
          
          allData.unshift(...batch);
          endSec = batch[0].time - 1;
          pages++;
          
          if (signal.aborted) return;
        }
        
        // 중복 제거
        const seen = new Set<number>();
        const unique = allData.filter((d) => {
          if (seen.has(d.time)) return false;
          seen.add(d.time);
          return true;
        });
        unique.sort((a, b) => a.time - b.time);
        
        dispatch({ type: 'FETCH_SUCCESS', payload: unique });
        logEvent('CHART_FETCH_SUCCESS', { symbol, resolution, count: unique.length });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        dispatch({ type: 'FETCH_ERROR', payload: err.message });
        logEvent('CHART_FETCH_ERROR', { symbol, resolution, error: err.message });
      }
    };
    
    fetchData();
    
    return () => abortRef.current?.abort();
  }, [symbol, resolution, loadBatch]);

  // 과거 데이터 추가 로드
  const loadMore = useCallback(async (oldestTime: number) => {
    if (loadingMoreRef.current || !state.hasMore) return;
    loadingMoreRef.current = true;
    dispatch({ type: 'LOAD_MORE_START' });
    
    try {
      const abortController = new AbortController();
      const batch = await loadBatch(symbol, resolution, oldestTime - 1, BATCH_SIZE, abortController.signal);
      
      if (batch.length === 0) {
        dispatch({ type: 'MARK_NO_MORE' });
      } else {
        dispatch({ type: 'PREPEND_DATA', payload: batch });
      }
    } catch (err: any) {
      console.error('Load more error:', err);
    } finally {
      loadingMoreRef.current = false;
      dispatch({ type: 'LOAD_MORE_DONE' });
    }
  }, [symbol, resolution, state.hasMore, loadBatch]);

  return {
    ...state,
    loadMore,
    refresh: () => dispatch({ type: 'RESET' }),
  };
}
