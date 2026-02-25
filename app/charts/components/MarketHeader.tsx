'use client';

import { useEffect, useState } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { useMarketDataStore } from '@/lib/store/chartStore';
import { logEvent } from '@/lib/utils/chartCore';

interface MarketStats {
  symbol: string;
  lastPrice: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24hBase: number;
  volume24hQuote: number;
  lastUpdate: number;
}

interface MarketHeaderProps {
  symbol: string;
}

export function MarketHeader({ symbol }: MarketHeaderProps) {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { prices } = useMarketDataStore();
  const priceData = prices[symbol];
  
  // 24h stats fetch
  const fetch24hStats = async (sym: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const productId = `${sym}-USD`;
      const res = await fetch(`https://api.exchange.coinbase.com/products/${productId}/stats`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      const statsData: MarketStats = {
        symbol: sym,
        lastPrice: parseFloat(data.last),
        change24h: parseFloat(data.last) - parseFloat(data.open),
        change24hPct: ((parseFloat(data.last) - parseFloat(data.open)) / parseFloat(data.open)) * 100,
        high24h: parseFloat(data.high),
        low24h: parseFloat(data.low),
        volume24hBase: parseFloat(data.volume),
        volume24hQuote: parseFloat(data.volume) * parseFloat(data.last),
        lastUpdate: Date.now(),
      };
      
      setStats(statsData);
      logEvent('MARKET_STATS_LOADED', { symbol: sym });
    } catch (err: any) {
      setError(err.message);
      logEvent('MARKET_STATS_ERROR', { symbol: sym, error: err.message });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetch24hStats(symbol);
    
    // 30초마다 갱신
    const interval = setInterval(() => {
      fetch24hStats(symbol);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  // WS 데이터로 실시간 업데이트
  const displayStats = priceData ? {
    ...stats,
    lastPrice: priceData.price,
    change24h: priceData.change24hValue,
    change24hPct: priceData.change24h,
  } : stats;
  
  if (loading && !displayStats) {
    return (
      <div className="h-16 border-b border-[#30363D] bg-[#161B22] flex items-center px-4">
        <span className="text-[#8B949E]">로딩 중...</span>
      </div>
    );
  }
  
  if (error && !displayStats) {
    return (
      <div className="h-16 border-b border-[#30363D] bg-[#161B22] flex items-center px-4 gap-4">
        <span className="text-red-400">데이터 로드 실패</span>
        <button 
          onClick={() => fetch24hStats(symbol)}
          className="px-3 py-1 bg-[#58A6FF] text-white rounded text-sm"
        >
          재시도
        </button>
      </div>
    );
  }
  
  if (!displayStats?.high24h || !displayStats?.low24h || !displayStats?.volume24hBase) return null;
  
  const isUp = displayStats.change24hPct >= 0;
  
  return (
    <div className="h-16 border-b border-[#30363D] bg-[#161B22] flex items-center px-4 gap-8">
      {/* 심볼 */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-white">{displayStats.symbol}</span>
        <span className="text-sm text-[#8B949E]">/USD</span>
      </div>
      
      {/* 현재가 */}
      <div className="flex flex-col">
        <span className={`text-xl font-bold ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
          ${displayStats.lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      {/* 24h 변동 */}
      <div className="flex flex-col">
        <span className="text-xs text-[#6E7681]">24h 변동</span>
        <span className={`font-medium ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
          {isUp ? '+' : ''}{displayStats.change24hPct.toFixed(2)}%
        </span>
      </div>
      
      {/* 24h 고가/저가 */}
      <div className="flex flex-col">
        <span className="text-xs text-[#6E7681]">24h 고가</span>
        <span className="font-medium text-[#E15241]">${displayStats.high24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs text-[#6E7681]">24h 저가</span>
        <span className="font-medium text-[#2988D9]">${displayStats.low24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
      
      {/* 24h 거래량 */}
      <div className="flex flex-col">
        <span className="text-xs text-[#6E7681]">24h 거래량</span>
        <span className="font-medium text-white">
          {displayStats.volume24hBase > 1000000 
            ? `${(displayStats.volume24hBase / 1000000).toFixed(2)}M` 
            : displayStats.volume24hBase.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          {' '}{symbol}
        </span>
      </div>
    </div>
  );
}
