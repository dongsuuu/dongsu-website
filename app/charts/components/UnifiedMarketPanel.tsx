'use client';

import { useState } from 'react';
import { useUnifiedChartStore } from '@/lib/store/unifiedChartStore';
import { COINS } from '@/lib/constants/symbols';
import { logEvent } from '@/lib/utils/chartUtils';

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'favorites', label: '관심' },
];

export function UnifiedMarketPanel() {
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    mode, 
    activePane, 
    setActivePane, 
    setSymbol, 
    left, 
    right, 
    marketStats 
  } = useUnifiedChartStore();
  
  const handleSelectSymbol = (symbol: string) => {
    logEvent('SELECT_SYMBOL', { symbol, pane: activePane });
    setSymbol(activePane, symbol);
  };
  
  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };
  
  const displayCoins = activeTab === 'favorites' 
    ? COINS.filter((c) => favorites.has(c.symbol))
    : COINS.filter((c) => 
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameKo?.includes(searchQuery)
      );
  
  // 현재 활성 심볼
  const activeSymbol = activePane === 'left' ? left.symbol : right.symbol;
  
  return (
    <div className="w-64 border-r border-[#30363D] bg-[#161B22] flex flex-col shrink-0">
      {/* 탭 */}
      <div className="flex border-b border-[#30363D]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#58A6FF] border-b-2 border-[#58A6FF]'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 검색 */}
      <div className="px-2 py-2 border-b border-[#30363D]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색..."
          className="w-full px-2 py-1.5 bg-[#0D1117] border border-[#30363D] rounded text-xs text-[#E6EDF3] placeholder-[#6E7681] outline-none focus:border-[#58A6FF]"
        />
      </div>
      
      {/* Dual 모드 인디케이터 */}
      {mode === 'dual' && (
        <div className="flex border-b border-[#30363D] text-xs">
          {(['left', 'right'] as const).map((pane) => (
            <button
              key={pane}
              onClick={() => setActivePane(pane)}
              className={`flex-1 py-1.5 font-medium transition-colors ${
                activePane === pane
                  ? 'bg-[#58A6FF]/20 text-[#58A6FF]'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              {pane === 'left' ? '상단' : '하단'} ({pane === 'left' ? left.symbol : right.symbol})
            </button>
          ))}
        </div>
      )}
      
      {/* 헤더 */}
      <div className="flex px-3 py-1.5 text-[10px] text-[#6E7681] border-b border-[#30363D]">
        <span className="flex-1">종목</span>
        <span className="w-16 text-right">가격</span>
        <span className="w-12 text-right">등락</span>
      </div>
      
      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {displayCoins.map((coin) => {
          const stats = marketStats[coin.symbol];
          const isActive = activeSymbol === coin.symbol;
          const isFav = favorites.has(coin.symbol);
          const isUp = (stats?.change24hPct || 0) >= 0;
          
          return (
            <div
              key={coin.symbol}
              onClick={() => handleSelectSymbol(coin.symbol)}
              className={`flex items-center px-2 py-1.5 cursor-pointer border-b border-[#21262D] transition-colors ${
                isActive ? 'bg-[#1C2128]' : 'hover:bg-[#21262D]'
              }`}
            >
              {/* 즐겨찾기 */}
              <button
                onClick={(e) => toggleFavorite(coin.symbol, e)}
                className={`mr-1.5 text-sm ${isFav ? 'text-[#FFD700]' : 'text-[#484F58] hover:text-[#6E7681]'}`}
              >
                {isFav ? '★' : '☆'}
              </button>
              
              {/* 심볼/이름 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: coin.color + '30', color: coin.color }}
                  >
                    {coin.symbol.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-xs truncate">{coin.symbol}</div>
                    <div className="text-[10px] text-[#6E7681] truncate">{coin.nameKo}</div>
                  </div>
                </div>
              </div>
              
              {/* 가격 */}
              <div className="w-16 text-right">
                <div className="text-xs font-medium">
                  {stats?.lastPrice 
                    ? `$${stats.lastPrice.toLocaleString('en-US', { minimumFractionDigits: stats.lastPrice < 10 ? 4 : 2, maximumFractionDigits: stats.lastPrice < 10 ? 4 : 2 })}`
                    : '-'
                  }
                </div>
              </div>
              
              {/* 등락률 */}
              <div className="w-12 text-right">
                {stats?.change24hPct !== undefined && (
                  <span className={`text-[10px] font-medium ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
                    {isUp ? '+' : ''}{stats.change24hPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
