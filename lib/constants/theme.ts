// 테마 색상 - Upbit 스타일 (상승 빨강, 하락 파랑)
export const THEME = {
  // 상승/하락
  up: '#E15241',      // 빨강 (Upbit/Korean style)
  down: '#2988D9',    // 파랑
  
  // 또는 Binance 스타일 (상승 초록, 하락 빨강)
  // up: '#0ECB81',
  // down: '#F6465D',
  
  // 배경
  bg: {
    primary: '#0D1117',    // 메인 배경
    secondary: '#161B22',  // 카드/패널 배경
    tertiary: '#21262D',   // 호버/강조 배경
  },
  
  // 테두리
  border: {
    default: '#30363D',
    hover: '#8B949E',
    active: '#58A6FF',
  },
  
  // 텍스트
  text: {
    primary: '#E6EDF3',    // 주요 텍스트
    secondary: '#8B949E',  // 보조 텍스트
    muted: '#6E7681',      // 비활성/힌트
  },
  
  // 상태
  status: {
    success: '#238636',
    warning: '#F0883E',
    error: '#DA3633',
    info: '#58A6FF',
  },
  
  // 차트
  chart: {
    grid: 'rgba(48, 54, 61, 0.5)',
    crosshair: '#58A6FF',
    ma7: '#FFD700',   // 노랑
    ma25: '#FF6B6B',  // 분홍
    ma60: '#4ECDC4',  // 청록
    volume: 'rgba(88, 166, 255, 0.3)',
  },
} as const;

// 간격 시스템
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const;

// 폰트 크기
export const FONT_SIZE = {
  xs: '11px',
  sm: '12px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
} as const;
