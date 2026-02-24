'use client';

import { useEffect, useRef, useState } from 'react';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Coin {
  id: string;
  symbol: string;
  name: string;
  color: string;
  price?: number;
  change24h?: number;
}

const COINS: Coin[] = [
  { id: 'bitcoin', symbol: 'BTCUSDT', name: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETHUSDT', name: 'Ethereum', color: '#627EEA' },
  { id: 'binancecoin', symbol: 'BNBUSDT', name: 'BNB', color: '#F3BA2F' },
  { id: 'solana', symbol: 'SOLUSDT', name: 'Solana', color: '#00FFA3' },
  { id: 'ripple', symbol: 'XRPUSDT', name: 'XRP', color: '#23292F' },
  { id: 'cardano', symbol: 'ADAUSDT', name: 'Cardano', color: '#0033AD' },
  { id: 'dogecoin', symbol: 'DOGEUSDT', name: 'Dogecoin', color: '#C2A633' },
  { id: 'avalanche-2', symbol: 'AVAXUSDT', name: 'Avalanche', color: '#E84142' },
  { id: 'chainlink', symbol: 'LINKUSDT', name: 'Chainlink', color: '#2A5ADA' },
  { id: 'polkadot', symbol: 'DOTUSDT', name: 'Polkadot', color: '#E6007A' },
  { id: 'pepe', symbol: 'PEPEUSDT', name: 'Pepe', color: '#4CA64C' },
  { id: 'shiba-inu', symbol: 'SHIBUSDT', name: 'Shiba Inu', color: '#FFA409' },
];

const INTERVALS = [
  { value: '15m', label: '15분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' },
];

export default function ChartsPage() {
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTCUSDT']);
  const [viewMode, setViewMode] = useState<'single' | 'dual'>('single');
  const [interval, setInterval] = useState('1h');
  const [coinData, setCoinData] = useState<Record<string, any>>({});
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 코인 가격 데이터 가져오기
  useEffect(() => {
    if (!isClient) return;
    
    async function loadPrices() {
      try {
        const res = await fetch('/api/crypto/list/?type=top');
        const json = await res.json();
        if (json.success) {
          const dataMap: Record<string, any> = {};
          json.coins.forEach((coin: any) => {
            dataMap[coin.symbol] = coin;
          });
          setCoinData(dataMap);
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      }
    }

    loadPrices();
    const timer = window.setInterval(loadPrices, 30000);
    return () => window.clearInterval(timer);
  }, [isClient]);

  const handleCoinSelect = (symbol: string) => {
    if (selectedCoins.includes(symbol)) {
      if (selectedCoins.length > 1) {
        setSelectedCoins(selectedCoins.filter(s => s !== symbol));
      }
    } else {
      if (selectedCoins.length < 2) {
        setSelectedCoins([...selectedCoins, symbol]);
      } else {
        setSelectedCoins([selectedCoins[0], symbol]);
      }
    }
  };

  const displayedCoins = selectedCoins.slice(0, viewMode === 'dual' ? 2 : 1);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="container mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Live Crypto <span className="text-blue-400">Charts</span>
        </h1>
        <p className="text-slate-400">Select coins and view mode to analyze markets</p>
      </section>

      {/* Controls */}
      <section className="container mx-auto px-4 py-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* View Mode */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 whitespace-nowrap">View:</span>
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Single
                </button>
                <button
                  onClick={() => setViewMode('dual')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === 'dual' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Dual
                </button>
              </div>
            </div>

            {/* Interval */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 whitespace-nowrap">Interval:</span>
              <div className="flex bg-slate-700 rounded-lg p-1">
                {INTERVALS.map((int) => (
                  <button
                    key={int.value}
                    onClick={() => setInterval(int.value)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      interval === int.value ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coin Selector */}
      <section className="container mx-auto px-4 py-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            Select Coins ({selectedCoins.length}/{viewMode === 'dual' ? 2 : 1}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {COINS.map((coin) => {
              const isSelected = selectedCoins.includes(coin.symbol);
              const data = coinData[coin.symbol];
              
              return (
                <button
                  key={coin.symbol}
                  onClick={() => handleCoinSelect(coin.symbol)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-blue-600/20 border-blue-500 text-white' 
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: coin.color + '30', color: coin.color }}
                  >
                    {coin.symbol.replace('USDT', '').slice(0, 2)}
                  </div>
                  <span className="font-medium">{coin.name}</span>
                  {data && (
                    <span className={`text-xs ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data.change24h >= 0 ? '+' : ''}{data.change24h?.toFixed(1)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="container mx-auto px-4 py-4 pb-12">
        <div className={`grid ${viewMode === 'dual' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {displayedCoins.map((symbol) => (
            <ChartWindow 
              key={`${symbol}-${interval}`}
              symbol={symbol}
              interval={interval}
              coin={COINS.find(c => c.symbol === symbol)!}
              coinData={coinData[symbol]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// 차트 윈도우 컴포넌트
function ChartWindow({ 
  symbol, 
  interval, 
  coin,
  coinData 
}: { 
  symbol: string; 
  interval: string; 
  coin: Coin;
  coinData?: any;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  // 데이터 가져오기
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/crypto/chart/?symbol=${symbol}&interval=${interval}&limit=100`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        
        if (!isMounted) return;
        
        if (!json.success) {
          throw new Error(json.error || 'Failed to load data');
        }
        
        if (!json.chartData || json.chartData.length === 0) {
          throw new Error('No chart data available');
        }
        
        setData(json);
      } catch (err: any) {
        console.error('Failed to load chart:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load chart data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    
    const timer = window.setInterval(loadData, 10000);
    
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [symbol, interval]);

  // 차트 렌더링
  useEffect(() => {
    if (!chartContainerRef.current || !data?.chartData?.length) return;
    
    // 이전 차트 정리
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    let chart: any;

    const initChart = async () => {
      try {
        const { createChart, CandlestickSeries, AreaSeries, ColorType } = await import('lightweight-charts');
        
        chart = createChart(chartContainerRef.current!, {
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
          height: 400,
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
        setError('Failed to initialize chart');
      }
    };

    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, chartType, coin.color]);

  const currentPrice = coinData?.price || data?.currentPrice || 0;
  const change24h = coinData?.change24h || data?.change24h || 0;
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
                <span className="text-xl font-bold">
                  ${currentPrice ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </span>
                {change24h !== 0 && (
                  <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* 차트 타입 토글 */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('candle')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'candle' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              캔들
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-300'
              }`}
            >
              라인
            </button>
          </div>
        </div>
        
        {/* 24h 통계 */}
        {data && (
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <span className="text-slate-400">고가:</span>{' '}
              <span className="text-green-400">${data.high24h?.toLocaleString() || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400">저가:</span>{' '}
              <span className="text-red-400">${data.low24h?.toLocaleString() || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400">거래량:</span>{' '}
              <span>{data.volume24h ? (data.volume24h / 1000000).toFixed(2) + 'M' : '-'}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 차트 */}
      <div className="p-4">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-8 bg-slate-700 rounded w-full"></div>
              <div className="h-64 bg-slate-700 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center text-red-400">
            <div className="text-center">
              <p className="mb-2">⚠️ {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 rounded text-white text-sm"
              >
                새로고침
              </button>
            </div>
          </div>
        ) : (
          <div ref={chartContainerRef} className="h-[400px]" />
        )}
      </div>
      
      {/* 푸터 */}
      <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
        <span>Binance API</span>
        <span>{data && new Date(data.lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
