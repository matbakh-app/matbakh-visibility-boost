export type UserPlan = 'basic' | 'business' | 'premium';

export interface User {
  id: string;
  email: string;
  name?: string;
  plan: UserPlan;
  usedAnalyses: number;
  totalAnalyses: number | 'unlimited';
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  website?: string;
  phone?: string;
  cuisine: string;
  rating?: number;
  reviewCount?: number;
}

export interface AnalysisResult {
  id: string;
  restaurantId: string;
  score: number;
  status: 'success' | 'warning' | 'error' | 'info';
  platform: string;
  description: string;
  recommendations: string[];
  createdAt: Date;
}

export interface VisibilityData {
  google: {
    score: number;
    status: 'good' | 'warning' | 'poor';
    issues: string[];
  };
  facebook: {
    score: number;
    status: 'good' | 'warning' | 'poor';
    issues: string[];
  };
  instagram: {
    score: number;
    status: 'good' | 'warning' | 'poor';
    issues: string[];
  };
  overall: {
    score: number;
    trend: 'up' | 'down' | 'stable';
  };
}