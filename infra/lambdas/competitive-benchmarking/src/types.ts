import { z } from 'zod';

// Core competitor data structure
export const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  category: z.string(),
  subcategory: z.string().optional(),
  distance: z.number(), // in meters
  discoveredAt: z.string(), // ISO timestamp
  lastUpdated: z.string(), // ISO timestamp
  status: z.enum(['active', 'inactive', 'closed', 'unknown']),
  confidence: z.number().min(0).max(1), // confidence in data accuracy
  sources: z.array(z.string()) // data sources used
});

export type Competitor = z.infer<typeof CompetitorSchema>;

// Platform-specific metrics
export const PlatformMetricsSchema = z.object({
  platform: z.enum(['google', 'instagram', 'facebook', 'yelp', 'tripadvisor']),
  profileUrl: z.string().optional(),
  isVerified: z.boolean(),
  followers: z.number().optional(),
  posts: z.number().optional(),
  reviews: z.object({
    count: z.number(),
    averageRating: z.number().min(0).max(5),
    recentReviews: z.array(z.object({
      rating: z.number().min(0).max(5),
      text: z.string(),
      date: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']).optional()
    })).optional()
  }).optional(),
  photos: z.object({
    count: z.number(),
    recentPhotos: z.array(z.string()).optional() // URLs
  }).optional(),
  businessHours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional()
  }).optional(),
  priceLevel: z.number().min(1).max(4).optional(), // 1=$ to 4=$$$$
  features: z.array(z.string()).optional(), // delivery, takeout, etc.
  lastScraped: z.string(), // ISO timestamp
  scrapingErrors: z.array(z.string()).optional()
});

export type PlatformMetrics = z.infer<typeof PlatformMetricsSchema>;

// Strategic Analysis Frameworks
export const SWOTAnalysisSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string())
});

export const PortersFiveForcesSchema = z.object({
  competitiveRivalry: z.object({
    intensity: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
    score: z.number().min(0).max(100)
  }),
  supplierPower: z.object({
    intensity: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
    score: z.number().min(0).max(100)
  }),
  buyerPower: z.object({
    intensity: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
    score: z.number().min(0).max(100)
  }),
  threatOfSubstitutes: z.object({
    intensity: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
    score: z.number().min(0).max(100)
  }),
  barrierToEntry: z.object({
    intensity: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
    score: z.number().min(0).max(100)
  }),
  overallAttractiveness: z.number().min(0).max(100),
  strategicRecommendations: z.array(z.string())
});

export const BalancedScorecardSchema = z.object({
  financial: z.object({
    metrics: z.array(z.object({
      name: z.string(),
      current: z.number(),
      target: z.number(),
      trend: z.enum(['improving', 'stable', 'declining'])
    })),
    score: z.number().min(0).max(100)
  }),
  customer: z.object({
    metrics: z.array(z.object({
      name: z.string(),
      current: z.number(),
      target: z.number(),
      trend: z.enum(['improving', 'stable', 'declining'])
    })),
    score: z.number().min(0).max(100)
  }),
  internalProcesses: z.object({
    metrics: z.array(z.object({
      name: z.string(),
      current: z.number(),
      target: z.number(),
      trend: z.enum(['improving', 'stable', 'declining'])
    })),
    score: z.number().min(0).max(100)
  }),
  learningAndGrowth: z.object({
    metrics: z.array(z.object({
      name: z.string(),
      current: z.number(),
      target: z.number(),
      trend: z.enum(['improving', 'stable', 'declining'])
    })),
    score: z.number().min(0).max(100)
  }),
  overallBalance: z.number().min(0).max(100),
  strategicInitiatives: z.array(z.string())
});

export const NutzwertanalyseSchema = z.object({
  criteria: z.array(z.object({
    name: z.string(),
    weight: z.number().min(0).max(1),
    alternatives: z.array(z.object({
      name: z.string(),
      score: z.number().min(0).max(10),
      weightedScore: z.number()
    }))
  })),
  results: z.array(z.object({
    alternative: z.string(),
    totalScore: z.number(),
    rank: z.number(),
    revenueProjection: z.object({
      amount: z.number(),
      currency: z.string(),
      timeframe: z.string(),
      disclaimer: z.string() // "unverbindlich"
    })
  })),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.number(),
    expectedROI: z.string(),
    implementation: z.string()
  }))
});

export const HofstedeCulturalDimensionsSchema = z.object({
  country: z.string(),
  dimensions: z.object({
    powerDistance: z.object({
      score: z.number().min(0).max(100),
      interpretation: z.string(),
      businessImplications: z.array(z.string())
    }),
    individualism: z.object({
      score: z.number().min(0).max(100),
      interpretation: z.string(),
      businessImplications: z.array(z.string())
    }),
    masculinity: z.object({
      score: z.number().min(0).max(100),
      interpretation: z.string(),
      businessImplications: z.array(z.string())
    }),
    uncertaintyAvoidance: z.object({
      score: z.number().min(0).max(100),
      interpretation: z.string(),
      businessImplications: z.array(z.string())
    }),
    longTermOrientation: z.object({
      score: z.number().min(0).max(100),
      interpretation: z.string(),
      businessImplications: z.array(z.string())
    }),
    indulgence: z.object({
      score: z.number().min(0).max(100),
      interpretation: z.string(),
      businessImplications: z.array(z.string())
    })
  }),
  culturalRecommendations: z.array(z.object({
    area: z.string(),
    recommendation: z.string(),
    reasoning: z.string()
  })),
  communicationStyle: z.object({
    preferred: z.string(),
    avoid: z.array(z.string()),
    emphasize: z.array(z.string())
  })
});

