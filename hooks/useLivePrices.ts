'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPct: number;
  volume24h: number;
  lastUpdate: number;
}

export function useLivePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, TickerData>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  
  const connect = useCallback(() => {
    if (symbols.length === 0) return;
    
    const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    wsRef.current = ws;
    
    ws.onopen = () => {
      reconnectRef.current = 0;
      const productIds = symbols.map((s) => `${s}-USD`);
      ws.send(JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker'],
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ticker') {
          const symbol = msg.product_id.split('-')[0];
          const price = parseFloat(msg.price);
          const open24h = parseFloat(msg.open_24h);
          const change24h = price - open24h;
          const change24hPct = (change24h / open24h) * 100;
          
          setPrices((prev) => ({
            ...prev,
            [symbol]: {
              symbol,
              price,
              change24h,
              change24hPct,
              volume24h: parseFloat(msg.volume_24h),
              lastUpdate: Date.now(),
            },
          }));
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
    
    ws.onerror = () => {
      // 에러는 onclose에서 처리
    };
    
    ws.onclose = () => {
      if (reconnectRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectRef.current), 30000);
        reconnectRef.current++;
        setTimeout(connect, delay);
      }
    };
  }, [symbols]);
  
  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
  
  return prices;
}
