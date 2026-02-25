'use client';

import { useState } from 'react';
import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { useMarketDataStore } from '@/lib/store/chartStore';
import { COINS as CRYPTO_SYMBOLS } from '@/lib/constants/symbols';
import { logEvent } from '@/lib/utils/chartCore';

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'favorites', label: '관심' },
];

export function MarketPanel() {
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const {
    mode,
    setActiveSymbol,
    setActivePane,
    leftSymbol,
    setLeftConfig,
    leftResolution,
    setRightConfig,
    rightResolution,
  } = useChartCoreStore();
  
  const { prices } = useMarketDataStore();
  
  const handleSelectSymbol = (symbol: string) => {
    logEvent('MARKETPANEL_SYMBOL_SELECT', { symbol, mode });
    
    if (mode === 'single') {
      setLeftConfig(symbol, leftResolution);
    } else {
      setActiveSymbol(symbol);
      const { activePane } = useChartCoreStore.getState();
      if (activePane === 'left') {
        setLeftConfig(symbol, leftResolution);
      } else {
        setRightConfig(symbol, rightResolution);
      }
    }
  };
  
  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const newFavs = new Set(prev);
      if (newFavs.has(symbol)) {
        newFavs.delete(symbol);
      } else {
        newFavs.add(symbol);
      }
      return newFavs;
    });
  };
  
  const displaySymbols = activeTab === 'favorites' 
    ? CRYPTO_SYMBOLS.filter((c) => favorites.has(c.symbol))
    : CRYPTO_SYMBOLS;
  
  return (
    <div className="w-72 border-r border-[#30363D] bg-[#161B22] flex flex-col">
      {/* 탭 */}
      <div className="flex border-b border-[#30363D]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#58A6FF] border-b-2 border-[#58A6FF]'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 헤더 */}
      <div className="flex px-4 py-2 text-xs text-[#6E7681] border-b border-[#30363D]">
        <span className="flex-1">종목</span>
        <span className="w-24 text-right">가격</span>
        <span className="w-16 text-right">등락</span>
      </div>
      
      {/* 종목 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {displaySymbols.map((coin) => {
          const priceData = prices[coin.symbol];
          const isActive = mode === 'single' 
            ? leftSymbol === coin.symbol
            : (useChartCoreStore.getState().activePane === 'left' 
                ? leftSymbol === coin.symbol 
                : useChartCoreStore.getState().rightSymbol === coin.symbol);
          const isFav = favorites.has(coin.symbol);
          
          return (
            <div
              key={coin.symbol}
              onClick={() => handleSelectSymbol(coin.symbol)}
              className={`flex items-center px-4 py-3 cursor-pointer border-b border-[#21262D] transition-colors ${
                isActive ? 'bg-[#1C2128]' : 'hover:bg-[#21262D]'
              }`}
            >
              {/* 즐겨찾기 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(coin.symbol);
                }}
                className={`mr-2 text-lg ${isFav ? 'text-[#FFD700]' : 'text-[#484F58]'}`}
              >
                {isFav ? '★' : '☆'}
              </button>
              
              {/* 종목 정보 */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: coin.color + '30', color: coin.color }}
                  >
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{coin.symbol}</div>
                    <div className="text-xs text-[#6E7681]">{coin.nameKo}</div>
                  </div>
                </div>
              </div>
              
              {/* 가격 */}
              <div className="w-24 text-right">
                <div className="font-medium text-sm">
                  {priceData ? `$${priceData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </div>
              </div>
              
              {/* 등락률 */}
              <div className="w-16 text-right">
                {priceData && (
                  <span
                    className={`text-sm font-medium ${
                      priceData.change24h >= 0 ? 'text-[#E15241]' : 'text-[#2988D9]'
                    }`}
                  >
                    {priceData.change24h >= 0 ? '+' : ''}
                    {priceData.change24h.toFixed(2)}%
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