export const StrategicAnalysisSchema = z.object({
  swot: SWOTAnalysisSchema,
  portersFiveForces: PortersFiveForcesSchema,
  balancedScorecard: BalancedScorecardSchema,
  nutzwertanalyse: NutzwertanalyseSchema,
  culturalDimensions: HofstedeCulturalDimensionsSchema
});

// Comprehensive competitor analysis
export const CompetitorAnalysisSchema = z.object({
  competitor: CompetitorSchema,
  platforms: z.array(PlatformMetricsSchema),
  visibilityScore: z.object({
    overall: z.number().min(0).max(100),
    google: z.number().min(0).max(100),
    social: z.number().min(0).max(100),
    reviews: z.number().min(0).max(100),
    photos: z.number().min(0).max(100)
  }),
  strategicAnalysis: StrategicAnalysisSchema,
  keyInsights: z.array(z.string()),
  recommendedActions: z.array(z.object({
    action: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    effort: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    timeframe: z.string(),
    framework: z.enum(['swot', 'porter', 'balanced_scorecard', 'nutzwert', 'cultural']).optional()
  })),
  analysisDate: z.string(), // ISO timestamp
  dataFreshness: z.object({
    google: z.string(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    yelp: z.string().optional(),
    tripadvisor: z.string().optional()
  })
});

export type SWOTAnalysis = z.infer<typeof SWOTAnalysisSchema>;
export type PortersFiveForces = z.infer<typeof PortersFiveForcesSchema>;
export type BalancedScorecard = z.infer<typeof BalancedScorecardSchema>;
export type Nutzwertanalyse = z.infer<typeof NutzwertanalyseSchema>;
export type HofstedeCulturalDimensions = z.infer<typeof HofstedeCulturalDimensionsSchema>;
export type StrategicAnalysis = z.infer<typeof StrategicAnalysisSchema>;
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

// Benchmarking request and response
export const BenchmarkingRequestSchema = z.object({
  businessId: z.string(),
  businessName: z.string(),
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  category: z.string(),
  radius: z.number().min(100).max(10000).default(2000), // meters
  maxCompetitors: z.number().min(1).max(50).default(10),
  platforms: z.array(z.enum(['google', 'instagram', 'facebook', 'yelp', 'tripadvisor'])).default(['google', 'instagram', 'facebook']),
  includeInactive: z.boolean().default(false),
  forceRefresh: z.boolean().default(false), // bypass cache
  analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).default('standard'),
  frameworks: z.array(z.enum(['swot', 'porter', 'balanced_scorecard', 'nutzwert', 'cultural'])).default(['swot', 'porter', 'balanced_scorecard', 'nutzwert', 'cultural']),
  culturalContext: z.object({
    country: z.string(),
    language: z.string(),
    region: z.string().optional()
  }).optional()
});

export type BenchmarkingRequest = z.infer<typeof BenchmarkingRequestSchema>;

export const BenchmarkingResponseSchema = z.object({
  requestId: z.string(),
  businessId: z.string(),
  analysisDate: z.string(),
  competitors: z.array(CompetitorAnalysisSchema),
  marketInsights: z.object({
    totalCompetitors: z.number(),
    averageVisibilityScore: z.number(),
    marketLeader: z.object({
      name: z.string(),
      visibilityScore: z.number()
    }).optional(),
    marketPosition: z.object({
      rank: z.number(),
      percentile: z.number(),
      category: z.enum(['leader', 'strong', 'average', 'weak', 'laggard'])
    }),
    keyTrends: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string())
  }),
  recommendations: z.array(z.object({
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    actions: z.array(z.string()),
    expectedImpact: z.string(),
    timeframe: z.string(),
    resources: z.array(z.string())
  })),
  dataQuality: z.object({
    completeness: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1),
    sources: z.array(z.string()),
    limitations: z.array(z.string())
  }),
  processingTime: z.number(), // milliseconds
  cacheHit: z.boolean(),
  nextUpdateRecommended: z.string() // ISO timestamp
});

export type BenchmarkingResponse = z.infer<typeof BenchmarkingResponseSchema>;

// Error types
export class CompetitorDiscoveryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'CompetitorDiscoveryError';
  }
}

export class DataScrapingError extends Error {
  constructor(message: string, public readonly platform: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DataScrapingError';
  }
}

export class AnalysisError extends Error {
  constructor(message: string, public readonly stage: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AnalysisError';
  }
}

// Configuration types
export interface CompetitorDiscoveryConfig {
  googleMapsApiKey: string;
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
  rateLimitDelay: number;
  cacheEnabled: boolean;
  cacheTtl: number; // seconds
}

export interface ScrapingConfig {
  userAgent: string;
  requestTimeout: number;
  maxConcurrentRequests: number;
  retryAttempts: number;
  retryDelay: number;
  respectRobotsTxt: boolean;
  enableJavaScript: boolean;
  headless: boolean;
}

export interface AnalysisConfig {
  weightings: {
    google: number;
    social: number;
    reviews: number;
    photos: number;
  };
  thresholds: {
    highVisibility: number;
    mediumVisibility: number;
    lowVisibility: number;
  };
  sentimentAnalysis: boolean;
  keywordExtraction: boolean;
  trendAnalysis: boolean;
}

// Lambda event types
export interface CompetitiveBenchmarkingEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  requestContext: {
    requestId: string;
    identity: {
      sourceIp: string;
      userAgent: string;
    };
  };
}

export interface CompetitiveBenchmarkingContext {
  requestId: string;
  functionName: string;
  functionVersion: string;
  memoryLimitInMB: string;
  remainingTimeInMillis: number;
}