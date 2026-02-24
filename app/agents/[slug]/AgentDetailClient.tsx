'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Agent, Service } from '@/lib/types';
import { ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AgentDetailClientProps {
  agent: Agent;
}

export default function AgentDetailClient({ agent }: AgentDetailClientProps) {
  const [apiLoading, setApiLoading] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<{ serviceId: string; data: any } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleApiCall = async (service: Service) => {
    if (!service.action.apiEndpoint) return;
    
    setApiLoading(service.id);
    setApiError(null);
    setApiResult(null);

    try {
      // Simulate API call - replace with actual endpoint
      const response = await fetch(service.action.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service: service.name,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('API call failed');
      
      const data = await response.json();
      setApiResult({ serviceId: service.id, data });
    } catch (error) {
      // Demo mode: show simulated result
      setTimeout(() => {
        setApiResult({
          serviceId: service.id,
          data: {
            status: 'success',
            message: `${service.name} API demo`,
            timestamp: new Date().toISOString(),
            note: 'This is a demo. Connect to actual API for production.'
          }
        });
        setApiLoading(null);
      }, 1000);
    } finally {
      setApiLoading(null);
    }
  };

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
            
            <p className="text-xl text-slate-300 mb-6">{agent.description}</p>
            
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
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  Contact on Telegram
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <a
                href={agent.links.virtualProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-slate-600 hover:border-slate-400 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
              >
                View on Virtual
                <ExternalLink className="w-4 h-4" />
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
                className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl"
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
                
                {/* Use Now Button */}
                <div className="pt-4 border-t border-slate-700/50">
                  {service.action.type === 'link' ? (
                    <a
                      href={service.action.url || agent.links.virtualProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors w-full justify-center gap-2"
                    >
                      Use Service
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleApiCall(service)}
                        disabled={apiLoading === service.id}
                        className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg font-semibold transition-colors w-full justify-center gap-2"
                      >
                        {apiLoading === service.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Call API</>
                        )}
                      </button>
                      
                      {apiResult?.serviceId === service.id && (
                        <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                          <div className="flex items-center gap-2 text-green-400 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">API Response</span>
                          </div>
                          <pre className="text-sm text-slate-300 overflow-x-auto">
                            {JSON.stringify(apiResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {apiError && (
                        <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center gap-2 text-red-400">
                          <AlertCircle className="w-5 h-5" />
                          <span>{apiError}</span>
                        </div>
                      )}
                    </div>
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
