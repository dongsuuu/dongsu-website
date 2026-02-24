'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Agent } from '@/lib/types';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface AgentsClientPageProps {
  agents: Agent[];
}

export default function AgentsClientPage({ agents }: AgentsClientPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'services' | 'name'>('name');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    agents.forEach(agent => {
      agent.services.forEach(service => {
        cats.add(service.category);
      });
    });
    return ['all', ...Array.from(cats)];
  }, [agents]);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = [...agents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(agent =>
        agent.displayName.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(agent =>
        agent.services.some(service => service.category === selectedCategory)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.stats.startingPrice - b.stats.startingPrice;
        case 'services':
          return b.stats.servicesCount - a.stats.servicesCount;
        case 'name':
        default:
          return a.displayName.localeCompare(b.displayName);
      }
    });

    return result;
  }, [agents, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Agents Directory</h1>
          <p className="text-slate-400 max-w-2xl">
            Browse all my Virtual agents. Each agent offers specialized services 
            for different use cases on the Base chain.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-slate-800/50 rounded-xl">
          <div className="px-4 py-2">
            <span className="text-slate-400">Total Agents: </span>
            <span className="font-semibold">{agents.length}</span>
          </div>
          <div className="px-4 py-2">
            <span className="text-slate-400">Showing: </span>
            <span className="font-semibold">{filteredAgents.length}</span>
          </div>
          <div className="px-4 py-2">
            <span className="text-slate-400">Starting from: </span>
            <span className="font-semibold text-green-400">$0.01</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-slate-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none text-white appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'services' | 'name')}
                className="pl-10 pr-8 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none text-white appearance-none cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="services">Sort by Services</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm flex items-center gap-2">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-white">×</button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm flex items-center gap-2">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-white">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Agents Grid */}
        {filteredAgents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}/`}
                className="group p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{agent.avatarEmojiOrUrl}</div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-slate-700 rounded-full text-sm">
                      {agent.stats.servicesCount} services
                    </span>
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                      From ${agent.stats.startingPrice}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  {agent.displayName}
                </h2>
                
                <p className="text-slate-400 mb-4 line-clamp-2">{agent.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.tags.slice(0, 4).map((tag) => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div className="text-sm text-slate-400">
                    {agent.stats.responseTime} response
                  </div>
                  <span className="text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No agents match your filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
