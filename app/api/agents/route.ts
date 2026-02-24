import { NextResponse } from 'next/server';
import { Agent, ApiResponse, AgentsListResponse } from '@/lib/types';
import { fallbackAgents } from '@/lib/fallbackData';

// Simple in-memory cache
interface CacheEntry {
  data: AgentsListResponse;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchFromExternalSource(): Promise<AgentsListResponse | null> {
  try {
    // Attempt to fetch from external Virtual/ACP source
    // Replace with actual endpoint when available
    const externalUrl = process.env.VIRTUAL_API_URL;
    
    if (!externalUrl) {
      console.log('No external API URL configured, using fallback');
      return null;
    }

    const response = await fetch(`${externalUrl}/agents`, {
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

    const data = await response.json();
    return { agents: data.agents || [], total: data.total || 0 };
  } catch (error) {
    console.error('Failed to fetch from external source:', error);
    return null;
  }
}

function getCachedData(): AgentsListResponse | null {
  const cached = cache.get('agents');
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(data: AgentsListResponse): void {
  cache.set('agents', {
    data,
    fetchedAt: Date.now(),
  });
}

export async function GET(): Promise<NextResponse> {
  try {
    // 1. Try to get cached data
    const cached = getCachedData();
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<AgentsListResponse>, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': `${Math.floor((Date.now() - cache.get('agents')!.fetchedAt) / 1000)}s`,
        },
      });
    }

    // 2. Try to fetch from external source
    const externalData = await fetchFromExternalSource();
    
    if (externalData) {
      setCachedData(externalData);
      return NextResponse.json({
        success: true,
        data: externalData,
        cached: false,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<AgentsListResponse>, {
        headers: {
          'X-Cache': 'MISS',
        },
      });
    }

    // 3. Return fallback data
    const fallbackData: AgentsListResponse = {
      agents: fallbackAgents,
      total: fallbackAgents.length,
    };

    setCachedData(fallbackData);

    return NextResponse.json({
      success: true,
      data: fallbackData,
      cached: false,
      fallback: true,
      fetchedAt: new Date().toISOString(),
    } as ApiResponse<AgentsListResponse>, {
      headers: {
        'X-Cache': 'MISS',
        'X-Data-Source': 'fallback',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    
    // Return fallback on error
    const fallbackData: AgentsListResponse = {
      agents: fallbackAgents,
      total: fallbackAgents.length,
    };

    return NextResponse.json({
      success: true,
      data: fallbackData,
      cached: false,
      fallback: true,
      warning: 'Using fallback data due to error',
      fetchedAt: new Date().toISOString(),
    } as ApiResponse<AgentsListResponse>, {
      status: 200,
      headers: {
        'X-Cache': 'ERROR',
        'X-Data-Source': 'fallback',
      },
    });
  }
}
