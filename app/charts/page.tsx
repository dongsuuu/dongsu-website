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
  { value: '30m', label: '30분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' },
  { value: '1w', label: '1주' },
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
  
  const formatVolume = (v?: number) => {
    if (v == null || isNaN(v)) return '-';
    if (v > 1000000000) return `${(v / 1000000000).toFixed(2)}B`;
    if (v > 1000000) return `${(v / 1000000).toFixed(2)}M`;
    if (v > 1000) return `${(v / 1000).toFixed(2)}K`;
    return v.toFixed(0);
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#0D1117] text-[#E6EDF3] overflow-hidden">
      {/* 상단 헤더 - 업비트 스타일 */}
      <header className="h-14 bg-[#161B22] border-b border-[#30363D] flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{symbol}</span>
          <span className="text-sm text-[#6E7681]">/USD</span>
        </div>
        
        <div className="flex items-baseline gap-3">
          <span className={`text-2xl font-bold ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPrice(marketStats?.lastPrice)}
          </span>
          <span className={`text-base ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {(marketStats?.change24hPct ?? 0) >= 0 ? '+' : ''}
            {marketStats?.change24hPct?.toFixed(2) ?? '-'}%
          </span>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#6E7681]">고가</span>
            <span className="text-[#E15241] font-medium">{formatPrice(marketStats?.high24h)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#6E7681]">저가</span>
            <span className="text-[#2988D9] font-medium">{formatPrice(marketStats?.low24h)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#6E7681]">거래량(24h)</span>
            <span className="font-medium">{formatVolume(marketStats?.volume24h)} {symbol}</span>
          </div>
        </div>
      </header>
      
      {/* 메인 콘텐츠 - 업비트 스타일: 좁은 사이드바 + 넓은 차트 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측 사이드바 - 좁게 (280px) */}
        <aside className="w-[280px] border-r border-[#30363D] bg-[#161B22] flex flex-col shrink-0">
          {/* 시간간격 탭 */}
          <div className="flex border-b border-[#30363D] overflow-x-auto scrollbar-hide">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setResolution(tf.value)}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors ${
                  resolution === tf.value
                    ? 'text-[#58A6FF] border-b-2 border-[#58A6FF] bg-[#1C2128]'
                    : 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          
          {/* 종목 리스트 헤더 */}
          <div className="flex px-3 py-2 text-[10px] text-[#6E7681] border-b border-[#30363D]">
            <span className="flex-1">종목</span>
            <span className="w-20 text-right">현재가</span>
            <span className="w-14 text-right">등락률</span>
          </div>
          
          {/* 종목 리스트 */}
          <div className="flex-1 overflow-y-auto">
            {COINS.map((coin) => {
              const stats = marketStats; // 간단화를 위해 현재 심볼만 표시
              const isActive = symbol === coin.symbol;
              const isUp = (marketStats?.change24hPct || 0) >= 0;
              
              return (
                <button
                  key={coin.symbol}
                  onClick={() => setSymbol(coin.symbol)}
                  className={`w-full flex items-center px-3 py-2.5 text-left border-b border-[#21262D] transition-colors ${
                    isActive ? 'bg-[#1C2128]' : 'hover:bg-[#21262D]'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: coin.color + '30', color: coin.color }}
                    >
                      {coin.symbol.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">{coin.symbol}</div>
                      <div className="text-[10px] text-[#6E7681] truncate">{coin.nameKo}</div>
                    </div>
                  </div>
                  
                  <div className="w-20 text-right">
                    <div className="text-sm font-medium">
                      {isActive ? formatPrice(marketStats?.lastPrice) : '-'}
                    </div>
                  </div>
                  
                  <div className="w-14 text-right">
                    {isActive && (
                      <span className={`text-xs font-medium ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
                        {isUp ? '+' : ''}{marketStats?.change24hPct?.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
        
        {/* 우측 차트 영역 - 넓게 */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0D1117]">
          {/* OHLC 인포바 */}
          {displayData && (
            <div className="h-10 bg-[#0D1117] border-b border-[#30363D] flex items-center px-4 gap-6 text-sm">
              {[
                { l: '시가', v: displayData.open, c: 'text-white' },
                { l: '고가', v: displayData.high, c: 'text-[#E15241]' },
                { l: '저가', v: displayData.low, c: 'text-[#2988D9]' },
                { l: '종가', v: displayData.close, c: 'text-white' },
                { l: '거래량', v: displayData.volume, c: 'text-white', vol: true },
              ].map((item) => (
                <span key={item.l} className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6E7681]">{item.l}</span>
                  <span className={`font-medium ${item.c}`}>
                    {item.vol 
                      ? item.v.toLocaleString('en-US', { maximumFractionDigits: 4 })
                      : item.v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          {/* 차트 - 화면 대부분 차지 */}
          <div className="flex-1 min-h-0 relative">
            {error ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-red-400 mb-3">{error}</p>
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
