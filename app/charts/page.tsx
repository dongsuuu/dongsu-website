import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Crypto Charts | dongsu',
  description: 'Real-time cryptocurrency charts with live data from Binance',
};

// 클라이언트 전용 로딩
const CryptoChartAdvanced = dynamic(
  () => import('@/components/CryptoChartAdvanced'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-[480px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="h-8 bg-slate-700 rounded w-full"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }
);

// TOP 10 코인
const TOP_COINS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT'
];

// 트렌딩 코인
const TRENDING_COINS = [
  'PEPEUSDT', 'SHIBUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT'
];

export default function ChartsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Live Crypto <span className="text-blue-400">Charts</span>
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Real-time cryptocurrency charts powered by Binance. 
          Track market leaders and trending coins with professional-grade tools.
        </p>
      </section>

      {/* Featured Charts - BTC & ETH */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-500 rounded"></span>
          Major Coins
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <CryptoChartAdvanced symbol="BTCUSDT" height={350} defaultInterval="1h" />
          <CryptoChartAdvanced symbol="ETHUSDT" height={350} defaultInterval="1h" />
        </div>
      </section>

      {/* Top 10 Market Cap */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-green-500 rounded"></span>
          Top 10 by Market Cap
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {TOP_COINS.slice(2).map((symbol) => (
            <CryptoChartAdvanced 
              key={symbol} 
              symbol={symbol} 
              height={300} 
              defaultInterval="4h"
            />
          ))}
        </div>
      </section>

      {/* Trending Coins */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-purple-500 rounded"></span>
          🔥 Trending Now
        </h2>
        
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {TRENDING_COINS.map((symbol) => (
            <CryptoChartAdvanced 
              key={symbol} 
              symbol={symbol} 
              height={280} 
              defaultInterval="1h"
            />
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
          <h3 className="font-semibold mb-2">⚠️ Disclaimer</h3>
          <p className="text-slate-400 text-sm">
            Cryptocurrency prices are highly volatile. This data is for informational purposes only 
            and should not be considered as financial advice. Always do your own research before 
            making investment decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
