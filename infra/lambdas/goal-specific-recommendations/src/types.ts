import { z } from 'zod';

// Business objectives that drive recommendations
export const BusinessObjectiveSchema = z.enum([
  'increase_visibility',
  'improve_reviews',
  'boost_social_engagement',
  'enhance_local_seo',
  'drive_foot_traffic',
  'increase_online_orders',
  'build_brand_awareness',
  'competitive_positioning',
  'cost_optimization',
  'customer_retention',
  'market_expansion',
  'operational_efficiency'
]);

export type BusinessObjective = z.infer<typeof BusinessObjectiveSchema>;

// Priority levels for recommendations
export const PriorityLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

// Effort levels for implementation
export const EffortLevelSchema = z.enum(['low', 'medium', 'high']);
export type EffortLevel = z.infer<typeof EffortLevelSchema>;

// Impact levels for business outcomes
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high']);
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

// Timeframe for implementation
export const TimeframeSchema = z.enum(['immediate', 'short_term', 'medium_term', 'long_term']);
export type Timeframe = z.infer<typeof TimeframeSchema>;

// Recommendation categories
export const RecommendationCategorySchema = z.enum([
  'content_creation',
  'seo_optimization',
  'social_media',
  'review_management',
  'local_marketing',
  'competitive_analysis',
  'operational_improvement',
  'technology_upgrade',
  'staff_training',
  'customer_experience'
]);

export type RecommendationCategory = z.infer<typeof RecommendationCategorySchema>;

// Individual recommendation structure
export const RecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: RecommendationCategorySchema,
  objective: BusinessObjectiveSchema,
  priority: PriorityLevelSchema,
  effort: EffortLevelSchema,
  impact: ImpactLevelSchema,
  timeframe: TimeframeSchema,
  estimatedCost: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string()
  }).optional(),
  estimatedROI: z.object({
    percentage: z.number(),
    timeframe: z.string(),
    disclaimer: z.string()
  }).optional(),
  prerequisites: z.array(z.string()),
  steps: z.array(z.object({
    order: z.number(),
    action: z.string(),
    duration: z.string(),
    resources: z.array(z.string())
  })),
  successMetrics: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    measurement: z.string()
  })),
  risks: z.array(z.object({
    risk: z.string(),
    probability: z.enum(['low', 'medium', 'high']),
    mitigation: z.string()
  })),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  source: z.enum(['ai_generated', 'template', 'expert_curated', 'user_defined']),
  confidence: z.number().min(0).max(1)
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// Goal profile for specific business objectives
export const GoalProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  primaryObjective: BusinessObjectiveSchema,
  secondaryObjectives: z.array(BusinessObjectiveSchema),
  targetAudience: z.object({
    demographics: z.array(z.string()),
    behaviors: z.array(z.string()),
    preferences: z.array(z.string())
  }),
  keyMetrics: z.array(z.object({
    name: z.string(),
    description: z.string(),
    target: z.string(),
    measurement: z.string(),
    weight: z.number().min(0).max(1)
  })),
  recommendationWeights: z.object({
    priority: z.number().min(0).max(1),
    effort: z.number().min(0).max(1),
    impact: z.number().min(0).max(1),
    timeframe: z.number().min(0).max(1)
  }),
  industryContext: z.object({
    sector: z.string(),
    businessModel: z.string(),
    marketSize: z.enum(['local', 'regional', 'national', 'international']),
    competitionLevel: z.enum(['low', 'medium', 'high', 'intense'])
  }),
  constraints: z.object({
    budget: z.object({
      min: z.number(),
      max: z.number(),
      currency: z.string()
    }).optional(),
    timeline: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    resources: z.array(z.string()),
    limitations: z.array(z.string())
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean()
});

export type GoalProfile = z.infer<typeof GoalProfileSchema>;

// Scoring criteria for recommendation prioritization
export const ScoringCriteriaSchema = z.object({
  impactScore: z.number().min(0).max(100),
  effortScore: z.number().min(0).max(100),
  urgencyScore: z.number().min(0).max(100),
  feasibilityScore: z.number().min(0).max(100),
  alignmentScore: z.number().min(0).max(100),
  roiScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  competitiveAdvantageScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  reasoning: z.array(z.string())
});

export type ScoringCriteria = z.infer<typeof ScoringCriteriaSchema>;

