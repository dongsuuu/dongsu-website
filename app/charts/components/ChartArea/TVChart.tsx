'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { useChartData } from '@/hooks/useChartData';
import { useChartWebSocket } from '@/hooks/useChartWebSocket';
import { resolutionToSeconds, logEvent, Bar } from '@/lib/utils/chartCore';

interface TVChartProps {
  chartId: string; // 'left' | 'right'
  symbol: string;
  resolution: string;
}

export function TVChart({ chartId, symbol, resolution }: TVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRefs = useRef<{
    candle?: any;
    volume?: any;
    ma7?: any;
    ma25?: any;
    ma60?: any;
  }>({});
  
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const {
    getBars,
    setActivePane,
    hasMoreHistory,
  } = useChartCoreStore();
  
  const { loadHistory, loadMoreHistory } = useChartData();
  const { subscribeBars, unsubscribeBars } = useChartWebSocket();
  
  const key = `${symbol}:${resolution}`;
  const bars = getBars(symbol, resolution);
  
  // 클라이언트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // A. 초기 로드: 심볼/해상도 변경 시
  useEffect(() => {
    if (!isClient) return;
    
    logEvent('CHART_INIT', { chartId, symbol, resolution });
    
    // 1. 기존 구독 해제
    unsubscribeBars(symbol, resolution);
    
    // 2. 데이터 로드
    loadHistory(symbol, resolution).then(() => {
      // 3. 새 구독
      subscribeBars(symbol, resolution);
    });
    
    return () => {
      unsubscribeBars(symbol, resolution);
    };
  }, [symbol, resolution, isClient]);
  
  // B. 차트 인스턴스 생성/업데이트
  useEffect(() => {
    if (!isClient || !containerRef.current || bars.length === 0) return;
    
    const initChart = async () => {
      const { createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType } = 
        await import('lightweight-charts');
      
      // 기존 차트 정리
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRefs.current = {};
      }
      
      // 차트 생성
      const chart = createChart(containerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: '#0D1117' },
          textColor: '#8B949E',
        },
        grid: {
          vertLines: { color: 'rgba(48, 54, 61, 0.5)' },
          horzLines: { color: 'rgba(48, 54, 61, 0.5)' },
        },
        rightPriceScale: {
          borderColor: '#30363D',
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderColor: '#30363D',
          timeVisible: ['1m', '5m', '15m', '30m', '1h', '4h'].includes(resolution),
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF' },
          horzLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF' },
        },
        handleScroll: { vertTouchDrag: false },
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
      });
      
      chartRef.current = chart;
      
      // 캔들 시리즈
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#E15241',
        downColor: '#2988D9',
        borderUpColor: '#E15241',
        borderDownColor: '#2988D9',
        wickUpColor: '#E15241',
        wickDownColor: '#2988D9',
      });
      candleSeries.setData(bars as any);
      seriesRefs.current.candle = candleSeries;
      
      // 거래량
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volumeSeries.setData(bars.map((b: Bar) => ({
        time: b.time as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })) as any);
      seriesRefs.current.volume = volumeSeries;
      
      // 이동평균선
      updateMA(bars);
      
      // D. 스크롤/줌 이벤트 - 과거 데이터 로드
      chart.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
        if (range && range.from < 50 && hasMoreHistory(symbol, resolution)) {
          const oldestBar = bars[0];
          if (oldestBar) {
            loadMoreHistory(symbol, resolution, oldestBar.time);
          }
        }
      });
      
      // 활성 패널 설정 (클릭 시)
      chart.subscribeClick(() => {
        setActivePane(chartId as 'left' | 'right');
      });
      
      // 리사이즈
      const handleResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      
      setIsReady(true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };
    
    initChart();
    
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [bars.length > 0, isClient]);
  
  // C. 데이터 업데이트 (실시간)
  useEffect(() => {
    if (!chartRef.current || !isReady) return;
    
    const { candle, volume } = seriesRefs.current;
    if (candle) {
      candle.setData(bars);
    }
    if (volume) {
      volume.setData(bars.map((b: Bar) => ({
        time: b.time,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })));
    }
    
    updateMA(bars);
  }, [bars, isReady]);
  
  // MA 업데이트 함수
  const updateMA = useCallback((data: Bar[]) => {
    if (!chartRef.current) return;
    
    const calculateMA = (period: number) => {
      const ma = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close;
        }
        ma.push({ time: data[i].time, value: sum / period });
      }
      return ma;
    };
    
    // MA7
    if (seriesRefs.current.ma7) {
      chartRef.current.removeSeries(seriesRefs.current.ma7);
    }
    const ma7 = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
      color: '#FFD700',
      lineWidth: 1,
      title: 'MA7',
    });
    ma7?.setData(calculateMA(7));
    seriesRefs.current.ma7 = ma7;
    
    // MA25
    if (seriesRefs.current.ma25) {
      chartRef.current.removeSeries(seriesRefs.current.ma25);
    }
    const ma25 = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
      color: '#FF6B6B',
      lineWidth: 1,
      title: 'MA25',
    });
    ma25?.setData(calculateMA(25));
    seriesRefs.current.ma25 = ma25;
    
    // MA60
    if (seriesRefs.current.ma60) {
      chartRef.current.removeSeries(seriesRefs.current.ma60);
    }
    const ma60 = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
      color: '#4ECDC4',
      lineWidth: 1,
      title: 'MA60',
    });
    ma60?.setData(calculateMA(60));
    seriesRefs.current.ma60 = ma60;
  }, []);
  
  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center text-[#8B949E]">
        로딩 중...
      </div>
    );
  }
  
  return <div ref={containerRef} className="h-full w-full" />;
}
