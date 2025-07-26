export interface BusinessPartner {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  business_model?: string[];
  revenue_streams?: string[];
  target_audience?: string[];
  seating_capacity?: number;
  opening_hours?: string;
  special_features?: string[];
  services_selected?: string[];
  onboarding_completed: boolean;
  google_connected: boolean;
  go_live: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  category_ids?: string[];
}

export interface BusinessPartnerFormData {
  companyName: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  categories: string[];
  businessModel?: string[];
  revenueStreams?: string[];
  targetAudience?: string[];
  seatingCapacity?: number;
  openingHours?: string;
  specialFeatures?: string[];
}