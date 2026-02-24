import { NextResponse } from 'next/server';
import { Evaluation, ApiResponse, EvaluationsListResponse } from '@/lib/types';
import { fallbackEvaluations } from '@/lib/fallbackData';

interface CacheEntry {
  data: EvaluationsListResponse;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchEvaluationsFromExternal(): Promise<Evaluation[] | null> {
  try {
    const externalUrl = process.env.VIRTUAL_API_URL;
    
    if (!externalUrl) {
      console.log('No external API URL configured');
      return null;
    }

    const response = await fetch(`${externalUrl}/evaluations`, {
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
    console.error('Failed to fetch evaluations from external source:', error);
    return null;
  }
}

function getCachedEvaluations(): EvaluationsListResponse | null {
  const cached = cache.get('evaluations');
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedEvaluations(data: EvaluationsListResponse): void {
  cache.set('evaluations', {
    data,
    fetchedAt: Date.now(),
  });
}

export async function GET(): Promise<NextResponse> {
  try {
    // 1. Try cache
    const cached = getCachedEvaluations();
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<EvaluationsListResponse>, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    // 2. Try external source
    const externalData = await fetchEvaluationsFromExternal();
    
    if (externalData) {
      const response: EvaluationsListResponse = {
        evaluations: externalData,
      };
      setCachedEvaluations(response);
      return NextResponse.json({
        success: true,
        data: response,
        cached: false,
        fetchedAt: new Date().toISOString(),
      } as ApiResponse<EvaluationsListResponse>, {
        headers: {
          'X-Cache': 'MISS',
        },
      });
    }

    // 3. Return fallback
    const fallbackData: EvaluationsListResponse = {
      evaluations: fallbackEvaluations,
    };

    setCachedEvaluations(fallbackData);

    return NextResponse.json({
      success: true,
      data: fallbackData,
      cached: false,
      fallback: true,
      fetchedAt: new Date().toISOString(),
    } as ApiResponse<EvaluationsListResponse>, {
      headers: {
        'X-Cache': 'MISS',
        'X-Data-Source': 'fallback',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    
    // Return fallback on error
    const fallbackData: EvaluationsListResponse = {
      evaluations: fallbackEvaluations,
    };

    return NextResponse.json({
      success: true,
      data: fallbackData,
      cached: false,
      fallback: true,
      warning: 'Using fallback data due to error',
      fetchedAt: new Date().toISOString(),
    } as ApiResponse<EvaluationsListResponse>, {
      status: 200,
      headers: {
        'X-Cache': 'ERROR',
        'X-Data-Source': 'fallback',
      },
    });
  }
}
