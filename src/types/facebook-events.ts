
// TypeScript Definitionen für Facebook Conversions API Events

export interface FacebookEventTemplate {
  id: string;
  event_name: string;
  template_payload: Record<string, any>;
  required_fields: string[];
  optional_fields: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacebookUserData {
  em?: string[]; // Hashed email
  ph?: string[]; // Hashed phone
  fn?: string[]; // Hashed first name
  ln?: string[]; // Hashed last name
  ct?: string[]; // Hashed city
  st?: string[]; // Hashed state
  zp?: string[]; // Hashed zip
  country?: string[]; // Hashed country (2-letter code)
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
  external_id?: string[];
  subscription_id?: string;
}

export interface FacebookCustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  num_items?: number;
  search_string?: string;
  status?: string;
  predicted_ltv?: number;
  [key: string]: any;
}

export interface FacebookEventPayload {
  event_name: string;
  event_time: number;
  action_source: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'other';
  event_source_url?: string;
  event_id?: string;
  user_data?: FacebookUserData;
  custom_data?: FacebookCustomData;
  data_processing_options?: string[];
}

export interface LeadEvent {
  id: string;
  email?: string;
  business_name?: string;
  event_type: string;
  event_time: string;
  event_payload: Record<string, any>;
  processed: boolean;
  created_at: string;
  user_id?: string;
  partner_id?: string;
  facebook_event_id?: string;
  response_status?: number;
  success: boolean;
}

export interface LeadTodo {
  id: string;
  lead_id: string;
  todo_text: string;
  status: 'offen' | 'erledigt' | 'in_bearbeitung';
  priority?: number;
  estimated_impact?: string;
  created_at: string;
  completed_at?: string;
}

export interface LeadSource {
  id: string;
  lead_id: string;
  source_system: 'google' | 'meta' | 'website' | 'direct';
  ref_id?: string;
  source_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
}

export interface LeadCheckReport {
  id: string;
  lead_id: string;
  check_type: 'gmb' | 'meta' | 'combined';
  result_summary: Record<string, any>;
  visibility_score?: number;
  total_todos?: number;
  critical_todos?: number;
  pdf_report_s3_url?: string;
  created_at: string;
}

// Event Type Definitions für alle Facebook Events
export type FacebookEventType = 
  | 'ViewContent'
  | 'Lead'
  | 'AddToCart'
  | 'CompleteRegistration'
  | 'Search'
  | 'StartTrial'
  | 'Contact'
  | 'Purchase'
  | 'CustomizeProduct'
  | 'FindLocation'
  | 'Subscribe'
  | 'InitiateCheckout';

// Helper für Event Validation
export interface EventValidationResult {
  isValid: boolean;
  missingFields: string[];
  invalidFields: string[];
  warnings: string[];
}
