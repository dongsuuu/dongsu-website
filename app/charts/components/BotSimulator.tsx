'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SimulationParams {
  symbol: string;
  timeframe: string;
  strategy: string;
  initialCapital: number;
  startDate: string;
  endDate: string;
  stopLoss: number;
  takeProfit: number;
}

interface Trade {
  timestamp: number;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  pnl?: number;
  pnlPercent?: number;
}

interface SimulationResult {
  finalCapital: number;
  totalReturn: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: { timestamp: number; value: number }[];
  trades: Trade[];
}

// Mock historical data generator
function generateMockData(symbol: string, days: number): { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[] {
  const data = [];
  let price = symbol === 'BTC' ? 65000 : 3500;
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000000;
    
    data.push({ timestamp, open, high, low, close, volume });
    price = close;
  }
  
  return data;
}

// Strategy implementations
function applyStrategy(data: any[], strategy: string, params: any): { signals: { entry: boolean; exit: boolean }[]; indicators: any } {
  const signals = [];
  const indicators: { ema9: number[]; ema21: number[]; rsi: number[]; bbUpper: number[]; bbLower: number[] } = { ema9: [], ema21: [], rsi: [], bbUpper: [], bbLower: [] };
  
  // Calculate indicators
  for (let i = 0; i < data.length; i++) {
    // EMA
    const ema9 = calculateEMA(data.slice(0, i + 1), 9);
    const ema21 = calculateEMA(data.slice(0, i + 1), 21);
    indicators.ema9.push(ema9);
    indicators.ema21.push(ema21);
    
    // RSI
    const rsi = calculateRSI(data.slice(0, i + 1), 14);
    indicators.rsi.push(rsi);
    
    // Bollinger Bands
    const bb = calculateBB(data.slice(0, i + 1), 20);
    indicators.bbUpper.push(bb.upper);
    indicators.bbLower.push(bb.lower);
    
    // Generate signals
    let entry = false;
    let exit = false;
    
    switch (strategy) {
      case 'ema_cross':
        if (i > 0) {
          entry = ema9 > ema21 && indicators.ema9[i-1] <= indicators.ema21[i-1];
          exit = ema9 < ema21 && indicators.ema9[i-1] >= indicators.ema21[i-1];
        }
        break;
      case 'rsi_reversal':
        entry = rsi < 30;
        exit = rsi > 70;
        break;
      case 'bb_breakout':
        entry = data[i].close < bb.lower;
        exit = data[i].close > bb.upper;
        break;
      case 'macd':
        const macd = calculateMACD(data.slice(0, i + 1));
        entry = macd.histogram > 0 && (i > 0 ? macd.histograms[i-1] <= 0 : false);
        exit = macd.histogram < 0 && (i > 0 ? macd.histograms[i-1] >= 0 : false);
        break;
    }
    
    signals.push({ entry, exit });
  }
  
  return { signals, indicators };
}

