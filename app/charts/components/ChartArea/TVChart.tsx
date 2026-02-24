'use client';

import { useEffect, useRef, useState } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { getCoinbaseProductId } from '@/lib/constants/symbols';

interface TVChartProps {
  symbol: string;
  isMain: boolean;
}

export function TVChart({ symbol, isMain }: TVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const ma7Ref = useRef<any>(null);
  const ma25Ref = useRef<any>(null);
  const ma60Ref = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    timeframe, 
    showMA, 
    showVolume,
    setCrosshairTime,
    setVisibleRange,
    visibleRange,
    crosshairTime,
  } = useChartStore();

  // 초기 캔들 데이터 로드
  useEffect(() => {
    let isMounted = true;
    
    async function loadCandles() {
      try {
        setLoading(true);
        setError(null);
        
        const granularity = timeframeToSeconds(timeframe);
        const productId = getCoinbaseProductId(symbol);
        
        // 캔들 API 호출
        const res = await fetch(
          `https://api.exchange.coinbase.com/products/${productId}/candles?granularity=${granularity}&limit=300`
        );
        
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        
        const candles = await res.json();
        if (!isMounted) return;
        
        // 데이터 변환
        const chartData = candles.reverse().map((c: number[]) => ({
          time: c[0],
          low: c[1],
          high: c[2],
          open: c[3],
          close: c[4],
          volume: c[5],
        }));
        
        initChart(chartData);
      } catch (err: any) {
        console.error('Failed to load candles:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadCandles();
    
    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  // 차트 초기화
  const initChart = async (data: any[]) => {
    if (!containerRef.current) return;
    
    // 이전 차트 정리
    if (chartRef.current) {
      chartRef.current.remove();
    }
    
    const { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType } = await import('lightweight-charts');
    
    // 차트 생성
    const chart = createChart(containerRef.current, {
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
        timeVisible: true,
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
      handleScroll: { vertTouchDrag: false },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
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
    candleSeriesRef.current = candleSeries;
    
    // 이동평균선
    if (showMA) {
      const ma7Data = calculateMA(data, 7);
      const ma25Data = calculateMA(data, 25);
      const ma60Data = calculateMA(data, 60);
      
      const ma7 = chart.addSeries(LineSeries, {
        color: '#FFD700',
        lineWidth: 1,
        title: 'MA7',
      });
      ma7.setData(ma7Data);
      ma7Ref.current = ma7;
      
      const ma25 = chart.addSeries(LineSeries, {
        color: '#FF6B6B',
        lineWidth: 1,
        title: 'MA25',
      });
      ma25.setData(ma25Data);
      ma25Ref.current = ma25;
      
      const ma60 = chart.addSeries(LineSeries, {
        color: '#4ECDC4',
        lineWidth: 1,
        title: 'MA60',
      });
      ma60.setData(ma60Data);
      ma60Ref.current = ma60;
    }
    
    // 거래량
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: 'rgba(88, 166, 255, 0.3)',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      
      const volumeData = data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      }));
      
      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }
    
    // 크로스헤어 이벤트
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        setCrosshairTime(param.time as number);
      }
    });
    
    // 가시 범위 이벤트
    chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (range) {
        setVisibleRange({
          from: range.from as number,
          to: range.to as number,
        });
      }
    });
    
    // 동기화: 다른 차트에서 가시 범위 변경 시
    if (visibleRange && !isMain) {
      chart.timeScale().setVisibleRange({
        from: visibleRange.from as unknown as import('lightweight-charts').Time,
        to: visibleRange.to as unknown as import('lightweight-charts').Time,
      });
    }
    
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  if (loading) {
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
