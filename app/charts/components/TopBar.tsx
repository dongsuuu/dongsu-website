'use client';

import { useState } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { searchCoins } from '@/lib/constants/symbols';

export function TopBar() {
  const { selectedCoin, isDualMode, toggleDualMode, setSelectedCoin } = useChartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const searchResults = searchQuery ? searchCoins(searchQuery) : [];
  
  const handleSelectCoin = (coin: typeof selectedCoin) => {
    setSelectedCoin(coin);
    setSearchQuery('');
    setShowSearchResults(false);
  };
  
  return (
    <div className="h-14 border-b border-[#30363D] bg-[#161B22] flex items-center px-4 gap-4">
      {/* 로고 */}
      <div className="font-bold text-lg text-white">
        dongsu<span className="text-[#58A6FF]">Pro</span>
      </div>
      
      {/* 검색 */}
      <div className="relative">
        <div className="flex items-center bg-[#0D1117] border border-[#30363D] rounded px-3 py-1.5 w-64">
          <svg className="w-4 h-4 text-[#6E7681] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            placeholder="종목 검색 (BTC, 비트코인...)"
            className="bg-transparent border-none outline-none text-sm w-full text-[#E6EDF3] placeholder-[#6E7681]"
          />
        </div>
        
        {/* 검색 결과 */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B22] border border-[#30363D] rounded shadow-lg z-50 max-h-64 overflow-y-auto">
            {searchResults.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => handleSelectCoin(coin)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#21262D] text-left"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: coin.color + '30', color: coin.color }}
                >
                  {coin.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="font-medium">{coin.symbol}</div>
                  <div className="text-xs text-[#8B949E]">{coin.nameKo || coin.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 현재 선택된 종목 */}
      <div className="flex items-center gap-2 px-3 py-1 bg-[#0D1117] rounded border border-[#30363D]">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: selectedCoin.color + '30', color: selectedCoin.color }}
        >
          {selectedCoin.symbol.slice(0, 2)}
        </div>
        <span className="font-medium">{selectedCoin.symbol}/USD</span>
      </div>
      
      {/* 모드 토글 */}
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#8B949E]">모드:</span>
        <div className="flex bg-[#0D1117] rounded p-0.5">
          <button
            onClick={() => isDualMode && toggleDualMode()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              !isDualMode ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => !isDualMode && toggleDualMode()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isDualMode ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Dual
          </button>
        </div>
      </div>
    </div>
  );
}
