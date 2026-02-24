'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { useInfiniteCandles } from '@/hooks/useInfiniteCandles';
import { useChartSync } from '@/hooks/useChartSync';
import { getCoinbaseProductId } from '@/lib/constants/symbols';

interface TVChartProps {
  symbol: string;
  isMain: boolean;
}

export function TVChart({ symbol, isMain }: TVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRefs = useRef<{
    candle?: any;
    ma7?: any;
    ma25?: any;
    ma60?: any;
    volume?: any;
  }>({});
  
  const [isChartReady, setIsChartReady] = useState(false);
  
  const { 
    timeframe, 
    showMA, 
    showVolume,
  } = useChartStore();

  const granularity = timeframeToSeconds(timeframe);
  
  const {
    data,
    loading,
    hasMore,
    error,
    loadInitial,
    loadMore,
  } = useInfiniteCandles({ symbol, granularity });

  // 초기 데이터 로드
  useEffect(() => {
    loadInitial();
  }, [symbol, timeframe, loadInitial]);

  // 차트 초기화
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    
    const initChart = async () => {
      const { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType } = await import('lightweight-charts');
      
      // 이전 차트 정리
      if (chartRef.current) {
        chartRef.current.remove();
      }
      
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
          scaleMargins: {
            top: 0.1,
            bottom: showVolume ? 0.2 : 0.1,
          },
        },
        timeScale: {
          borderColor: '#30363D',
          timeVisible: ['1m', '5m', '15m', '30m', '1h', '4h'].includes(timeframe),
          secondsVisible: false,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#58A6FF',
            labelBackgroundColor: '#58A6FF',
          },
          horzLine: {
            color: '#58A6FF',
            labelBackgroundColor: '#58A6FF',
          },
        },
        handleScroll: { 
          vertTouchDrag: false,
          horzTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
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
      
      candleSeries.setData(data);
      seriesRefs.current.candle = candleSeries;
      
      // 이동평균선
      if (showMA) {
        updateMA(data);
      }
      
      // 거래량
      if (showVolume) {
        updateVolume(data);
      }
      
      // 무한 스크롤: 왼쪽 끝에 도달하면 과거 데이터 로드
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && range.from < 50 && hasMore && !loading) {
          loadMore();
        }
      });
      
      // 리사이즈 핸들러
      const handleResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      
      window.addEventListener('resize', handleResize);
      setIsChartReady(true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };
    
    initChart();
    
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRefs.current = {};
        setIsChartReady(false);
      }
    };
  }, [data.length > 0]); // 데이터가 있을 때만 초기화

  // 데이터 업데이트 (무한 스크롤로 추가 데이터 로드 시)
  useEffect(() => {
    if (!chartRef.current || !isChartReady) return;
    
    const { candle } = seriesRefs.current;
    if (candle) {
      candle.setData(data);
    }
    
    if (showMA) {
      updateMA(data);
    }
    
    if (showVolume) {
      updateVolume(data);
    }
  }, [data, isChartReady, showMA, showVolume]);

  // 동기화 적용
  useChartSync(chartRef, isMain);

  // MA 업데이트 함수
  const updateMA = useCallback((candles: any[]) => {
    if (!chartRef.current) return;
    const { createSeries } = chartRef.current;
    
    // 기존 MA 제거
    ['ma7', 'ma25', 'ma60'].forEach((key) => {
      if (seriesRefs.current[key as keyof typeof seriesRefs.current]) {
        chartRef.current.removeSeries(seriesRefs.current[key as keyof typeof seriesRefs.current]);
        seriesRefs.current[key as keyof typeof seriesRefs.current] = undefined;
      }
    });
    
    const ma7Data = calculateMA(candles, 7);
    const ma25Data = calculateMA(candles, 25);
    const ma60Data = calculateMA(candles, 60);
    
    const ma7 = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
      color: '#FFD700',
      lineWidth: 1,
      title: 'MA7',
    });
    ma7?.setData(ma7Data);
    seriesRefs.current.ma7 = ma7;
    
    const ma25 = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
      color: '#FF6B6B',
      lineWidth: 1,
      title: 'MA25',
    });
    ma25?.setData(ma25Data);
    seriesRefs.current.ma25 = ma25;
    
    const ma60 = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
      color: '#4ECDC4',
      lineWidth: 1,
      title: 'MA60',
    });
    ma60?.setData(ma60Data);
    seriesRefs.current.ma60 = ma60;
  }, []);

  // 거래량 업데이트 함수
  const updateVolume = useCallback((candles: any[]) => {
    if (!chartRef.current) return;
    
    if (seriesRefs.current.volume) {
      chartRef.current.removeSeries(seriesRefs.current.volume);
    }
    
    const volumeSeries = chartRef.current.addSeries((window as any).LightweightCharts?.HistogramSeries, {
      color: 'rgba(88, 166, 255, 0.3)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    
    const volumeData = candles.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
    }));
    
    volumeSeries.setData(volumeData);
    seriesRefs.current.volume = volumeSeries;
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-[#8B949E]">차트 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        <div className="text-center">
          <p>⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 rounded text-white text-sm"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}

// 시간간격을 초로 변환
function timeframeToSeconds(tf: string): number {
  const map: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
  };
  return map[tf] || 3600;
}

// 이동평균 계산
function calculateMA(data: any[], period: number) {
  const ma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    ma.push({
      time: data[i].time,
      value: sum / period,
    });
  }
  return ma;
}
