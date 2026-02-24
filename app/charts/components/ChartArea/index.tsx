'use client';

import { useChartStore } from '@/lib/store/chartStore';
import { PriceHeader } from './PriceHeader';
import { TVChart } from './TVChart';

export function ChartArea() {
  const { selectedCoin, isDualMode, secondCoin } = useChartStore();
  
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 상단 시세 정보 */}
      <PriceHeader coin={selectedCoin} />
      
      {/* 차트 */}
      <div className={`flex-1 ${isDualMode ? 'flex flex-col' : ''}`}>
        {/* 메인 차트 */}
        <div className={`${isDualMode ? 'h-1/2' : 'h-full'}`}>
          <TVChart symbol={selectedCoin.symbol} isMain={true} />
        </div>
        
        {/* 듀얼 모드: 두 번째 차트 */}
        {isDualMode && (
          <div className="h-1/2 border-t border-[#30363D]">
            {secondCoin ? (
              <TVChart symbol={secondCoin.symbol} isMain={false} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#8B949E]">
                두 번째 종목을 선택하세요
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
