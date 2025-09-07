/**
 * Types for Automated SWOT Analysis Engine
 */

export interface SWOTAnalysisRequest {
  businessId: string;
  businessName: string;
  businessCategory: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  reviewTexts: ReviewText[];
  images: ImageData[];
  platformData?: PlatformMetrics[];
  analysisOptions?: AnalysisOptions;
}

export interface ReviewText {
  id: string;
  platform: 'google' | 'yelp' | 'tripadvisor' | 'facebook' | 'instagram';
  text: string;
  rating: number;
  date: string;
  language?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  verified?: boolean;
}

export interface ImageData {
  id: string;
  url: string;
  platform: 'google' | 'instagram' | 'facebook' | 'website';
  type: 'food' | 'interior' | 'exterior' | 'staff' | 'menu' | 'other';
  uploadDate: string;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    format?: string;
  };
}

export interface PlatformMetrics {
  platform: string;
  followers?: number;
  posts?: number;
  engagement?: number;
  reviews?: {
    count: number;
    averageRating: number;
    recentReviews?: ReviewText[];
  };
  photos?: {
    count: number;
    recentPhotos?: ImageData[];
  };
  lastUpdated: string;
}

export interface AnalysisOptions {
  includeImageAnalysis: boolean;
  includeSentimentAnalysis: boolean;
  includeCompetitorComparison: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  language: 'de' | 'en';
  businessContext?: {
    yearsInBusiness?: number;
    employeeCount?: number;
    averagePrice?: number;
    specialties?: string[];
  };
}

export interface SWOTAnalysisResult {
  requestId: string;
  businessId: string;
  analysisDate: string;
  swotAnalysis: {
    strengths: SWOTItem[];
    weaknesses: SWOTItem[];
    opportunities: SWOTItem[];
    threats: SWOTItem[];
  };
  insights: BusinessInsight[];
  actionRecommendations: ActionRecommendation[];
  visualizations: SWOTVisualization[];
  dataQuality: DataQualityMetrics;
  processingTime: number;
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
    analysisEngine: string;
    textAnalysisCount: number;
    imageAnalysisCount: number;
    totalSWOTItems: number;
    totalRecommendations: number;
    totalVisualizations: number;
    // Degraded success tracking
    usedFallback: boolean;
    failedImages: number;
    failedReviews: number;
    errorKinds?: string[];
    partialSuccess?: boolean;
  };
}

export interface SWOTItem {
  id: string;
  category: 'operational' | 'marketing' | 'financial' | 'strategic' | 'customer' | 'competitive';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  evidence: Evidence[];
  relatedItems?: string[]; // IDs of related SWOT items
}

export interface SWOTItemWithType extends SWOTItem {
  swotType: 'strength' | 'weakness' | 'opportunity' | 'threat';
}

export interface Evidence {
  type: 'review' | 'image' | 'metric' | 'trend';
  source: string;
  data: any;
  relevanceScore: number; // 0-1
  extractedAt: string;
}

export interface BusinessInsight {
  id: string;
  type: 'trend' | 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  supportingEvidence: Evidence[];
}

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'marketing' | 'operations' | 'customer-service' | 'digital-presence' | 'competitive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  timeframe: string;
  estimatedCost?: string;
  expectedROI?: string;
  steps: string[];
  relatedSWOTItems: string[];
  successMetrics: string[];
}

export interface SWOTVisualization {
  type: 'matrix' | 'chart' | 'heatmap' | 'network' | 'timeline';
  title: string;
  description: string;
  data: any;
  config: {
    width?: number;
    height?: number;
    colors?: string[];
    interactive?: boolean;
    // Domain-neutral extensions
    responsive?: boolean;
    exportable?: boolean;
    tooltip?: boolean;
    legend?: boolean;
  };
  // Vendor-specific configuration
  vendorConfig?: {
    library: 'chartjs' | 'echarts' | 'recharts' | 'custom';
    chartType?: string;
    options?: unknown;
  };
}

export interface DataQualityMetrics {
  reviewCoverage: number; // 0-1
  imageCoverage: number; // 0-1
  dataFreshness: number; // 0-1
  sentimentAccuracy: number; // 0-1
  overallQuality: number; // 0-1
  limitations: string[];
  recommendations: string[];
}

export interface TextAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keyPhrases: string[];
  entities: {
    name: string;
    type: string;
    confidence: number;
  }[];
  themes: {
    theme: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
}

export interface ImageAnalysisResult {
  labels: {
    name: string;
    confidence: number;
    category: string;
  }[];
  quality: {
    brightness: number;
    contrast: number;
    sharpness: number;
    composition: number;
    overall: number;
  };
  content: {
    hasFood: boolean;
    hasInterior: boolean;
    hasExterior: boolean;
    hasPeople: boolean;
    hasMenu: boolean;
  };
  emotions?: {
    emotion: string;
    confidence: number;
  }[];
}

export interface LocationAnalysisResult {
  marketSize: 'small' | 'medium' | 'large';
  competitionLevel: 'low' | 'medium' | 'high';
  demographics: {
    ageGroups: { [key: string]: number };
    incomeLevel: 'low' | 'medium' | 'high';
    lifestyle: string[];
  };
  trends: {
    trend: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    impact: 'low' | 'medium' | 'high';
  }[];
}

// AnalysisError moved to errors.ts
export type { AnalysisError } from './errors';