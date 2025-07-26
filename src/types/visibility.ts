
export interface InstagramCandidate {
  handle: string;
  score: number;
  profilePicture?: string;
  followerCount?: number;
  bio?: string;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
}

export interface AnalysisResult {
  overallScore: number;
  platformAnalyses: Array<{
    platform: 'google' | 'facebook' | 'instagram';
    score: number;
    maxScore: number;
    completedFeatures: string[];
    missingFeatures: string[];
    profileUrl?: string;
    profilePicture?: string;
    profileFound: boolean;
    autoDetected?: boolean;
    recommendations: string[];
    followerCount?: number;
    reservationAvailable?: boolean;
    hasHolidayHours?: boolean;
    askSectionVisible?: boolean;
    isListingComplete?: boolean;
    category?: string;
    candidates?: InstagramCandidate[];
  }>;
  benchmarks: Array<{
    name: string;
    scores: {
      google: number;
      facebook: number;
      instagram: number;
      overall: number;
    };
    profileUrls: {
      google?: string;
      facebook?: string;
      instagram?: string;
    };
  }>;
  categoryInsights: string[];
  quickWins: string[];
  leadPotential: 'high' | 'medium' | 'low';
  reportData: any;
}

export interface VisibilityCheckData {
  businessName: string;
  location: string;
  mainCategory: string;
  subCategory: string;
  matbakhTags: string[];
  website?: string;
  facebookName?: string;
  instagramName?: string;
  benchmarks: string[];
  email?: string;
}

export interface VisibilityCheckResult {
  id: string;
  lead_id: string;
  partner_id?: string;
  visibility_score: number;
  swot_strengths: string[];
  swot_weaknesses: string[];
  swot_opportunities: string[];
  swot_threats: string[];
  action_recommendations: any[];
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface UnclaimedBusinessProfile {
  id: string;
  business_name?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  category_ids?: string[];
  matbakh_category?: string;
  address?: string;
  opening_hours?: string[];
  special_features?: any;
  business_model?: string[];
  revenue_streams?: string[];
  target_audience?: string[];
  seating_capacity?: number;
  lead_id?: string;
  claimed_by_user_id?: string;
  claimed_at?: string;
  claim_status: 'unclaimed' | 'claimed' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}
