import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import VisibilityResults from '@<REDACTED_AWS_SECRET_ACCESS_KEY>';
import PlatformProfileCard from '@/components/visibility/PlatformProfileCard';
import { AnalysisResult } from '@/types/visibility';

// Mock analysis result with Google metrics
const mockAnalysisResultWithMetrics: AnalysisResult & {
  gmb_metrics?: any;
  ga4_metrics?: any;
  ads_metrics?: any;
} = {
  overallScore: 85,
  platformAnalyses: [
    {
      platform: 'google',
      score: 85,
      maxScore: 100,
      completedFeatures: ['Business Profile', 'Photos'],
      missingFeatures: ['Posts', 'Reviews Response'],
      profileFound: true,
      recommendations: ['Add more photos', 'Respond to reviews'],
      gmb_metrics: {
        rating: 4.5,
        reviewCount: 25,
        profileComplete: true,
        hasPhotos: true
      }
    }
  ],
  benchmarks: [],
  categoryInsights: ['Visual content is important'],
  quickWins: ['Add photos', 'Respond to reviews'],
  leadPotential: 'medium',
  provider: 'bedrock',
  reportData: {},
  gmb_metrics: {
    rating: 4.5,
    reviewCount: 25,
    profileComplete: true,
    hasPhotos: true
  },
  ga4_metrics: {
    sessions: 1500,
    pageviews: 4500,
    bounceRate: 0.35,
    avgSessionDuration: 125
  },
  ads_metrics: {
    impressions: 10000,
    clicks: 250,
    ctr: 0.025,
    cost: 150.75
  }
};

describe('VisibilityResults with Google Metrics', () => {
  it('renders Google My Business metrics correctly', () => {
    render(
      <VisibilityResults
        businessName="Test Restaurant"
        analysisResult={mockAnalysisResultWithMetrics}
        onRequestDetailedReport={() => {}}
        onNewAnalysis={() => {}}
        reportRequested={false}
      />
    );

    // Check if Google Services section is rendered
    expect(screen.getByText('Google Services Metriken')).toBeInTheDocument();
    
    // Check GMB metrics
    expect(screen.getByText('Google My Business')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Ja')).toBeInTheDocument();
  });

  it('renders Google Analytics 4 metrics correctly', () => {
    render(
      <VisibilityResults
        businessName="Test Restaurant"
        analysisResult={mockAnalysisResultWithMetrics}
        onRequestDetailedReport={() => {}}
        onNewAnalysis={() => {}}
        reportRequested={false}
      />
    );

    // Check GA4 metrics
    expect(screen.getByText('Google Analytics 4')).toBeInTheDocument();
    expect(screen.getByText('1.500')).toBeInTheDocument(); // Sessions with German formatting
    expect(screen.getByText('4.500')).toBeInTheDocument(); // Pageviews with German formatting
    expect(screen.getByText('35.0%')).toBeInTheDocument(); // Bounce rate
    expect(screen.getByText('125s')).toBeInTheDocument(); // Avg session duration
  });

  it('renders Google Ads metrics correctly', () => {
    render(
      <VisibilityResults
        businessName="Test Restaurant"
        analysisResult={mockAnalysisResultWithMetrics}
        onRequestDetailedReport={() => {}}
        onNewAnalysis={() => {}}
        reportRequested={false}
      />
    );

    // Check Ads metrics
    expect(screen.getByText('Google Ads')).toBeInTheDocument();
    expect(screen.getByText('10.000')).toBeInTheDocument(); // Impressions
    expect(screen.getByText('250')).toBeInTheDocument(); // Clicks
    expect(screen.getByText('2.50%')).toBeInTheDocument(); // CTR
    expect(screen.getByText('€150.75')).toBeInTheDocument(); // Cost
  });

  it('does not render Google metrics section when no metrics are available', () => {
    const analysisWithoutMetrics = {
      ...mockAnalysisResultWithMetrics,
      gmb_metrics: undefined,
      ga4_metrics: undefined,
      ads_metrics: undefined
    };

    render(
      <VisibilityResults
        businessName="Test Restaurant"
        analysisResult={analysisWithoutMetrics}
        onRequestDetailedReport={() => {}}
        onNewAnalysis={() => {}}
        reportRequested={false}
      />
    );

    // Should not render Google Services section
    expect(screen.queryByText('Google Services Metriken')).not.toBeInTheDocument();
  });
});

describe('PlatformProfileCard with Google Metrics', () => {
  it('renders Google metrics integration for Google platform', () => {
    const googlePlatform = {
      platform: 'google' as const,
      score: 85,
      maxScore: 100,
      completedFeatures: ['Business Profile'],
      missingFeatures: ['Posts'],
      profileFound: true,
      recommendations: ['Add photos'],
      gmb_metrics: {
        rating: 4.5,
        reviewCount: 25
      }
    };

    render(<PlatformProfileCard platform={googlePlatform} />);

    // Check if live Google metrics section is rendered
    expect(screen.getByText('Live Google Metriken')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('25 Bewertungen')).toBeInTheDocument();
  });

  it('does not render Google metrics for non-Google platforms', () => {
    const facebookPlatform = {
      platform: 'facebook' as const,
      score: 75,
      maxScore: 100,
      completedFeatures: ['Page'],
      missingFeatures: ['Posts'],
      profileFound: true,
      recommendations: ['Post more'],
      gmb_metrics: {
        rating: 4.5,
        reviewCount: 25
      }
    };

    render(<PlatformProfileCard platform={facebookPlatform} />);

    // Should not render Google metrics for Facebook platform
    expect(screen.queryByText('Live Google Metriken')).not.toBeInTheDocument();
  });

  it('does not render Google metrics section when no metrics are available', () => {
    const googlePlatformWithoutMetrics = {
      platform: 'google' as const,
      score: 85,
      maxScore: 100,
      completedFeatures: ['Business Profile'],
      missingFeatures: ['Posts'],
      profileFound: true,
      recommendations: ['Add photos']
    };

    render(<PlatformProfileCard platform={googlePlatformWithoutMetrics} />);

    // Should not render Google metrics section
    expect(screen.queryByText('Live Google Metriken')).not.toBeInTheDocument();
  });
});