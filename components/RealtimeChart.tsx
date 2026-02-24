'use client';

import { useEffect, useRef, useState } from 'react';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Coin {
  id: string;
  symbol: string;
  name: string;
  color: string;
}

interface RealtimeChartProps {
  symbol: string;
  coin: Coin;
  height?: number;
}

const SYMBOL_MAP: Record<string, string> = {
  'BTCUSDT': 'BTC-USD',
  'ETHUSDT': 'ETH-USD',
  'BNBUSDT': 'BNB-USD',
  'SOLUSDT': 'SOL-USD',
  'XRPUSDT': 'XRP-USD',
  'ADAUSDT': 'ADA-USD',
  'DOGEUSDT': 'DOGE-USD',
  'AVAXUSDT': 'AVAX-USD',
  'DOTUSDT': 'DOT-USD',
  'LINKUSDT': 'LINK-USD',
};

export default function RealtimeChart({ symbol, coin, height = 400 }: RealtimeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch(`/api/crypto/chart/?symbol=${symbol}&interval=1h`);
        const json = await res.json();
        if (json.success) {
          setData(json);
          setCurrentPrice(json.currentPrice);
          setChange24h(json.change24h);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, [symbol]);

  // WebSocket 연결
  useEffect(() => {
    if (!data) return;
    
    const productId = SYMBOL_MAP[symbol];
    if (!productId) return;
    
    // Coinbase WebSocket 연결
    const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // 구독 요청
      ws.send(JSON.stringify({
        type: 'subscribe',
        product_ids: [productId],
        channels: ['ticker', 'heartbeat'],
      }));
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'ticker' && message.product_id === productId) {
        const price = parseFloat(message.price);
        setCurrentPrice(price);
        
        // 24h 변동률 계산 (open 기준)
        if (message.open_24h) {
          const open24h = parseFloat(message.open_24h);
          const change = ((price - open24h) / open24h) * 100;
          setChange24h(change);
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [data, symbol]);

  // 차트 렌더링
  useEffect(() => {
    if (!chartContainerRef.current || !data?.chartData?.length) return;
    
    // 이전 차트 정리
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries, AreaSeries, ColorType } = await import('lightweight-charts');
        
        const chart = createChart(chartContainerRef.current!, {
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
            vertLine: { color: '#3b82f6', labelBackgroundColor: '#3b82f6' },
            horzLine: { color: '#3b82f6', labelBackgroundColor: '#3b82f6' },
          },
          handleScroll: { vertTouchDrag: false },
          width: chartContainerRef.current!.clientWidth,
          height: height,
        });

        chartRef.current = chart;

        let series: any;
        
        if (chartType === 'candle') {
          series = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
          });
          
          series.setData(data.chartData.map((item: ChartData) => ({
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          })));
        } else {
          series = chart.addSeries(AreaSeries, {
            lineColor: coin.color || '#3b82f6',
            topColor: (coin.color || '#3b82f6') + '40',
            bottomColor: (coin.color || '#3b82f6') + '05',
            lineWidth: 2,
          });
          
          series.setData(data.chartData.map((item: ChartData) => ({
            time: item.time,
            value: item.close,
          })));
        }

        seriesRef.current = series;
        chart.timeScale().fitContent();

        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        console.error('Chart init error:', err);
      }
    };

    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, chartType, coin.color, height]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6" style={{ height: height + 80 }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const isPositive = change24h >= 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: coin.color + '20', color: coin.color }}
            >
              {coin.symbol.replace('USDT', '').slice(0, 3)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{coin.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isPositive ? '+' : ''}{change24h.toFixed(2)}%
                </span>
                <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  ● {isConnected ? '실시간' : '연결 끊김'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('candle')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${chartType === 'candle' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            >
              캔들
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            >
              라인
            </button>
          </div>
        </div>
        
        {data && (
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <span className="text-slate-400">고가 (24h):</span>{' '}
              <span className="text-green-400">${data.high24h?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">저가 (24h):</span>{' '}
              <span className="text-red-400">${data.low24h?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">거래량 (24h):</span>{' '}
              <span>{data.volume24h ? (data.volume24h / 1000000).toFixed(2) + 'M' : '-'}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div ref={chartContainerRef} className="h-[400px]" />
      </div>
      
      <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
        <span>Coinbase Pro WebSocket</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
