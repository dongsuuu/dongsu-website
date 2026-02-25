'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { CandleData } from '@/hooks/useChartData';
import { calculateMA } from '@/lib/utils/indicatorEngine';

interface TradingChartProps {
  data: CandleData[];
  symbol: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: (oldestTime: number) => void;
  onCrosshairMove?: (data: CandleData | null) => void;
  showMA?: boolean;
}

export const TradingChart = memo(function TradingChart({
  data,
  symbol,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onCrosshairMove,
  showMA = true,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maRefs = useRef<ISeriesApi<'Line'>[]>([]);
  
  const [isReady, setIsReady] = useState(false);

  // 차트 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0D1117' },
        textColor: '#8B949E',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(48, 54, 61, 0.3)' },
        horzLines: { color: 'rgba(48, 54, 61, 0.3)' },
      },
      rightPriceScale: {
        borderColor: '#30363D',
        scaleMargins: { top: 0.05, bottom: 0.15 },
      },
      timeScale: {
        borderColor: '#30363D',
        timeVisible: true,
        barSpacing: 5,
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF', width: 1 },
        horzLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF', width: 1 },
      },
      handleScroll: { vertTouchDrag: false },
    });
    
    // 캔들 시리즈
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#E15241', downColor: '#2988D9',
      borderUpColor: '#E15241', borderDownColor: '#2988D9',
      wickUpColor: '#E15241', wickDownColor: '#2988D9',
    });
    candleRef.current = candle;
    
    // 거래량 시리즈
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } });
    volumeRef.current = volume;
    
    // MA 시리즈
    const ma7 = chart.addSeries(LineSeries, { color: '#FFD700', lineWidth: 1 });
    const ma25 = chart.addSeries(LineSeries, { color: '#FF6B6B', lineWidth: 1 });
    const ma60 = chart.addSeries(LineSeries, { color: '#4ECDC4', lineWidth: 1 });
    maRefs.current = [ma7, ma25, ma60];
    
    // 이벤트 핸들러
    chart.subscribeCrosshairMove((param: any) => {
      if (param.time && onCrosshairMove) {
        const item = data.find((d) => d.time === param.time);
        onCrosshairMove(item || null);
      }
    });
    
    // 무한 스크롤
    chart.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
      if (range?.from < 50 && hasMore && !isLoadingMore && data.length > 0 && onLoadMore) {
        onLoadMore(data[0].time);
      }
    });
    
    chartRef.current = chart;
    setIsReady(true);
    
    // 리사이즈
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      maRefs.current = [];
    };
  }, [hasMore, isLoadingMore, onLoadMore, onCrosshairMove]);

  // 데이터 업데이트
  useEffect(() => {
    if (!isReady || !candleRef.current || !volumeRef.current) return;
    
    candleRef.current.setData(data as any);
    volumeRef.current.setData(
      data.map((d) => ({
        time: d.time as any,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })) as any
    );
    
    // MA 업데이트
    if (showMA && data.length >= 60) {
      const closes = data.map((d) => d.close);
      const times = data.map((d) => d.time);
      
      [7, 25, 60].forEach((period, i) => {
        const ma = calculateMA(closes, period);
        const maData = ma.map((v, j) => ({
          time: times[j + period - 1] as any,
          value: v,
        }));
        maRefs.current[i]?.setData(maData);
      });
    }
  }, [data, isReady, showMA]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {isLoading && data.length === 0 && (
        <div className="absolute inset-0 bg-[#0D1117]/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58A6FF]"></div>
        </div>
      )}
      
      {isLoadingMore && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#161B22] px-3 py-1 rounded text-xs text-[#8B949E]">
          과거 데이터 로딩...
        </div>
      )}
    </div>
  );
});
