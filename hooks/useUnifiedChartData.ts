'use client';

import { useCallback, useRef } from 'react';
import { useUnifiedChartStore } from '@/lib/store/unifiedChartStore';
import { 
  normalizeSymbol, 
  resolutionToSeconds, 
  logEvent, 
  withTimeout, 
  retryWithBackoff,
  mergePrependDedup,
} from '@/lib/utils/chartUtils';

const COINBASE_API = 'https://api.exchange.coinbase.com';
const CANDLE_LIMIT = 300; // Coinbase max

// fetch with UA
async function coinbaseFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': 'dongsu-pro-chart/1.0' },
  });
}

export function useUnifiedChartData() {
  const { setBars, prependBars, setLoading, setLoadingMore, setError, markNoMore } = useUnifiedChartStore();
  const loadingRef = useRef<Set<string>>(new Set());
  
  // 단일 배치 로드 (300개)
  const loadBatch = useCallback(async (
    symbol: string,
    resolution: string,
    endSec: number,
    count: number
  ) => {
    const gran = resolutionToSeconds(resolution);
    const startSec = endSec - gran * count;
    
    const url = `${COINBASE_API}/products/${symbol}/candles?` +
      `start=${new Date(startSec * 1000).toISOString()}&` +
      `end=${new Date(endSec * 1000).toISOString()}&` +
      `granularity=${gran}`;
    
    const res = await retryWithBackoff(
      () => withTimeout(coinbaseFetch(url), 5000, 'CANDLE_FETCH'),
      { retries: 2, baseMs: 1000 }
    );
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const candles = await res.json();
    
    // [time, low, high, open, close, volume]
    return candles.map((c: number[]) => ({
      time: c[0],
      low: c[1],
      high: c[2],
      open: c[3],
      close: c[4],
      volume: c[5],
    })).sort((a: any, b: any) => a.time - b.time);
  }, []);
  
  // 초기 로드 (targetBars 개까지 여러 번 호출)
  const loadInitialHistory = useCallback(async (
    pane: 'left' | 'right',
    uiSymbol: string,
    resolution: string,
    targetBars: number = 1200
  ) => {
    const key = `${pane}:${uiSymbol}:${resolution}`;
    if (loadingRef.current.has(key)) return;
    loadingRef.current.add(key);
    
    logEvent('LOAD_INITIAL_START', { pane, symbol: uiSymbol, resolution, targetBars });
    setLoading(pane, true);
    
    try {
      const symbol = normalizeSymbol(uiSymbol);
      const allBars: any[] = [];
      let endSec = Math.floor(Date.now() / 1000);
      let remaining = targetBars;
      let pages = 0;
      const maxPages = Math.ceil(targetBars / CANDLE_LIMIT) + 2;
      
      while (remaining > 0 && pages < maxPages) {
        const count = Math.min(remaining, CANDLE_LIMIT);
        const bars = await loadBatch(symbol, resolution, endSec, count);
        
        if (bars.length === 0) break;
        
        allBars.unshift(...bars);
        remaining -= bars.length;
        endSec = bars[0].time - 1;
        pages++;
        
        // 중복 방지를 위해 약간 겹치게
        endSec = Math.max(endSec, bars[0].time - resolutionToSeconds(resolution) * 5);
      }
      
      // 중복 제거 및 정렬
      const seen = new Set<number>();
      const unique = allBars.filter((b: any) => {
        if (seen.has(b.time)) return false;
        seen.add(b.time);
        return true;
      });
      unique.sort((a: any, b: any) => a.time - b.time);
      
      setBars(pane, unique);
      logEvent('LOAD_INITIAL_SUCCESS', { pane, symbol: uiSymbol, count: unique.length, pages });
      
    } catch (err: any) {
      logEvent('LOAD_INITIAL_ERROR', { pane, symbol: uiSymbol, error: err.message });
      setError(pane, err.message);
    } finally {
      setLoading(pane, false);
      loadingRef.current.delete(key);
    }
  }, [loadBatch, setBars, setLoading, setError]);
  
  // 과거 데이터 추가 로드 (무한 스크롤)
  const loadMoreHistory = useCallback(async (
    pane: 'left' | 'right',
    uiSymbol: string,
    resolution: string,
    oldestTime: number
  ) => {
    const key = `${pane}:${uiSymbol}:${resolution}:more`;
    if (loadingRef.current.has(key)) return;
    loadingRef.current.add(key);
    
    logEvent('LOAD_MORE_START', { pane, symbol: uiSymbol, resolution, oldestTime });
    setLoadingMore(pane, true);
    
    try {
      const symbol = normalizeSymbol(uiSymbol);
      const newBars = await loadBatch(
        symbol, 
        resolution, 
        oldestTime - 1, 
        CANDLE_LIMIT
      );
      
      if (newBars.length === 0) {
        markNoMore(pane);
        logEvent('LOAD_MORE_NO_DATA', { pane, symbol: uiSymbol });
        return;
      }
      
      prependBars(pane, newBars);
      logEvent('LOAD_MORE_SUCCESS', { pane, symbol: uiSymbol, count: newBars.length });
      
    } catch (err: any) {
      logEvent('LOAD_MORE_ERROR', { pane, symbol: uiSymbol, error: err.message });
    } finally {
      setLoadingMore(pane, false);
      loadingRef.current.delete(key);
    }
  }, [loadBatch, prependBars, setLoadingMore, markNoMore]);
  
  return {
    loadInitialHistory,
    loadMoreHistory,
  };
}
