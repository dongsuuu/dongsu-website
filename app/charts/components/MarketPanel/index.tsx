'use client';

import { useChartStore, useMarketDataStore } from '@/lib/store/chartStore';
import { COINS } from '@/lib/constants/symbols';
import { THEME } from '@/lib/constants/theme';

export function MarketPanel() {
  const { selectedCoin, setSelectedCoin, favorites, toggleFavorite, isFavorite } = useChartStore();
  const { prices, wsStatus } = useMarketDataStore();
  
  return (
    <div className="w-64 border-r border-[#30363D] bg-[#161B22] flex flex-col">
      {/* 헤더 */}
      <div className="h-10 border-b border-[#30363D] flex items-center px-3">
        <span className="text-sm font-medium">종목 리스트</span>
        <span className={`ml-auto text-xs ${
          wsStatus === 'connected' ? 'text-green-400' : 'text-red-400'
        }`}>
          ● {wsStatus === 'connected' ? '실시간' : '연결 중...'}
        </span>
      </div>
      
      {/* 종목 목록 */}
      <div className="flex-1 overflow-y-auto">
        {COINS.slice(0, 15).map((coin) => {
          const priceData = prices[coin.symbol];
          const isSelected = selectedCoin.symbol === coin.symbol;
          const isFav = isFavorite(coin.symbol);
          
          return (
            <button
              key={coin.symbol}
              onClick={() => setSelectedCoin(coin)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-[#21262D] hover:bg-[#21262D] transition-colors ${
                isSelected ? 'bg-[#1C2128]' : ''
              }`}
            >
              {/* 즐겨찾기 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(coin.symbol);
                }}
                className="text-sm">
                {isFav ? '⭐' : '☆'}
              </button>
              
              {/* 심볼/이름 */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{coin.symbol}</span>
                  <span className="text-xs text-[#8B949E]">{coin.nameKo || coin.name}</span>
                </div>
              </div>
              
              {/* 가격/변동률 */}
              <div className="text-right">
                {priceData ? (
                  <>
                    <div className="font-medium">
                      ${priceData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${
                      priceData.change24h >= 0 ? 'text-[#E15241]' : 'text-[#2988D9]'
                    }`}>
                      {priceData.change24h >= 0 ? '+' : ''}
                      {priceData.change24h.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[#6E7681]">로딩...</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
