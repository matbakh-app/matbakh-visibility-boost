export const PLATFORM_SCORES = {
  google: { score: 87, status: 'good' },
  facebook: { score: 72, status: 'warning' },
  instagram: { score: 93, status: 'good' }
};

export const AI_FEATURES_BY_PLAN = {
  basic: {
    title: 'Basic Plan',
    features: ['Standard Analysis', 'Email Reports', 'Monthly Updates', 'Basic Support']
  },
  business: {
    title: 'Business Plan', 
    features: ['Advanced Analysis', 'Weekly Reports', 'Competitor Tracking', 'Priority Support', 'Custom Insights', 'API Access']
  },
  premium: {
    title: 'Premium Plan',
    features: ['AI-Powered Analysis', 'Daily Reports', 'Real-time Monitoring', 'Dedicated Support', 'Advanced Insights', 'Custom Integrations', 'White-label Reports', 'Predictive Analytics']
  }
};

export const RECOMMENDATIONS_DATA = {
  google: {
    title: 'Google Recommendations',
    features: ['Update business hours', 'Add photos', 'Respond to reviews']
  },
  facebook: {
    title: 'Facebook Recommendations', 
    features: ['Complete profile', 'Post regularly', 'Engage with followers']
  },
  instagram: {
    title: 'Instagram Recommendations',
    features: ['Use hashtags', 'Share stories', 'Post consistently']
  }
};

export const mockAnalysisData = {
  google: { score: 85, issues: ['Missing opening hours', 'No recent photos'] },
  facebook: { score: 72, issues: ['Incomplete profile', 'Low engagement'] },
  instagram: { score: 91, issues: ['Inconsistent posting'] }
};

export const METRIC_CARDS_DATA = [
  { title: 'Google Visibility', value: 85, change: 5 },
  { title: 'Facebook Reach', value: 72, change: -2 },
  { title: 'Instagram Engagement', value: 91, change: 8 }
];

export const getPlanDescription = (plan: string) => `${plan} Plan Description`;

export const getUpgradeTitle = (plan: string) => `Upgrade to ${plan}`;

export const getUpgradeFeatures = (plan: string) => ['Feature 1', 'Feature 2', 'Feature 3'];

export const canStartAnalysis = true;

export const shouldShowCostPreview = false;

export const getUsageData = () => ({ used: 1, total: 3 });

export const PLATFORM_SCORES_DATA = PLATFORM_SCORES;

export const createAppEventHandlers = () => ({
  onUpgrade: () => console.log('Upgrade'),
  onPurchaseAnalysis: () => console.log('Purchase'),
  onStartAnalysis: () => console.log('Start analysis'),
  onScheduleChange: () => console.log('Schedule change'),
  onNavigateToView: () => console.log('Navigate'),
  onSetUserType: () => console.log('Set user type'),
  onBackToVCLanding: () => console.log('Back to landing')
});

export const useAppNavigation = () => ({
  currentView: 'dashboard',
  setView: () => console.log('Set view')
});