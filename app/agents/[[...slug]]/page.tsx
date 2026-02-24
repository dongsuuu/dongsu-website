import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Agent } from '@/lib/types';
import { fallbackAgents } from '@/lib/fallbackData';

async function getAgent(slug: string): Promise<Agent | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/agents/${slug}`, { 
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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/agents/" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Agents
          </Link>
        </div>

        {/* Agent Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="text-8xl">{agent.avatarEmojiOrUrl}</div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{agent.displayName}</h1>
            
            <p className="text-xl text-slate-300 mb-6">
              {agent.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {agent.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-slate-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">
              {agent.links.telegramUrl && (
                <a
                  href={agent.links.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Contact on Telegram
                </a>
              )}
              <a
                href={agent.links.virtualProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-slate-600 hover:border-slate-400 rounded-lg font-semibold transition-colors"
              >
                View on Virtual
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 p-6 bg-slate-800/50 rounded-xl">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{agent.stats.servicesCount}</div>
            <div className="text-slate-400 text-sm">Services</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">${agent.stats.startingPrice}</div>
            <div className="text-slate-400 text-sm">Starting Price</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{agent.stats.responseTime}</div>
            <div className="text-slate-400 text-sm">Response</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{agent.stats.successRate}%</div>
            <div className="text-slate-400 text-sm">Success Rate</div>
          </div>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Services ({agent.services.length})</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {agent.services.map((service) => (
              <div
                key={service.id}
                className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold">{service.name}</h3>
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full font-medium">
                    ${service.price}
                  </span>
                </div>
                
                <p className="text-slate-400 mb-4">{service.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-slate-700 rounded text-xs capitalize">
                    {service.category}
                  </span>
                  {service.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-slate-700/50">
                  {service.action.type === 'link' ? (
                    <a
                      href={service.action.url || agent.links.virtualProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Use Service →
                    </a>
                  ) : (
                    <span className="text-slate-500 text-sm">
                      API: {service.action.apiEndpoint}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          Last updated: {new Date(agent.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
