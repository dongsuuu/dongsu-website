'use client';

import { useChartStore } from '@/lib/store/chartStore';
import { useState } from 'react';

interface ChartSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChartSettingsPanel({ isOpen, onClose }: ChartSettingsPanelProps) {
  const { 
    showMA, 
    toggleMA, 
    showVolume, 
    toggleVolume,
  } = useChartStore();
  
  const [maPeriods, setMaPeriods] = useState({
    ma7: true,
    ma25: true,
    ma60: true,
  });
  
  const [theme, setTheme] = useState('upbit'); // 'upbit' | 'binance'
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute right-4 top-16 z-50 w-72 bg-[#161B22] border border-[#30363D] rounded-lg shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">차트 설정</h3>
          <button 
            onClick={onClose}
            className="text-[#8B949E] hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {/* 지표 설정 */}
        <div className="space-y-3">
          <div className="font-medium text-sm text-[#8B949E] mb-2">지표</div>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">이동평균선 (MA)</span>
            <input
              type="checkbox"
              checked={showMA}
              onChange={toggleMA}
              className="w-4 h-4 accent-[#58A6FF]"
            />
          </label>
          
          {showMA && (
            <div className="ml-4 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maPeriods.ma7}
                  onChange={(e) => setMaPeriods(p => ({ ...p, ma7: e.target.checked }))}
                  className="w-3 h-3 accent-[#FFD700]"
                />
                <span className="text-xs text-[#FFD700]">MA7</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maPeriods.ma25}
                  onChange={(e) => setMaPeriods(p => ({ ...p, ma25: e.target.checked }))}
                  className="w-3 h-3 accent-[#FF6B6B]"
                />
                <span className="text-xs text-[#FF6B6B]">MA25</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maPeriods.ma60}
                  onChange={(e) => setMaPeriods(p => ({ ...p, ma60: e.target.checked }))}
                  className="w-3 h-3 accent-[#4ECDC4]"
                />
                <span className="text-xs text-[#4ECDC4]">MA60</span>
              </label>
            </div>
          )}
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">거래량</span>
            <input
              type="checkbox"
              checked={showVolume}
              onChange={toggleVolume}
              className="w-4 h-4 accent-[#58A6FF]"
            />
          </label>
        </div>
        
        <div className="border-t border-[#30363D] my-4"></div>
        
        {/* 테마 설정 */}
        <div className="space-y-3">
          <div className="font-medium text-sm text-[#8B949E] mb-2">색상 테마</div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('upbit')}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                theme === 'upbit' 
                  ? 'bg-[#58A6FF] text-white' 
                  : 'bg-[#21262D] text-[#8B949E]'
              }`}
            >
              업비트
              <div className="text-xs mt-1 opacity-70">상승 빨강</div>
            </button>
            
            <button
              onClick={() => setTheme('binance')}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                theme === 'binance' 
                  ? 'bg-[#58A6FF] text-white' 
                  : 'bg-[#21262D] text-[#8B949E]'
              }`}
            >
              바이낸스
              <div className="text-xs mt-1 opacity-70">상승 초록</div>
            </button>
          </div>
        </div>
        
        <div className="border-t border-[#30363D] my-4"></div>
        
        {/* 저장 버튼 */}
        <button
          onClick={() => {
            // 설정 저장 로직
            onClose();
          }}
          className="w-full py-2 bg-[#58A6FF] rounded text-white font-medium hover:bg-[#4A9EE9]"
        >
          설정 저장
        </button>
      </div>
    </div>
  );
}
