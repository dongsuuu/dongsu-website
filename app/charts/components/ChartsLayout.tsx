'use client';

import { useEffect, useState } from 'react';
import { useUnifiedChartStore } from '@/lib/store/unifiedChartStore';
import { ChartInstance } from './ChartArea/ChartInstance';
import { UnifiedMarketPanel } from './UnifiedMarketPanel';

export function ChartsLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const { mode } = useUnifiedChartStore();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D1117] text-[#E6EDF3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#58A6FF] mx-auto mb-3"></div>
          <p className="text-sm">차트 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-[#0D1117] text-[#E6EDF3] overflow-hidden">
      {/* 메인 레이아웃 - 차트 영역 50%로 제한 */}
      <div className="flex flex-col h-[50vh]">
        {/* 상단: 종목 리스트 + 차트 */}
        <div className="flex flex-1 min-h-0">
          {/* 좌측: 종목 리스트 */}
          <UnifiedMarketPanel />
          
          {/* 우측: 차트 영역 */}
          <div className="flex-1 flex flex-col min-w-0">
            {mode === 'single' ? (
              <ChartInstance pane="left" />
            ) : (
              <>
                <div className="h-1/2 border-b border-[#30363D]">
                  <ChartInstance pane="left" />
                </div>
                <div className="h-1/2">
                  <ChartInstance pane="right" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 하단: 여백 또는 추가 정보 */}
      <div className="flex-1 bg-[#0D1117]">
        {/* 추가 콘텐츠 공간 */}
      </div>
    </div>
  );
}
