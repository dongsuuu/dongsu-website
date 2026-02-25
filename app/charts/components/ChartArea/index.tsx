'use client';

import { useChartCoreStore } from '@/lib/store/chartCoreStore';
import { TVChart } from './TVChart';

export function ChartArea() {
  const { 
    mode, 
    leftSymbol, 
    leftResolution, 
    rightSymbol, 
    rightResolution 
  } = useChartCoreStore();
  
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {mode === 'single' ? (
        <TVChart 
          chartId="left"
          symbol={leftSymbol}
          resolution={leftResolution}
        />
      ) : (
        <>
          <div className="h-1/2 border-b border-[#30363D]">
            <TVChart 
              chartId="left"
              symbol={leftSymbol}
              resolution={leftResolution}
            />
          </div>
          <div className="h-1/2">
            <TVChart 
              chartId="right"
              symbol={rightSymbol}
              resolution={rightResolution}
            />
          </div>
        </>
      )}
    </div>
  );
}
