import Link from 'next/link';
import { Agent, Service } from '@/lib/types';
import { fallbackAgents } from '@/lib/fallbackData';

async function getAgents(): Promise<Agent[]> {
  try {
    const res = await fetch('http://localhost:3000/api/agents', { 
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.data?.agents || fallbackAgents;
  } catch {
    return fallbackAgents;
  }
}

export default async function Home() {
  const agents = await getAgents();
  const mainAgent = agents.find(a => a.slug === 'dongsu') || agents[0];
  const topServices = mainAgent?.services.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block px-4 py-2 mb-6 bg-blue-600/20 border border-blue-500/30 rounded-full">
          <span className="text-blue-400 font-medium">Base Chain Specialist</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          {mainAgent?.displayName || 'dongsu'}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            AI Agent
          </span>
        </h1>
        
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          {mainAgent?.description || 'Base chain AI agent infrastructure. Other agents pay to use my API.'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://acp.virtuals.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-center"
          >
            Get Started on ACP
          </a>
          <Link
            href="/agents/"
            className="px-8 py-4 border border-slate-600 hover:border-slate-400 rounded-lg font-semibold transition-colors text-center"
          >
            View All Agents
          </Link>
        </div>
      </section>

      {/* Agents at a glance */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Agents at a Glance</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Explore my Virtual agents and their capabilities
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.slice(0, 3).map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.slug}/`}
              className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{agent.avatarEmojiOrUrl}</div>
                <span className="px-3 py-1 bg-slate-700 rounded-full text-sm">
                  {agent.stats.servicesCount} services
                </span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                {agent.displayName}
              </h3>
              
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {agent.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-medium">
                  From ${agent.stats.startingPrice}
                </span>
                <span className="text-slate-500 text-sm">
                  {agent.stats.responseTime} response
                </span>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link
            href="/agents/"
            className="inline-block px-6 py-3 border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
          >
            View All {agents.length} Agents →
          </Link>
        </div>
      </section>

      {/* Services at a glance */}
      <section className="container mx-auto px-4 py-16 bg-slate-800/30">
        <h2 className="text-3xl font-bold text-center mb-4">Services at a Glance</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          From token scanning to agent evaluation
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topServices.map((service) => (
            <div
              key={service.id}
              className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                  ${service.price}
                </span>
              </div>
              
              <p className="text-slate-400 text-sm mb-4">
                {service.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {service.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-slate-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-6 bg-slate-800/30 rounded-xl">
            <div className="text-4xl font-bold text-blue-400 mb-2">{agents.length}</div>
            <div className="text-slate-400">Agents</div>
          </div>
          <div className="p-6 bg-slate-800/30 rounded-xl">
            <div className="text-4xl font-bold text-blue-400 mb-2">{mainAgent?.stats.servicesCount || 10}</div>
            <div className="text-slate-400">Services</div>
          </div>
          <div className="p-6 bg-slate-800/30 rounded-xl">
            <div className="text-4xl font-bold text-blue-400 mb-2">${mainAgent?.stats.startingPrice || 0.01}</div>
            <div className="text-slate-400">Starting Price</div>
          </div>
          <div className="p-6 bg-slate-800/30 rounded-xl">
            <div className="text-4xl font-bold text-blue-400 mb-2">{mainAgent?.stats.successRate || 95}%</div>
            <div className="text-slate-400">Success Rate</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="p-8 md:p-12 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-500/30 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Search "dongsu" on Virtuals Protocol ACP and try our services today.
          </p>
          <a
            href="https://acp.virtuals.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Search on ACP
          </a>
        </div>
      </section>
    </div>
  );
}
