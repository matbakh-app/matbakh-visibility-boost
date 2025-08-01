// Phase 1: Business Profile Types für neue Architektur

export type RegistrationType = 'email' | 'google' | 'facebook';
export type CheckType = 'onboarding' | 'manual' | 'scheduled';

export interface BusinessProfile {
  id: string;
  user_id: string;
  registration_type: RegistrationType;
  
  // Core Business Felder
  company_name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  description?: string;
  categories: string[];
  business_hours: Record<string, any>;
  services: string[];
  target_audience: string[];
  
  // Google/GMB-spezifische Felder
  google_places_id?: string;
  gmb_verification_status?: string;
  google_reviews_count: number;
  google_rating?: number;
  google_photos: any[];
  gmb_social_links: Record<string, any>;
  gmb_attributes: Record<string, any>;
  gmb_posts: any[];
  
  // Facebook/Meta-spezifische Felder
  facebook_page_id?: string;
  instagram_handle?: string;
  instagram_business_id?: string;
  facebook_followers: number;
  instagram_followers: number;
  facebook_posts_count: number;
  whatsapp_number?: string;
  messenger_integration: boolean;
  facebook_page_category?: string;
  facebook_about?: string;
  
  // Visibility Check Integration
  vc_completed: boolean;
  vc_score?: number;
  vc_last_run?: string;
  vc_results: Record<string, any>;
  
  // Status & Tracking
  onboarding_completed: boolean;
  profile_verified: boolean;
  data_sources: string[];
  
  created_at: string;
  updated_at: string;
}

export interface VisibilityCheckResult {
  id: string;
  business_profile_id: string;
  check_type: CheckType;
  
  // Scores & Bewertungen
  overall_score?: number;
  category_scores: Record<string, number>;
  recommendations: any[];
  competitive_analysis: Record<string, any>;
  missing_elements: string[];
  strengths: string[];
  
  // Dashboard & Export Integration
  dashboard_widgets: Record<string, any>;
  pdf_export_data: Record<string, any>;
  
  // Metadata
  analysis_duration_ms?: number;
  data_sources_used: string[];
  api_calls_made: Record<string, any>;
  
  created_at: string;
}

export interface GMBDataCache {
  id: string;
  user_id: string;
  google_places_id?: string;
  google_user_id?: string;
  
  // Cached GMB Data
  business_data: Record<string, any>;
  reviews_data: Record<string, any>;
  photos_data: Record<string, any>;
  posts_data: Record<string, any>;
  attributes_data: Record<string, any>;
  insights_data: Record<string, any>;
  
  // Cache Metadata
  last_fetched: string;
  cache_expires_at: string;
  api_calls_count: number;
  fetch_errors: any[];
  
  created_at: string;
  updated_at: string;
}

export interface FacebookDataCache {
  id: string;
  user_id: string;
  facebook_page_id?: string;
  instagram_business_id?: string;
  facebook_user_id?: string;
  
  // Cached Facebook Data
  page_data: Record<string, any>;
  posts_data: Record<string, any>;
  insights_data: Record<string, any>;
  instagram_data: Record<string, any>;
  followers_data: Record<string, any>;
  
  // Cache Metadata
  last_fetched: string;
  cache_expires_at: string;
  api_calls_count: number;
  fetch_errors: any[];
  
  created_at: string;
  updated_at: string;
}

// Onboarding Form Data Interfaces
export interface StandardOnboardingData {
  company_name: string;
  address: string;
  phone: string;
  website?: string;
  description?: string;
  categories: string[];
  business_hours: Record<string, any>;
  services: string[];
  target_audience: string[];
}

export interface GoogleEnhancedOnboardingData extends StandardOnboardingData {
  google_places_id: string;
  gmb_verification_status: string;
  google_reviews_count: number;
  google_rating: number;
  google_photos: any[];
  gmb_social_links: Record<string, any>;
  gmb_attributes: Record<string, any>;
  gmb_posts: any[];
}

export interface FacebookEnhancedOnboardingData extends StandardOnboardingData {
  facebook_page_id: string;
  instagram_handle?: string;
  instagram_business_id?: string;
  facebook_followers: number;
  instagram_followers: number;
  facebook_posts_count: number;
  whatsapp_number?: string;
  messenger_integration: boolean;
  facebook_page_category: string;
  facebook_about: string;
  
  // Auch GMB-Daten bei Facebook-Anmeldung
  google_places_id?: string;
  google_reviews_count?: number;
  google_rating?: number;
}

export type OnboardingData = 
  | StandardOnboardingData 
  | GoogleEnhancedOnboardingData 
  | FacebookEnhancedOnboardingData;

// API Response Types
export interface GMBApiResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  cached?: boolean;
}

export interface FacebookApiResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  cached?: boolean;
}

// Form Validation Types
export interface OnboardingFormErrors {
  company_name?: string;
  address?: string;
  phone?: string;
  website?: string;
  categories?: string;
  [key: string]: string | undefined;
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}