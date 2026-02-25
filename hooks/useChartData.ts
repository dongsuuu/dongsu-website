'use client';

import { useCallback } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { resolveSymbol, resolutionToSeconds, logEvent, Bar } from '@/lib/utils/chartCore';

const COINBASE_API = 'https://api.exchange.coinbase.com';

// fetch with User-Agent (required by Coinbase)
async function coinbaseFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'User-Agent': 'dongsu-pro-chart/1.0',
    },
  });
}

export function useChartData() {
  const {
    setBars,
    prependBars,
    setLoading,
    setError,
    markNoMoreHistory,
  } = useChartCoreStore();

  // 초기 히스토리 로드
  const loadHistory = useCallback(async (
    uiSymbol: string,
    resolution: string,
    opts: { to?: number; limit?: number } = {}
  ): Promise<Bar[]> => {
    const symbol = resolveSymbol(uiSymbol);
    const granularity = resolutionToSeconds(resolution);
    const key = `${uiSymbol}:${resolution}`;
    const limit = opts.limit || 300;
    
    logEvent('LOAD_HISTORY_START', { symbol, resolution, key });
    
    setLoading(key, true);
    setError(key, null);
    
    try {
      const to = opts.to || Math.floor(Date.now() / 1000);
      const from = to - granularity * limit;
      
      const url = `${COINBASE_API}/products/${symbol}/candles?start=${new Date(from * 1000).toISOString()}&end=${new Date(to * 1000).toISOString()}&granularity=${granularity}`;
      
      const res = await coinbaseFetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const candles = await res.json();
      
      // Coinbase candles: [time, low, high, open, close, volume]
      const bars: Bar[] = candles
        .map((c: number[]) => ({
          time: c[0],
          low: c[1],
          high: c[2],
          open: c[3],
          close: c[4],
          volume: c[5],
        }))
        .sort((a: Bar, b: Bar) => a.time - b.time);
      
      setBars(key, bars);
      
      logEvent('LOAD_HISTORY_SUCCESS', { 
        symbol, 
        resolution, 
        count: bars.length,
        firstTime: bars[0]?.time,
        lastTime: bars[bars.length - 1]?.time,
      });
      
      return bars;
    } catch (error: any) {
      logEvent('LOAD_HISTORY_ERROR', { symbol, resolution, error: error.message });
      setError(key, error.message);
      return [];
    } finally {
      setLoading(key, false);
    }
  }, [setBars, setLoading, setError]);

  // 과거 데이터 추가 로드 (prepend)
  const loadMoreHistory = useCallback(async (
    uiSymbol: string,
    resolution: string,
    oldestTime: number
  ): Promise<Bar[]> => {
    const symbol = resolveSymbol(uiSymbol);
    const granularity = resolutionToSeconds(resolution);
    const key = `${uiSymbol}:${resolution}`;
    const limit = 300;
    
    logEvent('LOAD_MORE_START', { symbol, resolution, oldestTime });
    
    setLoading(key, true);
    
    try {
      const to = oldestTime - 1;
      const from = to - granularity * limit;
      
      const url = `${COINBASE_API}/products/${symbol}/candles?start=${new Date(from * 1000).toISOString()}&end=${new Date(to * 1000).toISOString()}&granularity=${granularity}`;
      
      const res = await coinbaseFetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const candles = await res.json();
      
      if (candles.length === 0) {
        markNoMoreHistory(uiSymbol, resolution);
        logEvent('LOAD_MORE_NO_DATA', { symbol, resolution });
        return [];
      }
      
      const bars: Bar[] = candles
        .map((c: number[]) => ({
          time: c[0],
          low: c[1],
          high: c[2],
          open: c[3],
          close: c[4],
          volume: c[5],
        }))
        .sort((a: Bar, b: Bar) => a.time - b.time);
      
      prependBars(key, bars);
      
      logEvent('LOAD_MORE_SUCCESS', { 
        symbol, 
        resolution, 
        count: bars.length,
        firstTime: bars[0]?.time,
        lastTime: bars[bars.length - 1]?.time,
      });
      
      return bars;
    } catch (error: any) {
      logEvent('LOAD_MORE_ERROR', { symbol, resolution, error: error.message });
      return [];
    } finally {
      setLoading(key, false);
    }
  }, [prependBars, setLoading, markNoMoreHistory]);

  return {
    loadHistory,
    loadMoreHistory,
  };
}
