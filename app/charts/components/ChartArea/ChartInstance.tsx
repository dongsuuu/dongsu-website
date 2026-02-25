'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUnifiedChartStore } from '@/lib/store/unifiedChartStore';
import { useUnifiedChartData } from '@/hooks/useUnifiedChartData';
import { logEvent, normalizeSymbol } from '@/lib/utils/chartUtils';
import { calculateMA } from '@/lib/utils/indicatorEngine';

interface ChartInstanceProps {
  pane: 'left' | 'right';
}

export function ChartInstance({ pane }: ChartInstanceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRefs = useRef<any>({});
  
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
  
  // A. 초기 로드: 캔들 + 24h stats
  useEffect(() => {
    if (!isClient) return;
    logEvent('CHART_MOUNT', { pane, symbol, resolution });
    
    // 캔들 로드
    loadInitialHistory(pane, symbol, resolution, 1200);
    
    // 24h stats 로드
    fetch24hStats(symbol);
    
    // 30초마다 stats 갱신
    const interval = setInterval(() => fetch24hStats(symbol), 30000);
    return () => clearInterval(interval);
  }, [symbol, resolution, isClient, pane]);
  
  // 24h stats fetch
  const fetch24hStats = async (sym: string) => {
    try {
      const productId = normalizeSymbol(sym);
      const res = await fetch(`https://api.exchange.coinbase.com/products/${productId}/stats`, {
        headers: { 'User-Agent': 'dongsu-pro-chart/1.0' },
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const lastPrice = parseFloat(data.last);
      const open24h = parseFloat(data.open);
      const change24h = lastPrice - open24h;
      const change24hPct = (change24h / open24h) * 100;
      
      store.setMarketStats(sym, {
        lastPrice,
        change24h,
        change24hPct,
        high24h: parseFloat(data.high),
        low24h: parseFloat(data.low),
        volume24h: parseFloat(data.volume),
        lastUpdate: Date.now(),
      });
      
      logEvent('STATS_LOADED', { symbol: sym, lastPrice });
    } catch (err: any) {
      logEvent('STATS_ERROR', { symbol: sym, error: err.message });
    }
  };
  
  // B. 차트 생성
  useEffect(() => {
    if (!isClient || !containerRef.current || bars.length === 0) return;
    
    const init = async () => {
      const { createChart, CandlestickSeries, HistogramSeries, ColorType } = 
        await import('lightweight-charts');
      
      if (chartRef.current) chartRef.current.remove();
      
      const chart = createChart(containerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: '#0D1117' },
          textColor: '#8B949E',
          fontSize: 10,
        },
        grid: {
          vertLines: { color: 'rgba(48, 54, 61, 0.3)' },
          horzLines: { color: 'rgba(48, 54, 61, 0.3)' },
        },
        rightPriceScale: { borderColor: '#30363D', scaleMargins: { top: 0.05, bottom: 0.15 } },
        timeScale: {
          borderColor: '#30363D',
          timeVisible: ['1m', '5m', '15m', '30m', '1h', '4h'].includes(resolution),
          barSpacing: 5,
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
      chart.subscribeClick(() => store.setActivePane(pane));
      
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
      
      setOhlcInfo(bars[bars.length - 1]);
      
      return () => window.removeEventListener('resize', onResize);
    };
    
    init();
    
    return () => {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [bars.length, isClient, pane]);
  
  // C. 데이터 업데이트
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
  
  // D. MA 업데이트
  const updateMA = useCallback(async (data: any[]) => {
    if (!chartRef.current || data.length < 60) return;
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
      seriesRefs.current[key]?.setData(maData);
    });
  }, []);
  
  // 포맷
  const formatPrice = (p?: number) => {
    if (p === undefined || p === null) return '-';
    return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatPct = (p?: number) => {
    if (p === undefined || p === null) return '-';
    return `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`;
  };
  const formatVolume = (v?: number) => {
    if (v === undefined || v === null) return '-';
    if (v > 1000000) return `${(v / 1000000).toFixed(2)}M`;
    if (v > 1000) return `${(v / 1000).toFixed(2)}K`;
    return v.toFixed(0);
  };
  
  if (!isClient) return <div className="h-full flex items-center justify-center text-[#8B949E]">로딩...</div>;
  
  const isUp = (stats?.change24hPct || 0) >= 0;
  
  return (
    <div className="h-full flex flex-col">
      {/* 헤더 - 48px */}
      <div className="h-12 bg-[#161B22] border-b border-[#30363D] flex items-center px-3 gap-3 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-white">{symbol}</span>
          <span className="text-[10px] text-[#6E7681]">/USD</span>
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <span className={`text-base font-bold ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPrice(stats?.lastPrice)}
          </span>
          <span className={`text-[10px] ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPct(stats?.change24hPct)}
          </span>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 text-[10px]">
          <div><span className="text-[#6E7681]">고</span> <span className="text-[#E15241]">{formatPrice(stats?.high24h)}</span></div>
          <div><span className="text-[#6E7681]">저</span> <span className="text-[#2988D9]">{formatPrice(stats?.low24h)}</span></div>
          <div><span className="text-[#6E7681]">Vol</span> <span className="text-white">{formatVolume(stats?.volume24h)}</span></div>
        </div>
      </div>
      
      {/* OHLC 인포라인 - 24px */}
      {ohlcInfo && (
        <div className="h-6 bg-[#0D1117] border-b border-[#30363D] flex items-center px-3 gap-3 text-[10px] shrink-0">
          {[
            { l: 'O', v: ohlcInfo.open, c: 'text-white' },
            { l: 'H', v: ohlcInfo.high, c: 'text-[#E15241]' },
            { l: 'L', v: ohlcInfo.low, c: 'text-[#2988D9]' },
            { l: 'C', v: ohlcInfo.close, c: 'text-white' },
            { l: 'V', v: ohlcInfo.volume, c: 'text-white', isVol: true },
          ].map((item) => (
            <span key={item.l} className="flex items-center gap-0.5">
              <span className="text-[#6E7681]">{item.l}</span>
              <span className={item.c}>
                {item.isVol 
                  ? item.v.toFixed(2) 
                  : item.v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          ))}
        </div>
      )}
      
      {/* 지표 토글 - 24px */}
      <div className="h-6 bg-[#161B22] border-b border-[#30363D] flex items-center px-3 gap-1 shrink-0">
        {[
          { key: 'MA', active: showMA, toggle: () => setShowMA(!showMA) },
          { key: 'RSI', active: showRSI, toggle: () => setShowRSI(!showRSI) },
          { key: 'MACD', active: showMACD, toggle: () => setShowMACD(!showMACD) },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={btn.toggle}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              btn.active ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            {btn.key}
          </button>
        ))}
      </div>
      
      {/* 메인 차트 */}
      <div ref={containerRef} className="flex-1 min-h-0" />
      
      {/* 로딩/에러 오버레이 */}
      {isLoading && bars.length === 0 && (
        <div className="absolute inset-0 bg-[#0D1117]/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#58A6FF] mx-auto mb-1"></div>
            <p className="text-xs text-[#8B949E]">로딩 중...</p>
          </div>
        </div>
      )}
      
      {store[pane].error && (
        <div className="absolute inset-0 bg-[#0D1117]/90 flex items-center justify-center z-10">
          <div className="text-center px-4">
            <p className="text-red-400 text-xs mb-2">{store[pane].error}</p>
            <button
              onClick={() => loadInitialHistory(pane, symbol, resolution)}
              className="px-3 py-1 bg-[#58A6FF] text-white rounded text-xs"
            >
              재시도
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
