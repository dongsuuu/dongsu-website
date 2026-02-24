'use client';

import { useEffect, useRef } from 'react';
import { useChartStore } from '@/lib/store/chartStore';

export function useChartSync(chartRef: any, isMain: boolean) {
  const { crosshairTime, visibleRange, setCrosshairTime, setVisibleRange } = useChartStore();
  const isSyncingRef = useRef(false);

  // 메인 차트에서 동기화 이벤트 발생
  useEffect(() => {
    if (!chartRef.current || !isMain) return;
    
    const chart = chartRef.current;
    
    const handleCrosshairMove = (param: any) => {
      if (param.time && !isSyncingRef.current) {
        setCrosshairTime(param.time as number);
      }
    };
    
    const handleVisibleRangeChange = (range: any) => {
      if (range && !isSyncingRef.current) {
        setVisibleRange({
          from: range.from as number,
          to: range.to as number,
        });
      }
    };
    
    chart.subscribeCrosshairMove(handleCrosshairMove);
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    
    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    };
  }, [chartRef, isMain, setCrosshairTime, setVisibleRange]);

  // 서브 차트에서 동기화 이벤트 수신
  useEffect(() => {
    if (!chartRef.current || isMain) return;
    
    const chart = chartRef.current;
    
    // 크로스헤어 동기화
    if (crosshairTime) {
      isSyncingRef.current = true;
      try {
        chart.setCrosshairPosition(crosshairTime as unknown as any);
      } catch (e) {
        // 무시
      }
      setTimeout(() => { isSyncingRef.current = false; }, 0);
    }
  }, [chartRef, isMain, crosshairTime]);

  // 가시 범위 동기화
  useEffect(() => {
    if (!chartRef.current || isMain || !visibleRange) return;
    
    const chart = chartRef.current;
    
    isSyncingRef.current = true;
    try {
      chart.timeScale().setVisibleRange({
        from: visibleRange.from as unknown as any,
        to: visibleRange.to as unknown as any,
      });
    } catch (e) {
      // 무시
    }
    setTimeout(() => { isSyncingRef.current = false; }, 0);
  }, [chartRef, isMain, visibleRange]);
}
