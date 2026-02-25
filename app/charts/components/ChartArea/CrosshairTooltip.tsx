'use client';

import { useChartStore } from '@/lib/store/chartStore';

interface CrosshairTooltipProps {
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null;
  position: { x: number; y: number } | null;
}

export function CrosshairTooltip({ data, position }: CrosshairTooltipProps) {
  const { selectedCoin } = useChartStore();
  
  if (!data || !position) return null;
  
  const change = data.close - data.open;
  const changePercent = (change / data.open) * 100;
  const isUp = change >= 0;
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    });
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div
      className="absolute z-50 bg-[#161B22] border border-[#30363D] rounded-lg p-3 shadow-lg pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        minWidth: '200px',
      }}
    >
      {/* 시간 */}
      <div className="text-xs text-[#8B949E] mb-2 border-b border-[#30363D] pb-1">
        {formatTime(data.time)}
      </div>
      
      {/* OHLC */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[#8B949E]">시가 (O)</span>
          <span className="font-mono">{formatPrice(data.open)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B949E]">고가 (H)</span>
          <span className="font-mono text-[#E15241]">{formatPrice(data.high)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B949E]">저가 (L)</span>
          <span className="font-mono text-[#2988D9]">{formatPrice(data.low)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B949E]">종가 (C)</span>
          <span className={`font-mono font-bold ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
            {formatPrice(data.close)}
          </span>
        </div>
      </div>
      
      {/* 변동 */}
      <div className="mt-2 pt-2 border-t border-[#30363D] flex justify-between items-center">
        <span className="text-xs text-[#8B949E]">변동</span>
        <span className={`text-sm font-mono ${isUp ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
      
      {/* 거래량 */}
      <div className="mt-1 flex justify-between items-center">
        <span className="text-xs text-[#8B949E]">거래량</span>
        <span className="text-sm font-mono text-[#58A6FF]">
          {data.volume.toFixed(4)} {selectedCoin.symbol}
        </span>
      </div>
    </div>
  );
}
