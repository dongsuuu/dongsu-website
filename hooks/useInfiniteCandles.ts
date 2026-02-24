'use client';

import { useState, useCallback, useRef } from 'react';

interface UseInfiniteCandlesOptions {
  symbol: string;
  granularity: number;
  limit?: number;
}

export function useInfiniteCandles({ symbol, granularity, limit = 300 }: UseInfiniteCandlesOptions) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const oldestTimeRef = useRef<number | null>(null);
  const isLoadingRef = useRef(false);

  // 초기 데이터 로드
  const loadInitial = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const productId = `${symbol}-USD`;
      const res = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/candles?granularity=${granularity}&limit=${limit}`
      );
      
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      
      const candles = await res.json();
      const formatted = candles.reverse().map((c: number[]) => ({
        time: c[0],
        low: c[1],
        high: c[2],
        open: c[3],
        close: c[4],
        volume: c[5],
      }));
      
      setData(formatted);
      oldestTimeRef.current = formatted[0]?.time || null;
      setHasMore(candles.length === limit);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [symbol, granularity, limit]);

  // 과거 데이터 추가 로드
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !oldestTimeRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      const productId = `${symbol}-USD`;
      const end = new Date(oldestTimeRef.current * 1000).toISOString();
      const start = new Date((oldestTimeRef.current - granularity * limit) * 1000).toISOString();
      
      const res = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/candles?start=${start}&end=${end}&granularity=${granularity}`
      );
      
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      
      const candles = await res.json();
      if (candles.length === 0) {
        setHasMore(false);
        return;
      }
      
      const formatted = candles.reverse().map((c: number[]) => ({
        time: c[0],
        low: c[1],
        high: c[2],
        open: c[3],
        close: c[4],
        volume: c[5],
      }));
      
      setData(prev => [...formatted, ...prev]);
      oldestTimeRef.current = formatted[0]?.time || null;
      setHasMore(candles.length >= limit / 2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [symbol, granularity, limit, hasMore]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadInitial,
    loadMore,
  };
}
