'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, ColorType, Time } from 'lightweight-charts';

interface ChartData {
  time: number;
  value: number;
}

interface CoinData {
  success: boolean;
  coin: {
    symbol: string;
    name: string;
    color: string;
  };
  currentPrice: number;
  change24h: number;
  chartData: ChartData[];
  lastUpdated: string;
  error?: string;
}

interface CryptoChartProps {
  coinId?: string;
  days?: string;
  height?: number;
}

export default function CryptoChart({ 
  coinId = 'bitcoin', 
  days = '1',
  height = 300 
}: CryptoChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/chart?coin=${coinId}&days=${days}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [coinId, days]);

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

    const series = chart.addSeries(AreaSeries, {
      lineColor: data.coin.color || '#3b82f6',
      topColor: data.coin.color ? `${data.coin.color}40` : 'rgba(59, 130, 246, 0.4)',
      bottomColor: data.coin.color ? `${data.coin.color}05` : 'rgba(59, 130, 246, 0.05)',
      lineWidth: 2,
    });

    // 타입 변환
    const formattedData = data.chartData.map((item) => ({
      time: item.time as Time,
      value: item.value,
    }));

    series.setData(formattedData);
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
  }, [data, height]);

  if (loading) {
    return (
      <div 
        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        style={{ height: height + 100 }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-400">Failed to load chart data</p>
      </div>
    );
  }

  const isPositive = data.change24h >= 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${data.coin.color}20`, color: data.coin.color }}
          >
            {data.coin.symbol}
          </div>
          <div>
            <h3 className="font-bold text-lg">{data.coin.name}</h3>
            <p className="text-sm text-slate-400">{data.coin.symbol}/USD</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            ${data.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{data.change24h}%
          </div>
        </div>
      </div>

      <div ref={chartContainerRef} style={{ height }} />

      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <span>Powered by CoinGecko</span>
        <span>Updated: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
      </div>

      {data.error && (
        <div className="mt-3 text-xs text-yellow-500">
          ⚠️ {data.error}
        </div>
      )}
    </div>
  );
}
