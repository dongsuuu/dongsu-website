'use client';

import { CoinMetadata } from '@/lib/constants/symbols';
import { useMarketDataStore } from '@/lib/store/chartStore';
import { THEME } from '@/lib/constants/theme';

interface PriceHeaderProps {
  coin: CoinMetadata;
}

export function PriceHeader({ coin }: PriceHeaderProps) {
  const { getPrice } = useMarketDataStore();
  const priceData = getPrice(coin.symbol);
  
  const currentPrice = priceData?.price || 0;
  const change24h = priceData?.change24h || 0;
  const change24hValue = priceData?.change24hValue || 0;
  const high24h = priceData?.high24h || 0;
  const low24h = priceData?.low24h || 0;
  const volume24h = priceData?.volume24h || 0;
  
  const isUp = change24h >= 0;
  const colorClass = isUp ? 'text-[#E15241]' : 'text-[#2988D9]';
  
  return (
    <div className="h-16 border-b border-[#30363D] bg-[#161B22] px-4 flex items-center gap-6">
      {/* 종목 정보 */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
          style={{ backgroundColor: coin.color + '30', color: coin.color }}
        >
          {coin.symbol.slice(0, 2)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{coin.symbol}</span>
            <span className="text-sm text-[#8B949E]">/USD</span>
          </div>
          <div className="text-xs text-[#8B949E]">{coin.nameKo || coin.name}</div>
        </div>
      </div>
      
      {/* 현재가 */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-sm font-medium ${colorClass}`}>
          {isUp ? '+' : ''}{change24h.toFixed(2)}%
        </span>
      </div>
      
      {/* 24h 통계 */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <div className="text-[#8B949E] text-xs">고가(24h)</div>
          <div className="font-medium">${high24h.toLocaleString()}</div>
        </div>
        
        <div>
          <div className="text-[#8B949E] text-xs">저가(24h)</div>
          <div className="font-medium">${low24h.toLocaleString()}</div>
        </div>
        
        <div>
          <div className="text-[#8B949E] text-xs">거래량(24h)</div>
          <div className="font-medium">{volume24h.toFixed(4)} {coin.symbol}</div>
        </div>
        
        <div>
          <div className="text-[#8B949E] text-xs">변동(24h)</div>
          <div className={`font-medium ${colorClass}`}>
            {isUp ? '+' : ''}{change24hValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
