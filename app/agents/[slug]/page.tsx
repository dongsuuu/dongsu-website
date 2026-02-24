import { notFound } from 'next/navigation';
import { Agent } from '@/lib/types';
import { fallbackAgents } from '@/lib/fallbackData';
import AgentDetailClient from './AgentDetailClient';

async function getAgent(slug: string): Promise<Agent | null> {
  try {
    const useExternal = process.env.USE_EXTERNAL_DATA === 'true';
    
    if (!useExternal) {
      return fallbackAgents.find(a => a.slug === slug) || null;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/agents/${slug}`, { 
      next: { revalidate: 60 }
    });
    
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.data?.agent || null;
  } catch {
    return fallbackAgents.find(a => a.slug === slug) || null;
  }
}

export default async function AgentDetailPage({ params }: { params: { slug: string } }) {
  const agent = await getAgent(params.slug);

  if (!agent) {
    notFound();
  }

  return <AgentDetailClient agent={agent} />;
}
