import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Real-time Crypto Charts | dongsu',
  description: 'Real-time cryptocurrency charts with Coinbase Pro WebSocket',
};

// 클라이언트 전용 로딩
const RealtimeChart = dynamic(
  () => import('@/components/RealtimeChart'),
  { ssr: false }
);

const COINS = [
  { id: 'bitcoin', symbol: 'BTCUSDT', name: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETHUSDT', name: 'Ethereum', color: '#627EEA' },
  { id: 'binancecoin', symbol: 'BNBUSDT', name: 'BNB', color: '#F3BA2F' },
  { id: 'solana', symbol: 'SOLUSDT', name: 'Solana', color: '#00FFA3' },
  { id: 'ripple', symbol: 'XRPUSDT', name: 'XRP', color: '#23292F' },
  { id: 'cardano', symbol: 'ADAUSDT', name: 'Cardano', color: '#0033AD' },
  { id: 'dogecoin', symbol: 'DOGEUSDT', name: 'Dogecoin', color: '#C2A633' },
  { id: 'avalanche-2', symbol: 'AVAXUSDT', name: 'Avalanche', color: '#E84142' },
  { id: 'chainlink', symbol: 'LINKUSDT', name: 'Chainlink', color: '#2A5ADA' },
  { id: 'polkadot', symbol: 'DOTUSDT', name: 'Polkadot', color: '#E6007A' },
];

export default function ChartsPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Real-time Crypto <span className="text-blue-400">Charts</span>
        </h1>
        <p className="text-slate-400">Live price updates via Coinbase Pro WebSocket</p>
      </section>

      <section className="container mx-auto px-4 py-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-6">
          {COINS.slice(0, 4).map((coin) => (
            <RealtimeChart 
              key={coin.symbol}
              symbol={coin.symbol}
              coin={coin}
              height={400}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
