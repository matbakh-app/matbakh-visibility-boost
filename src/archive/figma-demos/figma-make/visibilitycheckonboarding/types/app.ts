export type UserPlan = 'basic' | 'business' | 'premium';
export type AIStatus = 'ready' | 'busy' | 'error' | 'maintenance';
export type UserType = 'guest' | 'registered';

export interface RestaurantFormData {
  restaurantName: string;
  address: string;
  phone: string;
  website: string;
  mainCategory: string;
  subCategories: string[];
  priceRange: string;
  gdprAccepted: boolean;
}

export interface WebsiteAnalysisFormData {
  website: string;
  benchmarks: {
    benchmark1: string;
    benchmark2: string;
    benchmark3: string;
  };
  email: string;
  privacyAccepted: boolean;
  emailReportAccepted: boolean;
  marketingAccepted: boolean;
  emailConfirmed: boolean;
}

export interface ScheduleSettings {
  enabled: boolean;
  time: string;
  weekdays: string[];
  emailNotification: boolean;
}

export interface UsageData {
  used: number;
  total: number | 'unlimited';
}

export interface GuestCodeInfo {
  code: string;
  isValid: boolean;
  referrerName?: string;
  validUntil?: Date;
  benefits: string[];
  creditAmount?: number;
}

export interface AppState {
  currentStep: number;
  showPaywall: boolean;
  activeView: 'landing' | 'dashboard' | 'step1' | 'step2' | 'loading' | 'results';
  restaurantData: RestaurantFormData | null;
  websiteAnalysisData: WebsiteAnalysisFormData | null;
  isAdmin: boolean;
  aiStatus: AIStatus;
  userPlan: UserPlan;
  userType: UserType;
  isAnalysisRunning: boolean;
  analysisQueue: number | null;
  dateRange: string;
  scheduleSettings: ScheduleSettings;
  guestCodeInfo: GuestCodeInfo | null;
}