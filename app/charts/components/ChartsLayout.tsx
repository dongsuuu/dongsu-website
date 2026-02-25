'use client';

import { useEffect, useState } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { useCoinbaseWebSocket } from '@/hooks/useCoinbaseWebSocket';
import { MarketPanel } from './MarketPanel';
import { ChartArea } from './ChartArea';
import { TopBar } from './TopBar';

export function ChartsLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const { selectedCoin, isDualMode, secondCoin, favorites } = useChartStore();
  
  // 마운트 확인 (SSR hydration 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // WebSocket 연결할 심볼 목록
  const wsSymbols = [selectedCoin.symbol];
  if (isDualMode && secondCoin) {
    wsSymbols.push(secondCoin.symbol);
  }
  favorites.forEach((fav) => {
    if (!wsSymbols.includes(fav)) {
      wsSymbols.push(fav);
    }
  });
  
  // WebSocket 연결 (마운트 후에만)
  useCoinbaseWebSocket(isMounted ? wsSymbols : []);
  
  // 마운트 전에는 로딩 표시
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
      {/* 상단 바 */}
      <TopBar />
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 종목 리스트 */}
        <MarketPanel />
        
        {/* 우측: 차트 영역 */}
        <ChartArea />
      </div>
    </div>
  );
}
