import { Agent } from '@/lib/types';
import { fallbackAgents } from '@/lib/fallbackData';
import AgentsClientPage from './AgentsClientPage';

async function getAgents(): Promise<Agent[]> {
  try {
    // Use environment variable to control external data fetching
    const useExternal = process.env.USE_EXTERNAL_DATA === 'true';
    
    if (!useExternal) {
      console.log('Using fallback data (USE_EXTERNAL_DATA=false)');
      return fallbackAgents;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/agents`, { 
      next: { revalidate: 60 }
    });
    
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.data?.agents || fallbackAgents;
  } catch (error) {
    console.error('Error fetching agents:', error);
    return fallbackAgents;
  }
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return <AgentsClientPage agents={agents} />;
}
