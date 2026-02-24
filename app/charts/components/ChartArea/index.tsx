'use client';

import { useState } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { PriceHeader } from './PriceHeader';
import { TVChart } from './TVChart';
import { TimeframeSelector } from './TimeframeSelector';
import { IndicatorPanel } from './IndicatorPanel';

type IndicatorType = 'none' | 'rsi' | 'macd';

export function ChartArea() {
  const { selectedCoin, isDualMode, secondCoin } = useChartStore();
  const [indicator, setIndicator] = useState<IndicatorType>('none');
  const [chartData, setChartData] = useState<any[]>([]);
  
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 상단 시세 정보 */}
      <PriceHeader coin={selectedCoin} />
      
      
      {/* 시간간격 선택 + 지표 선택 */}
      <div className="flex items-center border-b border-[#30363D]">
        <TimeframeSelector />
        
        
        {/* 지표 선택 */}
        <div className="flex items-center gap-1 px-2 border-l border-[#30363D]">
          <button
            onClick={() => setIndicator('none')}
            className={`px-2 py-1 rounded text-xs ${
              indicator === 'none' ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            없음
          </button>
          <button
            onClick={() => setIndicator('rsi')}
            className={`px-2 py-1 rounded text-xs ${
              indicator === 'rsi' ? 'bg-[#FFD700] text-black' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            RSI
          </button>
          <button
            onClick={() => setIndicator('macd')}
            className={`px-2 py-1 rounded text-xs ${
              indicator === 'macd' ? 'bg-[#FF6B6B] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            MACD
          </button>
        </div>
      </div>
      
      
      {/* 차트 + 지표 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`flex-1 ${isDualMode ? 'flex flex-col' : ''} min-h-0`}>
          
          
          {/* 메인 차트 */}
          <div className={`${isDualMode ? 'h-1/2' : indicator !== 'none' ? 'h-2/3' : 'h-full'} min-h-0`}>
            <TVChart 
              symbol={selectedCoin.symbol} 
              isMain={true} 
              onDataChange={setChartData}
            />
          </div>
          
          
          {/* 지표 패널 */}
          {!isDualMode && indicator !== 'none' && (
            <div className="h-1/3 border-t border-[#30363D] min-h-0">
              <IndicatorPanel 
                data={chartData} 
                type={indicator} 
                height={150}
              />
            </div>
          )}
          
          
          {/* 듀얼 모드: 두 번째 차트 */}
          {isDualMode && (
            <div className="h-1/2 border-t border-[#30363D] min-h-0">
              {secondCoin ? (
                <TVChart symbol={secondCoin.symbol} isMain={false} />
              ) : (
                <div className="h-full flex items-center justify-center text-[#8B949E]">
                  <button
                    onClick={() => {
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
    </div>
  );
}