// Technical indicator calculations
function calculateEMA(data: any[], period: number): number {
  if (data.length < period) return data[data.length - 1]?.close || 0;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(data: any[], period: number): number {
  if (data.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = data[data.length - i].close - data[data.length - i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / (avgLoss || 1);
  return 100 - (100 / (1 + rs));
}

function calculateBB(data: any[], period: number): { upper: number; middle: number; lower: number } {
  if (data.length < period) return { upper: 0, middle: 0, lower: 0 };
  const slice = data.slice(-period);
  const middle = slice.reduce((sum, d) => sum + d.close, 0) / period;
  const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: middle + 2 * std, middle, lower: middle - 2 * std };
}

function calculateMACD(data: any[]): { histogram: number; histograms: number[] } {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA(data.map(d => ({ close: macdLine })), 9);
  const histogram = macdLine - signalLine;
  return { histogram, histograms: data.map(() => histogram) };
}

// Run simulation
function runSimulation(params: SimulationParams): SimulationResult {
  const days = Math.floor((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (24 * 60 * 60 * 1000));
  const data = generateMockData(params.symbol, days);
  const { signals } = applyStrategy(data, params.strategy, params);
  
  let capital = params.initialCapital;
  let position = 0;
  let entryPrice = 0;
  const trades: Trade[] = [];
  const equityCurve: { timestamp: number; value: number }[] = [];
  let maxCapital = capital;
  let maxDrawdown = 0;
  
  for (let i = 0; i < data.length; i++) {
    const candle = data[i];
    const signal = signals[i];
    
    // Check stop loss / take profit
    if (position > 0) {
      const pnlPercent = (candle.low - entryPrice) / entryPrice;
      if (pnlPercent <= -params.stopLoss / 100) {
        // Stop loss hit
        const pnl = position * (entryPrice * (1 - params.stopLoss / 100) - entryPrice);
        capital += position * entryPrice * (1 - params.stopLoss / 100);
        trades.push({
          timestamp: candle.timestamp,
          type: 'sell',
          price: entryPrice * (1 - params.stopLoss / 100),
          amount: position,
          pnl,
          pnlPercent: -params.stopLoss
        });
        position = 0;
      } else if ((candle.high - entryPrice) / entryPrice >= params.takeProfit / 100) {
        // Take profit hit
        const pnl = position * (entryPrice * (1 + params.takeProfit / 100) - entryPrice);
        capital += position * entryPrice * (1 + params.takeProfit / 100);
        trades.push({
          timestamp: candle.timestamp,
          type: 'sell',
          price: entryPrice * (1 + params.takeProfit / 100),
          amount: position,
          pnl,
          pnlPercent: params.takeProfit
        });
        position = 0;
      }
    }
    
    // Entry signal
    if (signal.entry && position === 0) {
      position = capital / candle.close;
      entryPrice = candle.close;
      trades.push({
        timestamp: candle.timestamp,
        type: 'buy',
        price: candle.close,
        amount: position
      });
    }
    
    // Exit signal
    if (signal.exit && position > 0) {
      const pnl = position * (candle.close - entryPrice);
      const pnlPercent = (candle.close - entryPrice) / entryPrice * 100;
      capital += position * candle.close;
      trades.push({
        timestamp: candle.timestamp,
        type: 'sell',
        price: candle.close,
        amount: position,
        pnl,
        pnlPercent
      });
      position = 0;
    }
    
    // Calculate equity
    const equity = capital + (position > 0 ? position * candle.close : 0);
    equityCurve.push({ timestamp: candle.timestamp, value: equity });
    
    // Track max drawdown
    if (equity > maxCapital) maxCapital = equity;
    const drawdown = (maxCapital - equity) / maxCapital;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Close any open position at the end
  if (position > 0) {
    const lastPrice = data[data.length - 1].close;
    const pnl = position * (lastPrice - entryPrice);
    const pnlPercent = (lastPrice - entryPrice) / entryPrice * 100;
    capital += position * lastPrice;
    trades.push({
      timestamp: data[data.length - 1].timestamp,
      type: 'sell',
      price: lastPrice,
      amount: position,
      pnl,
      pnlPercent
    });
  }
  
  const winningTrades = trades.filter(t => t.type === 'sell' && (t.pnl || 0) > 0).length;
  const losingTrades = trades.filter(t => t.type === 'sell' && (t.pnl || 0) <= 0).length;
  const sellTrades = trades.filter(t => t.type === 'sell').length;
  
  return {
    finalCapital: capital,
    totalReturn: (capital - params.initialCapital) / params.initialCapital * 100,
    totalTrades: sellTrades,
    winningTrades,
    losingTrades,
    winRate: sellTrades > 0 ? winningTrades / sellTrades * 100 : 0,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio: calculateSharpeRatio(equityCurve),
    equityCurve,
    trades
  };
}

function calculateSharpeRatio(equityCurve: { value: number }[]): number {
  if (equityCurve.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i].value - equityCurve[i-1].value) / equityCurve[i-1].value);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;
}

export function BotSimulator() {
  const [params, setParams] = useState<SimulationParams>({
    symbol: 'BTC',
    timeframe: '1h',
    strategy: 'ema_cross',
    initialCapital: 10000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    stopLoss: 3,
    takeProfit: 6
  });
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const runBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const simResult = runSimulation(params);
      setResult(simResult);
      setIsRunning(false);
    }, 1000);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  return (
    <div className="bg-[#0D1117] text-[#E6EDF3] p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">🤖 트레이딩 봇 시뮬레이터</h2>
      
      {/* Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-[#8B949E] mb-2">심볼</label>
          <select
            value={params.symbol}
            onChange={(e) => setParams({ ...params, symbol: e.target.value })}
            className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-2"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-[#8B949E] mb-2">전략</label>
          <select
            value={params.strategy}
            onChange={(e) => setParams({ ...params, strategy: e.target.value })}
            className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-2"
          >
            <option value="ema_cross">EMA 크로스</option>
            <option value="rsi_reversal">RSI 반전</option>
            <option value="bb_breakout">볼린저 돌파</option>
            <option value="macd">MACD</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-[#8B949E] mb-2">시작 자본</label>
          <input
            type="number"
            value={params.initialCapital}
            onChange={(e) => setParams({ ...params, initialCapital: Number(e.target.value) })}
            className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm text-[#8B949E] mb-2">손절 %</label>
          <input
            type="number"
            value={params.stopLoss}
            onChange={(e) => setParams({ ...params, stopLoss: Number(e.target.value) })}
            className="w-full bg-[#161B22] border border-[#30363D] rounded px-3 py-2"
          />
        </div>
      </div>
      
      {/* Run Button */}
      <button
        onClick={runBacktest}
        disabled={isRunning}
        className="w-full bg-[#58A6FF] hover:bg-[#4A9AEF] text-white font-bold py-3 rounded mb-6 disabled:opacity-50"
      >
        {isRunning ? '시뮬레이션 실행 중...' : '백테스팅 실행'}
      </button>
      
      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#161B22] p-4 rounded">
              <div className="text-sm text-[#8B949E]">최종 자본</div>
              <div className={`text-xl font-bold ${result.finalCapital >= params.initialCapital ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
                {formatCurrency(result.finalCapital)}
              </div>
            </div>
            
            <div className="bg-[#161B22] p-4 rounded">
              <div className="text-sm text-[#8B949E]">총 수익률</div>
              <div className={`text-xl font-bold ${result.totalReturn >= 0 ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
                {formatPercent(result.totalReturn)}
              </div>
            </div>
            
            <div className="bg-[#161B22] p-4 rounded">
              <div className="text-sm text-[#8B949E]">승률</div>
              <div className="text-xl font-bold text-white">
                {result.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-[#6E7681]">
                {result.winningTrades}승 / {result.losingTrades}패
              </div>
            </div>
            
            <div className="bg-[#161B22] p-4 rounded">
              <div className="text-sm text-[#8B949E]">최대 낙폭</div>
              <div className="text-xl font-bold text-[#2988D9]">
                {result.maxDrawdown.toFixed(2)}%
              </div>
            </div>
          </div>
          
          {/* Equity Curve Chart */}
          <div className="bg-[#161B22] p-4 rounded">
            <h3 className="text-lg font-bold mb-4">자본 곡선</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.equityCurve}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58A6FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#58A6FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                  stroke="#6E7681"
                />
                <YAxis stroke="#6E7681" tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}
                  formatter={(v) => formatCurrency(Number(v))}
                  labelFormatter={(ts) => new Date(Number(ts)).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#58A6FF" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Trade History */}
          <div className="bg-[#161B22] p-4 rounded">
            <h3 className="text-lg font-bold mb-4">거래 내역 (최근 10건)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#8B949E] border-b border-[#30363D]">
                    <th className="text-left py-2">시간</th>
                    <th className="text-left py-2">유형</th>
                    <th className="text-right py-2">가격</th>
                    <th className="text-right py-2">수량</th>
                    <th className="text-right py-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.filter(t => t.type === 'sell').slice(-10).map((trade, i) => (
                    <tr key={i} className="border-b border-[#21262D]">
                      <td className="py-2">{new Date(trade.timestamp).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${trade.pnl && trade.pnl > 0 ? 'bg-[#E15241]/20 text-[#E15241]' : 'bg-[#2988D9]/20 text-[#2988D9]'}`}>
                          {trade.pnl && trade.pnl > 0 ? '익절' : '손절'}
                        </span>
                      </td>
                      <td className="text-right py-2">${trade.price.toFixed(2)}</td>
                      <td className="text-right py-2">{trade.amount.toFixed(4)}</td>
                      <td className={`text-right py-2 ${trade.pnl && trade.pnl > 0 ? 'text-[#E15241]' : 'text-[#2988D9]'}`}>
                        {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Deploy Button */}
          <button className="w-full bg-[#238636] hover:bg-[#2EA043] text-white font-bold py-3 rounded">
            이 전략으로 실제 봇 배포하기
          </button>
        </div>
      )}
    </div>
  );
}