// Prioritized recommendation with scoring
export const PrioritizedRecommendationSchema = z.object({
  recommendation: RecommendationSchema,
  scoring: ScoringCriteriaSchema,
  rank: z.number(),
  percentile: z.number(),
  category: z.enum(['quick_win', 'strategic_initiative', 'long_term_investment', 'maintenance']),
  dependencies: z.array(z.string()), // IDs of other recommendations
  alternatives: z.array(z.string()), // IDs of alternative recommendations
  customizations: z.array(z.object({
    field: z.string(),
    originalValue: z.string(),
    customValue: z.string(),
    reason: z.string()
  }))
});

export type PrioritizedRecommendation = z.infer<typeof PrioritizedRecommendationSchema>;

// Progress tracking for recommendations
export const RecommendationProgressSchema = z.object({
  recommendationId: z.string(),
  businessId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'paused', 'cancelled']),
  progress: z.number().min(0).max(100),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  milestones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    targetDate: z.string(),
    completedDate: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'overdue'])
  })),
  metrics: z.array(z.object({
    name: z.string(),
    baseline: z.number(),
    current: z.number(),
    target: z.number(),
    unit: z.string(),
    lastUpdated: z.string()
  })),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    author: z.string(),
    createdAt: z.string(),
    type: z.enum(['update', 'issue', 'success', 'milestone'])
  })),
  effectiveness: z.object({
    actualImpact: z.number().min(0).max(100),
    actualEffort: z.number().min(0).max(100),
    actualROI: z.number().optional(),
    lessonsLearned: z.array(z.string()),
    wouldRecommendAgain: z.boolean().optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type RecommendationProgress = z.infer<typeof RecommendationProgressSchema>;

// Request schema for generating recommendations
export const RecommendationRequestSchema = z.object({
  businessId: z.string(),
  businessProfile: z.object({
    name: z.string(),
    category: z.string(),
    location: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    size: z.enum(['small', 'medium', 'large', 'enterprise']),
    establishedYear: z.number().optional(),
    currentMetrics: z.object({
      monthlyRevenue: z.number().optional(),
      customerCount: z.number().optional(),
      onlinePresenceScore: z.number().optional(),
      reviewRating: z.number().optional(),
      socialFollowers: z.number().optional()
    }).optional()
  }),
  objectives: z.array(BusinessObjectiveSchema),
  primaryObjective: BusinessObjectiveSchema,
  constraints: z.object({
    budget: z.object({
      amount: z.number(),
      currency: z.string(),
      timeframe: z.string()
    }).optional(),
    timeline: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    resources: z.array(z.string()),
    limitations: z.array(z.string())
  }),
  currentChallenges: z.array(z.string()),
  competitorData: z.any().optional(), // From competitive benchmarking
  maxRecommendations: z.number().min(1).max(50).default(10),
  includeQuickWins: z.boolean().default(true),
  includeLongTerm: z.boolean().default(true),
  personaType: z.enum(['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin']).optional()
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

// Response schema
export const RecommendationResponseSchema = z.object({
  requestId: z.string(),
  businessId: z.string(),
  generatedAt: z.string(),
  goalProfile: GoalProfileSchema,
  recommendations: z.array(PrioritizedRecommendationSchema),
  summary: z.object({
    totalRecommendations: z.number(),
    quickWins: z.number(),
    strategicInitiatives: z.number(),
    longTermInvestments: z.number(),
    estimatedTotalCost: z.object({
      min: z.number(),
      max: z.number(),
      currency: z.string()
    }),
    estimatedTotalROI: z.object({
      percentage: z.number(),
      timeframe: z.string(),
      disclaimer: z.string()
    }),
    implementationTimeline: z.object({
      immediate: z.number(),
      shortTerm: z.number(),
      mediumTerm: z.number(),
      longTerm: z.number()
    })
  }),
  insights: z.array(z.object({
    type: z.enum(['opportunity', 'risk', 'trend', 'benchmark']),
    title: z.string(),
    description: z.string(),
    impact: ImpactLevelSchema,
    actionable: z.boolean()
  })),
  nextSteps: z.array(z.object({
    order: z.number(),
    action: z.string(),
    deadline: z.string(),
    owner: z.string().optional()
  })),
  processingTime: z.number(),
  dataQuality: z.object({
    completeness: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string()),
    limitations: z.array(z.string())
  })
});

export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;

// Error types
export class RecommendationGenerationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RecommendationGenerationError';
  }
}

export class ScoringError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ScoringError';
  }
}

export class ProgressTrackingError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ProgressTrackingError';
  }
}

// Lambda event types
export interface GoalRecommendationEvent {
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

export interface GoalRecommendationContext {
  requestId: string;
  functionName: string;
  functionVersion: string;
  memoryLimitInMB: string;
  remainingTimeInMillis: number;
}