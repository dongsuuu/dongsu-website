'use client';

import { useEffect, useRef, useState } from 'react';
import { useChartStore } from '@/lib/store/chartStore';

interface TVChartProps {
  symbol: string;
  isMain: boolean;
}

export function TVChart({ symbol, isMain }: TVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const { timeframe } = useChartStore();
  
  useEffect(() => {
    // Phase 2에서 TradingView 차트 구현
    // 현재는 플레이스홀더
    setLoading(false);
  }, [symbol, timeframe]);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-[#8B949E]">차트 로딩 중...</div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="h-full relative">
      <div className="absolute inset-0 flex items-center justify-center text-[#8B949E]">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">{symbol}/USD</div>
          <div className="text-sm">TradingView 차트 (Phase 2 구현 예정)</div>
          <div className="text-xs text-[#6E7681] mt-2">시간간격: {timeframe}</div>
        </div>
      </div>
    </div>
  );
}
