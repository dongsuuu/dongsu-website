import { NextResponse } from 'next/server';
import { Agent, ApiResponse, AgentDetailResponse } from '@/lib/types';
import { fallbackAgents } from '@/lib/fallbackData';

interface CacheEntry {
  data: AgentDetailResponse;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchAgentFromExternal(slug: string): Promise<Agent | null> {
  try {
    const externalUrl = process.env.VIRTUAL_API_URL;
    
    if (!externalUrl) {
      console.log('No external API URL configured');
      return null;
    }

    const response = await fetch(`${externalUrl}/agents/${slug}`, {
      headers: {
        'Authorization': `Bearer ${process.env.VIRTUAL_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('External API error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch agent from external source:', error);
    return null;
  }
}

function getCachedAgent(slug: string): Agent | null {
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data.agent;
  }
  return null;
}

function setCachedAgent(slug: string, agent: Agent): void {
  cache.set(slug, {
    data: { agent },
    fetchedAt: Date.now(),
  });
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  try {
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Agent slug is required',
      } as ApiResponse<never>, { status: 400 });
    }

    // 1. Try cache
    const cached = getCachedAgent(slug);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: { agent: cached },
        cached: true,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<AgentDetailResponse>, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    // 2. Try external source
    const externalAgent = await fetchAgentFromExternal(slug);
    
    if (externalAgent) {
      setCachedAgent(slug, externalAgent);
      return NextResponse.json({
        success: true,
        data: { agent: externalAgent },
        cached: false,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<AgentDetailResponse>, {
        headers: {
          'X-Cache': 'MISS',
        },
      });
    }

    // 3. Try fallback
    const fallbackAgent = fallbackAgents.find(a => a.slug === slug);
    
    if (fallbackAgent) {
      setCachedAgent(slug, fallbackAgent);
      return NextResponse.json({
        success: true,
        data: { agent: fallbackAgent },
        cached: false,
        fallback: true,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<AgentDetailResponse>, {
        headers: {
          'X-Cache': 'MISS',
          'X-Data-Source': 'fallback',
        },
      });
    }

    // 4. Not found
    return NextResponse.json({
      success: false,
      error: `Agent with slug "${slug}" not found`,
    } as ApiResponse<never>, { status: 404 });

  } catch (error) {
    console.error('API error:', error);
    
    // Try fallback on error
    const fallbackAgent = fallbackAgents.find(a => a.slug === params.slug);
    
    if (fallbackAgent) {
      return NextResponse.json({
        success: true,
        data: { agent: fallbackAgent },
        cached: false,
        fallback: true,
        warning: 'Using fallback data due to error',
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<AgentDetailResponse>, {
        headers: {
          'X-Cache': 'ERROR',
          'X-Data-Source': 'fallback',
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse<never>, { status: 500 });
  }
}
