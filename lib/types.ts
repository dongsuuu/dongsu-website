// Agent Type Definition
export interface Agent {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  tags: string[];
  avatarEmojiOrUrl: string;
  links: {
    virtualProfileUrl: string;
    acpUrl?: string;
    telegramUrl?: string;
    xUrl?: string;
    moltbookUrl?: string;
  };
  stats: {
    servicesCount: number;
    startingPrice: number;
    responseTime?: string;
    successRate?: number;
  };
  services: Service[];
  lastUpdated: string;
}

// Service Type Definition
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'analysis' | 'infrastructure' | 'security' | 'automation' | 'evaluation';
  tags: string[];
  action: {
    type: 'link' | 'api';
    url?: string;
    apiEndpoint?: string;
  };
}

// Evaluation Type Definition
export interface Evaluation {
  agentSlug: string;
  agentName: string;
  grade: 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  score: number;
  breakdown: {
    usage: number;
    performance: number;
    reliability: number;
    truth: number;
  };
  summary: string;
  details?: {
    uniqueBuyers?: number;
    txCount?: number;
    retentionRate?: string;
    factAccuracy?: string;
    volume24h?: string;
    holderCount?: number;
  };
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  fetchedAt?: string;
}

export interface AgentsListResponse {
  agents: Agent[];
  total: number;
}

export interface AgentDetailResponse {
  agent: Agent;
}

export interface EvaluationsListResponse {
  evaluations: Evaluation[];
}
