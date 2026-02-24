'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMarketDataStore } from '@/lib/store/chartStore';
import { getCoinbaseProductId } from '@/lib/constants/symbols';

interface TickerMessage {
  type: 'ticker';
  product_id: string;
  price: string;
  open_24h: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  volume_30d: string;
  best_bid: string;
  best_ask: string;
  side: 'buy' | 'sell';
  time: string;
  trade_id: number;
  last_size: string;
}

export function useCoinbaseWebSocket(symbols: string[]) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectDelay = 30000;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { setWsStatus, updatePrice, updateLastMessage } = useMarketDataStore();

  const connect = useCallback(() => {
    if (symbols.length === 0) return;
    
    // 기존 연결 정리
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    
    setWsStatus('connecting');
    
    const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Coinbase WebSocket connected');
      setWsStatus('connected');
      reconnectAttemptRef.current = 0;
      
      // 구독 요청
      const productIds = symbols.map(getCoinbaseProductId);
      ws.send(JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker'],
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message: TickerMessage = JSON.parse(event.data);
        
        if (message.type === 'ticker') {
          const symbol = message.product_id.split('-')[0];
          const price = parseFloat(message.price);
          const open24h = parseFloat(message.open_24h);
          const change24h = ((price - open24h) / open24h) * 100;
          
          updatePrice(symbol, {
            price,
            change24h,
            change24hValue: price - open24h,
            high24h: parseFloat(message.high_24h),
            low24h: parseFloat(message.low_24h),
            volume24h: parseFloat(message.volume_24h),
            volume24hQuote: parseFloat(message.volume_30d) / 30, // 근사치
          });
          
          updateLastMessage();
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('reconnecting');
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
      setWsStatus('disconnected');
      
      // 재연결 (Exponential backoff)
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptRef.current),
        maxReconnectDelay
      );
      
      reconnectAttemptRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Reconnecting... attempt ${reconnectAttemptRef.current}`);
        connect();
      }, delay);
    };
  }, [symbols, setWsStatus, updatePrice, updateLastMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.onclose = null; // 재연결 방지
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setWsStatus('disconnected');
  }, [setWsStatus]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
  };
}
