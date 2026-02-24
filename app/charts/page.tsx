import { Metadata } from 'next';
import { ChartsLayout } from './components/ChartsLayout';

export const metadata: Metadata = {
  title: 'Pro Charts | dongsu',
  description: 'Professional real-time cryptocurrency trading charts',
};

export default function ChartsPage() {
  return <ChartsLayout />;
}
