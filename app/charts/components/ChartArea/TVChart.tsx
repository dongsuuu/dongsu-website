'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { useChartData } from '@/hooks/useChartData';
import { useChartWebSocket } from '@/hooks/useChartWebSocket';
import { resolutionToSeconds, logEvent, Bar } from '@/lib/utils/chartCore';
import { computeRSI, computeMACD, calculateMA } from '@/lib/utils/indicatorEngine';
import { MarketHeader } from '../MarketHeader';

interface TVChartProps {
  chartId: string;
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
  
  // 지표 차트 refs
  const indicatorContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const macdSeriesRef = useRef<{ macd?: any; signal?: any; histogram?: any }>({});
  
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showMA, setShowMA] = useState(true);
  const [ohlcInfo, setOhlcInfo] = useState<{ o: number; h: number; l: number; c: number; v: number; time: number } | null>(null);
  
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
  
  // A. 초기 로드
  useEffect(() => {
    if (!isClient) return;
    
    logEvent('CHART_INIT', { chartId, symbol, resolution });
    
    unsubscribeBars(symbol, resolution);
    loadHistory(symbol, resolution).then(() => {
      subscribeBars(symbol, resolution);
    });
    
    return () => {
      unsubscribeBars(symbol, resolution);
    };
  }, [symbol, resolution, isClient]);
  
  // B. 차트 인스턴스 생성
  useEffect(() => {
    if (!isClient || !containerRef.current || bars.length === 0) return;
    
    const initChart = async () => {
      const { createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType } = 
        await import('lightweight-charts');
      
      // 기존 차트 정리
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      
      // 메인 차트
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
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      volumeSeries.setData(bars.map((b: Bar) => ({
        time: b.time as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })) as any);
      seriesRefs.current.volume = volumeSeries;
      
      // MA
      if (showMA) updateMA(bars);
      
      // Crosshair 이벤트 - OHLC 인포라인
      chart.subscribeCrosshairMove((param: any) => {
        if (param.time) {
          const bar = bars.find((b: Bar) => b.time === param.time);
          if (bar) {
            setOhlcInfo({
              o: bar.open,
              h: bar.high,
              l: bar.low,
              c: bar.close,
              v: bar.volume,
              time: bar.time,
            });
          }
        } else if (bars.length > 0) {
          // crosshair 벗어나면 마지막 캔들
          const last = bars[bars.length - 1];
          setOhlcInfo({
            o: last.open,
            h: last.high,
            l: last.low,
            c: last.close,
            v: last.volume,
            time: last.time,
          });
        }
      });
      
      // 무한 스크롤 - 과거 데이터 로드
      chart.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
        if (range && range.from < 50 && hasMoreHistory(symbol, resolution)) {
          const oldestBar = bars[0];
          if (oldestBar) {
            loadMoreHistory(symbol, resolution, oldestBar.time);
          }
        }
      });
      
      // 클릭 시 활성 패널 설정
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
      
      // 초기 OHLC 설정
      if (bars.length > 0) {
        const last = bars[bars.length - 1];
        setOhlcInfo({
          o: last.open,
          h: last.high,
          l: last.low,
          c: last.close,
          v: last.volume,
          time: last.time,
        });
      }
      
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
  
  // C. 데이터 업데이트
  useEffect(() => {
    if (!chartRef.current || !isReady) return;
    
    const { candle, volume } = seriesRefs.current;
    if (candle) candle.setData(bars as any);
    if (volume) {
      volume.setData(bars.map((b: Bar) => ({
        time: b.time as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })) as any);
    }
    
    if (showMA) updateMA(bars);
    if (showRSI) updateRSI(bars);
    if (showMACD) updateMACD(bars);
  }, [bars, isReady, showMA, showRSI, showMACD]);
  
  // MA 업데이트
  const updateMA = useCallback((data: Bar[]) => {
    if (!chartRef.current) return;
    
    const closes = data.map((b) => b.close);
    const times = data.map((b) => b.time);
    
    [7, 25, 60].forEach((period, idx) => {
      const ma = calculateMA(closes, period);
      const maData = ma.map((v, i) => ({
        time: times[i + period - 1] as any,
        value: v,
      }));
      
      const key = period === 7 ? 'ma7' : period === 25 ? 'ma25' : 'ma60';
      const color = period === 7 ? '#FFD700' : period === 25 ? '#FF6B6B' : '#4ECDC4';
      
      if (seriesRefs.current[key]) {
        chartRef.current.removeSeries(seriesRefs.current[key]);
      }
      
      seriesRefs.current[key] = chartRef.current.addSeries((window as any).LightweightCharts?.LineSeries, {
        color,
        lineWidth: 1,
        title: `MA${period}`,
      });
      seriesRefs.current[key]?.setData(maData);
    });
  }, []);
  
  // RSI 업데이트
  const updateRSI = useCallback((data: Bar[]) => {
    // RSI 차트 구현 (별도 pane)
    // TODO: RSI 차트 인스턴스 생성 및 데이터 설정
  }, []);
  
  // MACD 업데이트
  const updateMACD = useCallback((data: Bar[]) => {
    // MACD 차트 구현 (별도 pane)
    // TODO: MACD 차트 인스턴스 생성 및 데이터 설정
  }, []);
  
  // 지표 토글
  const toggleMA = () => setShowMA((v) => !v);
  const toggleRSI = () => setShowRSI((v) => !v);
  const toggleMACD = () => setShowMACD((v) => !v);
  
  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center text-[#8B949E]">
        로딩 중...
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Market Header */}
      <MarketHeader symbol={symbol} />
      
      {/* OHLC 인포라인 */}
      {ohlcInfo && (
        <div className="h-8 bg-[#0D1117] border-b border-[#30363D] flex items-center px-4 gap-6 text-xs">
          <span className="text-[#6E7681]">O</span>
          <span className="text-white">{ohlcInfo.o.toFixed(2)}</span>
          <span className="text-[#6E7681]">H</span>
          <span className="text-[#E15241]">{ohlcInfo.h.toFixed(2)}</span>
          <span className="text-[#6E7681]">L</span>
          <span className="text-[#2988D9]">{ohlcInfo.l.toFixed(2)}</span>
          <span className="text-[#6E7681]">C</span>
          <span className="text-white">{ohlcInfo.c.toFixed(2)}</span>
          <span className="text-[#6E7681]">V</span>
          <span className="text-white">{ohlcInfo.v.toFixed(4)}</span>
        </div>
      )}
      
      {/* 지표 토글 버튼 */}
      <div className="h-8 bg-[#161B22] border-b border-[#30363D] flex items-center px-4 gap-2">
        <button
          onClick={toggleMA}
          className={`px-2 py-0.5 rounded text-xs ${showMA ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'}`}
        >
          MA
        </button>
        <button
          onClick={toggleRSI}
          className={`px-2 py-0.5 rounded text-xs ${showRSI ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'}`}
        >
          RSI
        </button>
        <button
          onClick={toggleMACD}
          className={`px-2 py-0.5 rounded text-xs ${showMACD ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'}`}
        >
          MACD
        </button>
      </div>
      
      {/* 메인 차트 */}
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}
