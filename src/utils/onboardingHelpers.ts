
import { supabase } from '@/integrations/supabase/client';
import type { GmbCategory } from '@/hooks/useGmbCategories';

export interface OnboardingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateBusinessBasics = (data: any): OnboardingValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.companyName?.trim()) {
    errors.companyName = 'Company name is required';
  }

  if (!data.address?.trim()) {
    errors.address = 'Address is required';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(data.phone.trim())) {
    errors.phone = 'Invalid phone number format';
  }

  if (data.website && !/^https?:\/\/.+/.test(data.website.trim())) {
    errors.website = 'Invalid website URL';
  }

  if (!data.categories || data.categories.length === 0) {
    errors.categories = 'At least one category must be selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const saveBusinessPartner = async (data: any) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create business partner record
    const { data: partner, error: partnerError } = await supabase
      .from('business_partners')
      .insert({
        user_id: user.id,
        company_name: data.companyName,
        address: data.address,
        contact_phone: data.phone,
        website: data.website,
        description: data.description,
        category_ids: data.categories,
        services_selected: data.selectedServices
      })
      .select()
      .single();

    if (partnerError) {
      throw partnerError;
    }

    // Create business profile
    const { error: profileError } = await supabase
      .from('business_profiles')
      .insert({
        partner_id: partner.id,
        business_name: data.companyName,
        address: data.address,
        phone: data.phone,
        website: data.website,
        google_connected: data.googleConnected || false
      });

    if (profileError) {
      throw profileError;
    }

    // Save KPI data if provided
    if (data.kpiData && Object.keys(data.kpiData).length > 0) {
      const { error: kpiError } = await supabase
        .from('partner_kpis')
        .insert({
          partner_id: partner.id,
          ...data.kpiData
        });

      if (kpiError) {
        console.error('Error saving KPI data:', kpiError);
      }
    }

    return partner;
  } catch (error) {
    console.error('Error saving business partner:', error);
    throw error;
  }
};

export const getCategoryDisplayName = (categoryId: string, categories: GmbCategory[], language: string = 'en') => {
  const category = categories.find(c => c.category_id === categoryId);
  if (!category) return categoryId;
  
  return language === 'de' ? category.name_de : category.name_en;
};

export const formatPhoneNumber = (phone: string) => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with + and is a German number, add +49
  if (!cleaned.startsWith('+') && cleaned.length >= 10) {
    return `+49${cleaned.substring(cleaned.length - 10)}`;
  }
  
  return cleaned;
};

export const validateWebsiteUrl = (url: string) => {
  if (!url) return '';
  
  // Add https:// if no protocol is specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};
