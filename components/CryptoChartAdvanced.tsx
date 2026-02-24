'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, AreaSeries, ColorType, Time } from 'lightweight-charts';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CryptoChartAdvancedProps {
  symbol: string;
  height?: number;
  defaultInterval?: string;
}

const INTERVALS = [
  { value: '1m', label: '1분' },
  { value: '5m', label: '5분' },
  { value: '15m', label: '15분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' },
];

export default function CryptoChartAdvanced({ 
  symbol, 
  height = 400,
  defaultInterval = '1h'
}: CryptoChartAdvancedProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState(defaultInterval);
  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/crypto/chart?symbol=${symbol}&interval=${interval}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch chart:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  // 초기 로드 및 폧링
  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(fetchData, 10000); // 10초 폧링
    return () => clearInterval(pollInterval);
  }, [fetchData]);

  // 차트 렌더링
  useEffect(() => {
    if (!chartContainerRef.current || !data?.chartData?.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#3b82f6',
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: '#3b82f6',
          labelBackgroundColor: '#3b82f6',
        },
      },
      handleScroll: {
        vertTouchDrag: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    let series;
    
    if (chartType === 'candle') {
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      
      const candleData = data.chartData.map((item: ChartData) => ({
        time: item.time as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      
      series.setData(candleData);
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: '#3b82f6',
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.05)',
        lineWidth: 2,
      });
      
      const areaData = data.chartData.map((item: ChartData) => ({
        time: item.time as Time,
        value: item.close,
      }));
      
      series.setData(areaData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height, chartType]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6" style={{ height: height + 80 }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="h-8 bg-slate-700 rounded w-full"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-400">Failed to load chart</p>
      </div>
    );
  }

  const isPositive = data.change24h >= 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-xl font-bold">{symbol.replace('USDT', '')}/USDT</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-bold">
                ${data.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* 컨트롤 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 차트 타입 */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('candle')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${chartType === 'candle' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              캔들
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${chartType === 'area' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              라인
            </button>
          </div>
          
          {/* 시간 간격 */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            {INTERVALS.map((int) => (
              <button
                key={int.value}
                onClick={() => setInterval(int.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${interval === int.value ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 24시간 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-slate-400 mb-1">고가 (24h)</div>
          <div className="font-semibold text-green-400">${data.high24h.toLocaleString()}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-slate-400 mb-1">저가 (24h)</div>
          <div className="font-semibold text-red-400">${data.low24h.toLocaleString()}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-slate-400 mb-1">거래량 (24h)</div>
          <div className="font-semibold">${(data.volume24h / 1000000).toFixed(2)}M</div>
        </div>
      </div>

      {/* 차트 */}
      <div ref={chartContainerRef} style={{ height }} />

      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <span>Powered by Binance</span>
        <span>Updated: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
