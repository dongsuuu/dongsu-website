'use client';

import { useEffect } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { useCoinbaseWebSocket } from '@/hooks/useCoinbaseWebSocket';
import { COINS } from '@/lib/constants/symbols';
import { MarketPanel } from './MarketPanel';
import { ChartArea } from './ChartArea';
import { TopBar } from './TopBar';

export function ChartsLayout() {
  const { selectedCoin, isDualMode, secondCoin, favorites } = useChartStore();
  
  // WebSocket 연결할 심볼 목록
  const wsSymbols = [selectedCoin.symbol];
  if (isDualMode && secondCoin) {
    wsSymbols.push(secondCoin.symbol);
  }
  // 즐겨찾기도 구독
  favorites.forEach((fav) => {
    if (!wsSymbols.includes(fav)) {
      wsSymbols.push(fav);
    }
  });
  
  // WebSocket 연결
  useCoinbaseWebSocket(wsSymbols);
  
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
