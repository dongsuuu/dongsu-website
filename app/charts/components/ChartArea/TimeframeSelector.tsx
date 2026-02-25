'use client';

import { useState } from 'react';
import { useChartStore } from '@/lib/store/chartStore';
import { ChartSettingsPanel } from './ChartSettingsPanel';

const TIMEFRAMES = [
  { value: '1m', label: '1분' },
  { value: '5m', label: '5분' },
  { value: '15m', label: '15분' },
  { value: '30m', label: '30분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' },
  { value: '1w', label: '1주' },
] as const;

export function TimeframeSelector() {
  const { timeframe, setTimeframe, showMA, toggleMA, showVolume, toggleVolume } = useChartStore();
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#30363D] bg-[#161B22]">
        <div className="flex bg-[#0D1117] rounded p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === tf.value
                  ? 'bg-[#58A6FF] text-white'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1" />
        
        {/* 지표 토글 */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMA}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              showMA ? 'bg-[#21262D] text-[#FFD700]' : 'text-[#6E7681] hover:text-white'
            }`}
          >
            MA
          </button>
          
          <button
            onClick={toggleVolume}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              showVolume ? 'bg-[#21262D] text-[#58A6FF]' : 'text-[#6E7681] hover:text-white'
            }`}
          >
            거래량
          </button>
          
          {/* 설정 버튼 */}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              showSettings ? 'bg-[#58A6FF] text-white' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            ⚙️ 설정
          </button>
        </div>
      </div>
      
      <ChartSettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}
