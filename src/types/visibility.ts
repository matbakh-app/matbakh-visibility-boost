
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
