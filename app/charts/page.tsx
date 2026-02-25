'use client';

import { useState, useCallback, useEffect } from 'react';
import { useChartData, CandleData } from '@/hooks/useChartData';
import { TradingChart } from './components/TradingChart';
import { COINS } from '@/lib/constants/symbols';
import { normalizeSymbol } from '@/lib/utils/chartUtils';

const TIMEFRAMES = [
  { value: '1m', label: '1분' },
  { value: '5m', label: '5분' },
  { value: '15m', label: '15분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' },
];

interface MarketStats {
  lastPrice: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export default function ChartPage() {
  const [symbol, setSymbol] = useState('BTC');
  const [resolution, setResolution] = useState('1h');
  const [hoverData, setHoverData] = useState<CandleData | null>(null);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  
  const { data, isLoading, isLoadingMore, error, hasMore, loadMore } = useChartData(symbol, resolution);
  
  // 24h stats 로드
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const productId = normalizeSymbol(symbol);
        const res = await fetch(`https://api.exchange.coinbase.com/products/${productId}/stats`, {
          headers: { 'User-Agent': 'dongsu-pro-chart/1.0' },
        });
        if (!res.ok) return;
        
        const d = await res.json();
        const last = parseFloat(d.last);
        const open = parseFloat(d.open);
        
        setMarketStats({
          lastPrice: last,
          change24hPct: ((last - open) / open) * 100,
          high24h: parseFloat(d.high),
          low24h: parseFloat(d.low),
          volume24h: parseFloat(d.volume),
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [symbol]);
  
  const displayData = hoverData || (data.length > 0 ? data[data.length - 1] : null);
  const isUp = (marketStats?.change24hPct || 0) >= 0;
  
  const formatPrice = (p?: number) => {
    if (p == null || isNaN(p)) return '-';
    return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#0D1117] text-[#E6EDF3]">
      {/* 헤더 */}
      <header className="h-12 bg-[#161B22] border-b border-[#30363D] flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{symbol}</span>
          <span className="text-xs text-[#6E7681]">/USD</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPrice(marketStats?.lastPrice)}
          </span>
          <span className={`text-sm ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {(marketStats?.change24hPct ?? 0) >= 0 ? '+' : ''}
            {marketStats?.change24hPct?.toFixed(2) ?? '-'}%
          </span>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-4 text-sm">
          <span><span className="text-[#6E7681]">고</span> {' '}
            <span className="text-[#E15241]">{formatPrice(marketStats?.high24h)}</span>
          </span>
          <span><span className="text-[#6E7681]">저</span> {' '}
            <span className="text-[#2988D9]">{formatPrice(marketStats?.low24h)}</span>
          </span>
        </div>
      </header>
      
      {/* 메인 */}
      <div className="flex-1 flex min-h-0">
        {/* 사이드바 */}
        <aside className="w-60 border-r border-[#30363D] bg-[#161B22] flex flex-col">
          {/* 시간간격 */}
          <div className="flex border-b border-[#30363D]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setResolution(tf.value)}
                className={`flex-1 py-2 text-xs ${
                  resolution === tf.value
                    ? 'text-[#58A6FF] border-b-2 border-[#58A6FF]'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          
          {/* 종목 리스트 */}
          <div className="flex-1 overflow-y-auto">
            {COINS.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => setSymbol(coin.symbol)}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-[#21262D] ${
                  symbol === coin.symbol ? 'bg-[#1C2128]' : ''
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2"
                  style={{ backgroundColor: coin.color + '30', color: coin.color }}
                >
                  {coin.symbol[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{coin.symbol}</div>
                  <div className="text-xs text-[#6E7681]">{coin.nameKo}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
        
        {/* 차트 영역 */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* OHLC 인포라인 */}
          {displayData && (
            <div className="h-8 bg-[#0D1117] border-b border-[#30363D] flex items-center px-4 gap-4 text-xs">
              {[
                { l: 'O', v: displayData.open },
                { l: 'H', v: displayData.high },
                { l: 'L', v: displayData.low },
                { l: 'C', v: displayData.close },
                { l: 'V', v: displayData.volume },
              ].map((item) => (
                <span key={item.l} className="flex items-center gap-1">
                  <span className="text-[#6E7681]">{item.l}</span>
                  <span className="text-white">
                    {item.v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          {/* 차트 */}
          <div className="flex-1 min-h-0">
            {error ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-red-400 mb-2">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-[#58A6FF] text-white rounded"
                  >
                    새로고침
                  </button>
                </div>
              </div>
            ) : (
              <TradingChart
                data={data}
                symbol={symbol}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onCrosshairMove={setHoverData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
