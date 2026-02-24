'use client';

import { useEffect, useRef, useState } from 'react';
import { calculateRSI, calculateMACD } from '@/lib/utils/indicators';

interface IndicatorPanelProps {
  data: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
  type: 'rsi' | 'macd';
  height?: number;
}

export function IndicatorPanel({ data, type, height = 150 }: IndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const initChart = async () => {
      const { createChart, LineSeries, HistogramSeries, ColorType } = await import('lightweight-charts');

      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(containerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: '#0D1117' },
          textColor: '#8B949E',
        },
        grid: {
          vertLines: { color: 'rgba(48, 54, 61, 0.3)' },
          horzLines: { color: 'rgba(48, 54, 61, 0.3)' },
        },
        rightPriceScale: {
          borderColor: '#30363D',
        },
        timeScale: {
          borderColor: '#30363D',
          visible: false,
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF' },
          horzLine: { color: '#58A6FF', labelBackgroundColor: '#58A6FF' },
        },
        handleScroll: false,
        handleScale: false,
        width: containerRef.current!.clientWidth,
        height: height,
      });

      chartRef.current = chart;

      if (type === 'rsi') {
        // RSI 계산 및 표시
        const rsiData = calculateRSI(data, 14);
        const formattedRsi = rsiData.map((d, i) => ({
          time: data[d.time]?.time as unknown as import('lightweight-charts').Time,
          value: d.value,
        })).filter(d => d.time);

        const rsiSeries = chart.addSeries(LineSeries, {
          color: '#FFD700',
          lineWidth: 2,
          title: 'RSI(14)',
        });
        rsiSeries.setData(formattedRsi);

        // 과매수/과매도 라인
        const overbought = chart.addSeries(LineSeries, {
          color: '#E15241',
          lineWidth: 1,
          lineStyle: 2,
          title: '70',
        });
        overbought.setData(formattedRsi.map(d => ({ time: d.time, value: 70 })));

        const oversold = chart.addSeries(LineSeries, {
          color: '#2988D9',
          lineWidth: 1,
          lineStyle: 2,
          title: '30',
        });
        oversold.setData(formattedRsi.map(d => ({ time: d.time, value: 30 })));

        // 중립선
        const neutral = chart.addSeries(LineSeries, {
          color: '#6E7681',
          lineWidth: 1,
          lineStyle: 2,
          title: '50',
        });
        neutral.setData(formattedRsi.map(d => ({ time: d.time, value: 50 })));

        const priceScale = chart.priceScale('right');
        priceScale.applyOptions({
          autoScale: false,
        });

      } else if (type === 'macd') {
        // MACD 계산 및 표시
        const macdData = calculateMACD(data, 12, 26, 9);
        const formattedMacd = macdData.map((d) => ({
          time: data[d.time]?.time as unknown as import('lightweight-charts').Time,
          macd: d.macd,
          signal: d.signal,
          histogram: d.histogram,
        })).filter(d => d.time);

        // MACD Line
        const macdSeries = chart.addSeries(LineSeries, {
          color: '#FFD700',
          lineWidth: 2,
          title: 'MACD',
        });
        macdSeries.setData(formattedMacd.map(d => ({ time: d.time, value: d.macd })));

        // Signal Line
        const signalSeries = chart.addSeries(LineSeries, {
          color: '#FF6B6B',
          lineWidth: 2,
          title: 'Signal',
        });
        signalSeries.setData(formattedMacd.map(d => ({ time: d.time, value: d.signal })));

        // Histogram
        const histSeries = chart.addSeries(HistogramSeries, {
          title: 'Histogram',
        });
        histSeries.setData(formattedMacd.map(d => ({
          time: d.time,
          value: d.histogram,
          color: d.histogram >= 0 ? 'rgba(225, 82, 65, 0.8)' : 'rgba(41, 136, 217, 0.8)',
        })));
      }

      // 리사이즈 핸들러
      const handleResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: height,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      setLoading(false);

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
  }, [data, type, height]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[#6E7681] text-xs">
        지표 로딩...
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
