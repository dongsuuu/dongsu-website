'use client';

import { useChartStore } from '@/lib/store/chartStore';
import { PriceHeader } from './PriceHeader';
import { TVChart } from './TVChart';
import { TimeframeSelector } from './TimeframeSelector';

export function ChartArea() {
  const { selectedCoin, isDualMode, secondCoin } = useChartStore();
  
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 상단 시세 정보 */}
      <PriceHeader coin={selectedCoin} />
      
      
      {/* 시간간격 선택 */}
      <TimeframeSelector />
      
      
      {/* 차트 */}
      <div className={`flex-1 ${isDualMode ? 'flex flex-col' : ''}`}>
        
        {/* 메인 차트 */}
        <div className={`${isDualMode ? 'h-1/2' : 'h-full'} min-h-0`}>
          <TVChart symbol={selectedCoin.symbol} isMain={true} />
        </div>
        
        
        {/* 듀얼 모드: 두 번째 차트 */}
        {isDualMode && (
          <div className="h-1/2 border-t border-[#30363D] min-h-0">
            {secondCoin ? (
              <TVChart symbol={secondCoin.symbol} isMain={false} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#8B949E]">
                <button
                  onClick={() => {
                    // 두 번째 종목 선택 로직 (임시로 ETH)
                    const { setSecondCoin } = useChartStore.getState();
                    const eth = { 
                      id: 'ethereum', 
                      symbol: 'ETH', 
                      name: 'Ethereum', 
                      nameKo: '이더리움', 
                      color: '#627EEA' 
                    };
                    setSecondCoin(eth);
                  }}
                  className="px-4 py-2 bg-[#21262D] rounded text-sm hover:bg-[#30363D]"
                >
                  ETH 선택하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
