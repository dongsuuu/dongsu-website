'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMarketDataStore } from '@/lib/store/chartStore';

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
  const isConnectingRef = useRef(false);
  
  const { setWsStatus, updatePrice, updateLastMessage } = useMarketDataStore();

  const connect = useCallback(() => {
    // 이미 연결 중이면 중복 방지
    if (isConnectingRef.current) return;
    if (symbols.length === 0) return;
    
    // 기존 연결 정리
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    
    isConnectingRef.current = true;
    setWsStatus('connecting');
    
    try {
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Coinbase WebSocket connected');
        setWsStatus('connected');
        reconnectAttemptRef.current = 0;
        isConnectingRef.current = false;
        
        // 구독 요청
        const productIds = symbols.map(s => `${s}-USD`);
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
              volume24hQuote: parseFloat(message.volume_30d) / 30,
            });
            
            updateLastMessage();
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // onclose에서 처리
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed');
        setWsStatus('disconnected');
        isConnectingRef.current = false;
        wsRef.current = null;
        
        // 재연결 (최대 5회)
        if (reconnectAttemptRef.current < 5) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptRef.current),
            maxReconnectDelay
          );
          
          reconnectAttemptRef.current++;
          console.log(`Reconnecting in ${delay}ms... attempt ${reconnectAttemptRef.current}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached');
          setWsStatus('disconnected');
        }
      };
    } catch (err) {
      console.error('WebSocket creation error:', err);
      isConnectingRef.current = false;
      setWsStatus('disconnected');
    }
  }, [symbols, setWsStatus, updatePrice, updateLastMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    
    reconnectAttemptRef.current = 0;
    isConnectingRef.current = false;
    setWsStatus('disconnected');
  }, [setWsStatus]);

  useEffect(() => {
    // 심볼이 변경될 때만 연결
    if (symbols.length > 0) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols)]);

  return {
    connect,
    disconnect,
  };
}
