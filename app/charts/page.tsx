'use client';

import { useState, useEffect } from 'react';
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
      <header className="h-10 bg-[#161B22] border-b border-[#30363D] flex items-center px-3 gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold">{symbol}</span>
          <span className="text-[10px] text-[#6E7681]">/USD</span>
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-bold ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPrice(marketStats?.lastPrice)}
          </span>
          <span className={`text-xs ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {(marketStats?.change24hPct ?? 0) >= 0 ? '+' : ''}
            {marketStats?.change24hPct?.toFixed(2) ?? '-'}%
          </span>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-3 text-xs">
          <span><span className="text-[#6E7681]">고</span> {' '}
            <span className="text-[#E15241]">{formatPrice(marketStats?.high24h)}</span>
          </span>
          <span><span className="text-[#6E7681]">저</span> {' '}
            <span className="text-[#2988D9]">{formatPrice(marketStats?.low24h)}</span>
          </span>
        </div>
      </header>
      
      {/* 메인 - 50vh로 제한하여 한눈에 보기 */}
      <div className="flex h-[50vh]">
        {/* 사이드바 */}
        <aside className="w-52 border-r border-[#30363D] bg-[#161B22] flex flex-col overflow-hidden">
          {/* 시간간격 */}
          <div className="flex border-b border-[#30363D]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setResolution(tf.value)}
                className={`flex-1 py-1.5 text-[10px] ${
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
                className={`w-full flex items-center px-2 py-1.5 text-left hover:bg-[#21262D] ${
                  symbol === coin.symbol ? 'bg-[#1C2128]' : ''
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-1.5"
                  style={{ backgroundColor: coin.color + '30', color: coin.color }}
                >
                  {coin.symbol[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{coin.symbol}</div>
                  <div className="text-[10px] text-[#6E7681] truncate">{coin.nameKo}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
        
        {/* 차트 영역 */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* OHLC 인포라인 */}
          {displayData && (
            <div className="h-6 bg-[#0D1117] border-b border-[#30363D] flex items-center px-3 gap-3 text-[10px] shrink-0">
              {[
                { l: 'O', v: displayData.open },
                { l: 'H', v: displayData.high },
                { l: 'L', v: displayData.low },
                { l: 'C', v: displayData.close },
                { l: 'V', v: displayData.volume },
              ].map((item) => (
                <span key={item.l} className="flex items-center gap-0.5">
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
                  <p className="text-red-400 text-sm mb-2">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-[#58A6FF] text-white rounded text-sm"
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
      
      {/* 하단 여백 */}
      <div className="flex-1 bg-[#0D1117]"></div>
    </div>
  );
}
