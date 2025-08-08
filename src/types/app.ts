export type UserPlan = 'basic' | 'business' | 'premium';
export type AIStatus = 'ready' | 'busy' | 'error' | 'maintenance';

export interface User {
  id: string;
  email: string;
  name?: string;
  plan: UserPlan;
  usedAnalyses: number;
  totalAnalyses: number | 'unlimited';
}

export interface UsageData {
  used: number;
  total: number | 'unlimited';
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

export interface RestaurantFormData {
  restaurantName: string;
  address: string;
  mainCategory: string;
  priceRange: string;
}

export interface WebsiteAnalysisFormData {
  website?: string;
  email: string;
  emailConfirmed: boolean;
  benchmarks: {
    local: boolean;
    regional: boolean;
    national: boolean;
  };
}

export type UserType = 'guest' | 'registered';

export interface GuestCodeInfo {
  code: string;
  planType: 'basic' | 'premium';
  referrerName: string;
  isValid: boolean;
}