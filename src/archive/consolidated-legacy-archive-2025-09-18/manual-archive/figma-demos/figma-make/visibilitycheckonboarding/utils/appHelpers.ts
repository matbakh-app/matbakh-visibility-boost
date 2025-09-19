import { UserPlan, UsageData, UserType, GuestCodeInfo } from '../types/app';

export const getUsageData = (userPlan: UserPlan): UsageData => {
  switch (userPlan) {
    case 'basic':
      return { used: 1, total: 1 };
    case 'business':
      return { used: 2, total: 3 }; // Soft limit demo
    case 'premium':
      return { used: 7, total: 'unlimited' };
    default:
      return { used: 0, total: 1 };
  }
};

export const canStartAnalysis = (userPlan: UserPlan, usageData: UsageData, userType: UserType = 'registered'): boolean => {
  // Guest users with valid code can always start analysis
  if (userType === 'guest') return true;
  
  return userPlan === 'premium' || usageData.used < (usageData.total as number);
};

export const shouldShowCostPreview = (canStart: boolean, userPlan: UserPlan, userType: UserType = 'registered'): boolean => {
  // Guest users never see cost preview
  if (userType === 'guest') return false;
  
  return !canStart && userPlan !== 'premium';
};

export const getPlanDescription = (userPlan: UserPlan): string => {
  switch (userPlan) {
    case 'basic':
      return 'Basic Plan - 1 Analyse täglich';
    case 'business':
      return 'Business Plan - 3 Analysen täglich';
    case 'premium':
      return 'Premium Plan - Unbegrenzte Analysen';
    default:
      return '';
  }
};

export const getUpgradeFeatures = (userPlan: UserPlan): string[] => {
  if (userPlan === 'basic') {
    return [
      '3 Analysen täglich statt 1',
      'Erweiterte AI-Insights',
      'Social Media Monitoring',
      'Email-Benachrichtigungen'
    ];
  }
  return [
    'Unbegrenzte tägliche Analysen',
    'Priority-Queue für schnellere Ergebnisse',
    'Competitive Intelligence',
    'Multi-Location Support',
    'API-Zugang'
  ];
};

export const getUpgradeTitle = (userPlan: UserPlan): string => {
  return `Upgrade auf ${userPlan === 'basic' ? 'Business' : 'Premium'} Plan`;
};

// URL parameter parsing
export const getCodeFromURL = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
};

// Mock code validation - in real app this would call API
export const validateGuestCode = (code: string): GuestCodeInfo | null => {
  const mockCodes: Record<string, GuestCodeInfo> = {
    'OLIVIA2024XYZ': {
      code: 'OLIVIA2024XYZ',
      isValid: true,
      referrerName: 'Restaurant Olivia',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      benefits: ['Vollanalyse + Premium-Insights', 'Alle Features freigeschaltet', 'Keine Paywall-Beschränkungen'],
      creditAmount: 2.00
    },
    'MAXBURGER2024': {
      code: 'MAXBURGER2024',
      isValid: true,
      referrerName: 'Max Burger',
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      benefits: ['Premium-Analyse', 'Competitive Intelligence', 'Detaillierte Reports'],
      creditAmount: 2.00
    },
    'EXPIRED123': {
      code: 'EXPIRED123',
      isValid: false,
      referrerName: 'Test Restaurant',
      validUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      benefits: [],
      creditAmount: 0
    }
  };

  return mockCodes[code.toUpperCase()] || null;
};

export const formatCodeExpiryDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};