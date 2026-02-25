'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { resolveSymbol, logEvent, Bar } from '@/lib/utils/chartCore';

interface TickerMessage {
  type: 'ticker';
  product_id: string;
  price: string;
  open_24h: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  time: string;
}

interface MatchMessage {
  type: 'match';
  product_id: string;
  price: string;
  size: string;
  time: string;
  side: 'buy' | 'sell';
}

const COINBASE_WS = 'wss://ws-feed.exchange.coinbase.com';

export function useChartWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    subscriptions,
    subscribe,
    unsubscribe,
    isSubscribed,
    getBars,
    setBars,
  } = useChartCoreStore();

  // WebSocket 연결 및 구독 관리
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    logEvent('WS_CONNECT', { attempt: reconnectAttemptRef.current + 1 });
    
    try {
      const ws = new WebSocket(COINBASE_WS);
      wsRef.current = ws;
      
      ws.onopen = () => {
        logEvent('WS_OPEN', {});
        reconnectAttemptRef.current = 0;
        
        // 현재 모든 구독 재신청
        const currentSubs = useChartCoreStore.getState().subscriptions;
        currentSubs.forEach((key) => {
          const [symbol, resolution] = key.split(':');
          const productId = resolveSymbol(symbol);
          ws.send(JSON.stringify({
            type: 'subscribe',
            product_ids: [productId],
            channels: ['ticker', 'matches'],
          }));
          logEvent('WS_SUBSCRIBE', { symbol, resolution, productId });
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'ticker') {
            handleTicker(msg as TickerMessage);
          } else if (msg.type === 'match') {
            handleMatch(msg as MatchMessage);
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      };
      
      ws.onerror = (err) => {
        logEvent('WS_ERROR', { error: 'WebSocket error' });
      };
      
      ws.onclose = () => {
        logEvent('WS_CLOSE', { attempt: reconnectAttemptRef.current });
        wsRef.current = null;
        
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          reconnectAttemptRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      logEvent('WS_CONNECT_ERROR', { error: String(err) });
    }
  }, []);

  // 티커 메시지 처리
  const handleTicker = useCallback((msg: TickerMessage) => {
    const symbol = msg.product_id.split('-')[0];
    
    // 모든 resolution에 대해 현재 가격 업데이트
    ['1m', '5m', '15m', '30m', '1h', '4h', '1d'].forEach((resolution) => {
      const key = `${symbol}:${resolution}`;
      if (!isSubscribed(symbol, resolution)) return;
      
      const bars = getBars(symbol, resolution);
      if (bars.length === 0) return;
      
      // 마지막 캔들 업데이트
      const lastBar = bars[bars.length - 1];
      const price = parseFloat(msg.price);
      
      const updatedBar: Bar = {
        ...lastBar,
        close: price,
        high: Math.max(lastBar.high, price),
        low: Math.min(lastBar.low, price),
      };
      
      const newBars = [...bars.slice(0, -1), updatedBar];
      setBars(key, newBars);
    });
  }, [getBars, setBars, isSubscribed]);

  // 체결 메시지 처리 (새로운 캔들 생성)
  const handleMatch = useCallback((msg: MatchMessage) => {
    // 1분 캔들에만 실시간 반영
    const symbol = msg.product_id.split('-')[0];
    const key = `${symbol}:1m`;
    
    if (!isSubscribed(symbol, '1m')) return;
    
    const bars = getBars(symbol, '1m');
    const price = parseFloat(msg.price);
    const size = parseFloat(msg.size);
    const time = Math.floor(new Date(msg.time).getTime() / 1000 / 60) * 60; // 1분 단위
    
    if (bars.length === 0) return;
    
    const lastBar = bars[bars.length - 1];
    
    if (time === lastBar.time) {
      // 현재 캔들 업데이트
      const updatedBar: Bar = {
        ...lastBar,
        close: price,
        high: Math.max(lastBar.high, price),
        low: Math.min(lastBar.low, price),
        volume: lastBar.volume + size,
      };
      setBars(key, [...bars.slice(0, -1), updatedBar]);
    } else if (time > lastBar.time) {
      // 새 캔들 생성
      const newBar: Bar = {
        time,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: size,
      };
      setBars(key, [...bars, newBar]);
    }
  }, [getBars, setBars, isSubscribed]);

  // 구독 변경 시 WebSocket 업데이트
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // 구독 추가/제거 함수
  const subscribeBars = useCallback((symbol: string, resolution: string) => {
    subscribe(symbol, resolution);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const productId = resolveSymbol(symbol);
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        product_ids: [productId],
        channels: ['ticker', 'matches'],
      }));
      logEvent('WS_SUBSCRIBE', { symbol, resolution });
    }
  }, [subscribe]);

  const unsubscribeBars = useCallback((symbol: string, resolution: string) => {
    unsubscribe(symbol, resolution);
    
    // 마지막 구독이었으면 WebSocket에서도 해제
    const key = `${symbol}:${resolution}`;
    const hasOtherResolution = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'].some(
      (r) => r !== resolution && isSubscribed(symbol, r)
    );
    
    if (!hasOtherResolution && wsRef.current?.readyState === WebSocket.OPEN) {
      const productId = resolveSymbol(symbol);
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        product_ids: [productId],
        channels: ['ticker', 'matches'],
      }));
      logEvent('WS_UNSUBSCRIBE', { symbol, resolution });
    }
  }, [unsubscribe, isSubscribed]);

  return {
    subscribeBars,
    unsubscribeBars,
  };
}
