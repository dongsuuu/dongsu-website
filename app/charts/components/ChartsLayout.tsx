'use client';

import { useEffect, useState } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { TVChart } from './ChartArea/TVChart';
import { TopBar } from './TopBar';
import { MarketPanel } from './MarketPanel';

export function ChartsLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const { 
    mode, 
    leftSymbol, 
    leftResolution, 
    rightSymbol, 
    rightResolution 
  } = useChartCoreStore();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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
        {/* 좌측: 종목 리스트 */}
        <MarketPanel />
        
        {/* 우측: 차트 영역 */}
        <div className="flex-1 flex flex-col">
          {mode === 'single' ? (
            // Single 모드
            <TVChart 
              chartId="left"
              symbol={leftSymbol}
              resolution={leftResolution}
            />
          ) : (
            // Dual 모드
            <>
              <div className="h-1/2 border-b border-[#30363D]">
                <TVChart 
                  chartId="left"
                  symbol={leftSymbol}
                  resolution={leftResolution}
                />
              </div>
              <div className="h-1/2">
                <TVChart 
                  chartId="right"
                  symbol={rightSymbol}
                  resolution={rightResolution}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
