'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUnifiedChartStore } from '@/lib/store/unifiedChartStore';
import { useUnifiedChartData } from '@/hooks/useUnifiedChartData';
import { logEvent, bucketTime } from '@/lib/utils/chartUtils';
import { calculateMA, computeRSI, computeMACD } from '@/lib/utils/indicatorEngine';

interface ChartInstanceProps {
  pane: 'left' | 'right';
}

export function ChartInstance({ pane }: ChartInstanceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const indicatorChartRef = useRef<any>(null);
  const seriesRefs = useRef<any>({});
  const indicatorSeriesRef = useRef<any>({});
  
  const [isClient, setIsClient] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showMA, setShowMA] = useState(true);
  const [ohlcInfo, setOhlcInfo] = useState<any>(null);
  
  const store = useUnifiedChartStore();
  const { loadInitialHistory, loadMoreHistory } = useUnifiedChartData();
  
  const { symbol, resolution, bars, isLoading, hasMore, isLoadingMore } = store[pane];
  const stats = store.marketStats[symbol];
  
  useEffect(() => { setIsClient(true); }, []);
  
  // 초기 로드
  useEffect(() => {
    if (!isClient) return;
    logEvent('CHART_MOUNT', { pane, symbol, resolution });
    loadInitialHistory(pane, symbol, resolution, 1200);
  }, [symbol, resolution, isClient, pane]);
  
  // 차트 생성
  useEffect(() => {
    if (!isClient || !containerRef.current || bars.length === 0) return;
    
    const init = async () => {
      const { createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType } = 
        await import('lightweight-charts');
      
      if (chartRef.current) chartRef.current.remove();
      
      const chart = createChart(containerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: '#0D1117' },
          textColor: '#8B949E',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(48, 54, 61, 0.3)' },
          horzLines: { color: 'rgba(48, 54, 61, 0.3)' },
        },
        rightPriceScale: { borderColor: '#30363D', scaleMargins: { top: 0.05, bottom: 0.15 } },
        timeScale: {
          borderColor: '#30363D',
          timeVisible: ['1m', '5m', '15m', '30m', '1h', '4h'].includes(resolution),
          barSpacing: 6,
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF', width: 1 },
          horzLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF', width: 1 },
        },
        handleScroll: { vertTouchDrag: false },
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
      });
      
      chartRef.current = chart;
      
      // 캔들
      const candle = chart.addSeries(CandlestickSeries, {
        upColor: '#E15241', downColor: '#2988D9',
        borderUpColor: '#E15241', borderDownColor: '#2988D9',
        wickUpColor: '#E15241', wickDownColor: '#2988D9',
      });
      candle.setData(bars as any);
      seriesRefs.current.candle = candle;
      
      // 거래량
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } });
      volume.setData(bars.map((b) => ({
        time: b.time as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })) as any);
      seriesRefs.current.volume = volume;
      
      // MA
      if (showMA) updateMA(bars);
      
      // Crosshair → OHLC
      chart.subscribeCrosshairMove((param: any) => {
        if (param.time && param.point) {
          const bar = bars.find((b) => b.time === param.time);
          if (bar) setOhlcInfo(bar);
        } else if (bars.length > 0) {
          setOhlcInfo(bars[bars.length - 1]);
        }
      });
      
      // 클릭 → 활성 패널
      chart.subscribeClick(() => {
        store.setActivePane(pane);
      });
      
      // 무한 스크롤
      chart.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
        if (range && range.from < 30 && hasMore && !isLoadingMore && bars.length > 0) {
          loadMoreHistory(pane, symbol, resolution, bars[0].time);
        }
      });
      
      // 리사이즈
      const onResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      window.addEventListener('resize', onResize);
      
      // 초기 OHLC
      setOhlcInfo(bars[bars.length - 1]);
      
      return () => window.removeEventListener('resize', onResize);
    };
    
    init();
    
    return () => {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [bars.length, isClient, pane]);
  
  // 데이터 업데이트
  useEffect(() => {
    if (!chartRef.current) return;
    const { candle, volume } = seriesRefs.current;
    if (candle) candle.setData(bars as any);
    if (volume) {
      volume.setData(bars.map((b) => ({
        time: b.time as any,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(225, 82, 65, 0.5)' : 'rgba(41, 136, 217, 0.5)',
      })) as any);
    }
    if (showMA) updateMA(bars);
  }, [bars, showMA]);
  
  // MA 업데이트
  const updateMA = useCallback(async (data: any[]) => {
    if (!chartRef.current) return;
    const { LineSeries } = await import('lightweight-charts');
    const closes = data.map((b) => b.close);
    const times = data.map((b) => b.time);
    
    [7, 25, 60].forEach((p, i) => {
      const ma = calculateMA(closes, p);
      const maData = ma.map((v, j) => ({ time: times[j + p - 1] as any, value: v }));
      const key = `ma${p}`;
      const color = ['#FFD700', '#FF6B6B', '#4ECDC4'][i];
      
      if (seriesRefs.current[key]) chartRef.current.removeSeries(seriesRefs.current[key]);
      seriesRefs.current[key] = chartRef.current.addSeries(LineSeries, { color, lineWidth: 1 });
      seriesRefs.current[key].setData(maData);
    });
  }, []);
  
  // 헤더 포맷
  const formatPrice = (p?: number) => p ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
  const formatPct = (p?: number) => p ? `${p >= 0 ? '+' : ''}${p.toFixed(2)}%` : '-';
  
  if (!isClient) return <div className="h-full flex items-center justify-center text-[#8B949E]">로딩...</div>;
  
  return (
    <div className="h-full flex flex-col">
      {/* 헤더 - 컴팩트 (56px) */}
      <div className="h-14 bg-[#161B22] border-b border-[#30363D] flex items-center px-3 gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold text-white">{symbol}</span>
          <span className="text-xs text-[#6E7681]">/USD</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-bold ${(stats?.change24hPct || 0) >= 0 ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPrice(stats?.lastPrice)}
          </span>
          <span className={`text-xs font-medium ${(stats?.change24hPct || 0) >= 0 ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPct(stats?.change24hPct)}
          </span>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-3 text-xs">
          <div><span className="text-[#6E7681]">고</span> <span className="text-[#E15241]">{formatPrice(stats?.high24h)}</span></div>
          <div><span className="text-[#6E7681]">저</span> <span className="text-[#2988D9]">{formatPrice(stats?.low24h)}</span></div>
          <div><span className="text-[#6E7681]">거래량</span> <span className="text-white">{stats?.volume24h > 1000000 ? `${(stats.volume24h/1000000).toFixed(2)}M` : stats?.volume24h?.toFixed(0) || '-'}</span></div>
        </div>
      </div>
      
      {/* OHLC 인포라인 */}
      {ohlcInfo && (
        <div className="h-7 bg-[#0D1117] border-b border-[#30363D] flex items-center px-3 gap-4 text-[11px] shrink-0">
          {['O', 'H', 'L', 'C', 'V'].map((label, i) => {
            const values = [ohlcInfo.open, ohlcInfo.high, ohlcInfo.low, ohlcInfo.close, ohlcInfo.volume];
            const colors = ['text-[#6E7681]', 'text-[#E15241]', 'text-[#2988D9]', 'text-white', 'text-white'];
            const formatted = i === 4 
              ? values[i].toFixed(4) 
              : values[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <span key={label} className="flex items-center gap-1">
                <span className="text-[#6E7681]">{label}</span>
                <span className={colors[i]}>{formatted}</span>
              </span>
            );
          })}
        </div>
      )}
      
      {/* 지표 토글 */}
      <div className="h-7 bg-[#161B22] border-b border-[#30363D] flex items-center px-3 gap-1.5 shrink-0">
        {[
          { key: 'MA', active: showMA, toggle: () => setShowMA(!showMA) },
          { key: 'RSI', active: showRSI, toggle: () => setShowRSI(!showRSI) },
          { key: 'MACD', active: showMACD, toggle: () => setShowMACD(!showMACD) },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={btn.toggle}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              btn.active ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
            }`}
          >
            {btn.key}
          </button>
        ))}
      </div>
      
      {/* 메인 차트 */}
      <div ref={containerRef} className="flex-1 min-h-0" />
      
      {/* 지표 차트 (RSI/MACD) */}
      {(showRSI || showMACD) && (
        <div ref={indicatorContainerRef} className="h-32 border-t border-[#30363D] shrink-0" />
      )}
      
      {/* 로딩/에러 */}
      {isLoading && bars.length === 0 && (
        <div className="absolute inset-0 bg-[#0D1117]/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58A6FF] mx-auto mb-2"></div>
            <p className="text-sm text-[#8B949E]">로딩 중...</p>
          </div>
        </div>
      )}
      
      {store[pane].error && (
        <div className="absolute inset-0 bg-[#0D1117]/90 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-red-400 mb-2">{store[pane].error}</p>
            <button
              onClick={() => loadInitialHistory(pane, symbol, resolution)}
              className="px-4 py-2 bg-[#58A6FF] text-white rounded text-sm"
            >
              재시도
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
