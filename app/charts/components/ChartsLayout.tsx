'use client';

import { useEffect, useState, useMemo } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { useCoinbaseWebSocket } from '@/hooks/useCoinbaseWebSocket';
import { MarketPanel } from './MarketPanel';
import { ChartArea } from './ChartArea';
import { TopBar } from './TopBar';

export function ChartsLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const { selectedCoin, isDualMode, secondCoin, favorites } = useChartStore();
  
  // 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // WebSocket 연결할 심볼 목록 - useMemo로 안정화
  const wsSymbols = useMemo(() => {
    const symbols = [selectedCoin.symbol];
    if (isDualMode && secondCoin) {
      symbols.push(secondCoin.symbol);
    }
    favorites.forEach((fav) => {
      if (!symbols.includes(fav)) {
        symbols.push(fav);
      }
    });
    return symbols;
  }, [selectedCoin.symbol, isDualMode, secondCoin, favorites]);
  
  // WebSocket 연결 (마운트 후에만)
  useCoinbaseWebSocket(isMounted ? wsSymbols : []);
  
  // 마운트 전 로딩
  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D1117] text-[#E6EDF3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58A6FF] mx-auto mb-4"></div>
          <p>차트 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-[#0D1117] text-[#E6EDF3]">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <MarketPanel />
        <ChartArea />
      </div>
    </div>
  );
}
