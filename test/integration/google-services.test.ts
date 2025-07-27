import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Google Services Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  describe('Enhanced Visibility Check with Google Services', () => {
    it('should handle analysis with USE_GOOGLE_SERVICES=true', async () => {
      // Mock test data
      const testData = {
        businessName: 'Test Restaurant GMB',
        location: 'München, Deutschland',
        mainCategory: 'Restaurant',
        subCategory: 'Italienisches Restaurant',
        matbakhTags: ['pizza', 'pasta'],
        website: 'https://test-restaurant.de',
        benchmarks: ['Competitor A', 'Competitor B'],
        email: 'test@restaurant.de'
      };

      // First create a test lead
      const { data: leadData, error: leadError } = await supabase
        .from('visibility_check_leads')
        .insert({
          business_name: testData.businessName,
          email: testData.email,
          status: 'pending'
        })
        .select()
        .single();

      expect(leadError).toBeNull();
      expect(leadData).toBeDefined();

      // Call enhanced-visibility-check with Google Services flag
      const response = await supabase.functions.invoke('enhanced-visibility-check', {
        body: {
          ...testData,
          leadId: leadData.id
        }
      });

      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();

      // Verify the result was saved with provider info
      const { data: results } = await supabase
        .from('visibility_check_results')
        .select('*')
        .eq('lead_id', leadData.id)
        .single();

      expect(results).toBeDefined();
      expect(results.provider).toBeDefined();
      expect(['bedrock', 'mockAnalysis']).toContain(results.provider);

      // Clean up
      await supabase.from('visibility_check_results').delete().eq('lead_id', leadData.id);
      await supabase.from('visibility_check_leads').delete().eq('id', leadData.id);
    });

    it('should fallback gracefully when Google APIs are unavailable', async () => {
      const testData = {
        businessName: 'Test Restaurant No Google',
        location: 'Berlin, Deutschland',
        mainCategory: 'Restaurant',
        subCategory: 'Deutsches Restaurant',
        matbakhTags: ['schnitzel', 'bier'],
        benchmarks: ['Local Competitor'],
        email: 'nogoogle@restaurant.de'
      };

      // Create test lead without Google OAuth tokens
      const { data: leadData } = await supabase
        .from('visibility_check_leads')
        .insert({
          business_name: testData.businessName,
          email: testData.email,
          status: 'pending'
        })
        .select()
        .single();

      const response = await supabase.functions.invoke('enhanced-visibility-check', {
        body: {
          ...testData,
          leadId: leadData.id
        }
      });

      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.data.overallScore).toBeGreaterThan(0);

      // Clean up
      await supabase.from('visibility_check_results').delete().eq('lead_id', leadData.id);
      await supabase.from('visibility_check_leads').delete().eq('id', leadData.id);
    });
  });

  describe('Business Profile Updates', () => {
    it('should update business profile with Google metrics', async () => {
      // Create test partner and profile
      const { data: partnerData } = await supabase
        .from('business_partners')
        .insert({
          company_name: 'Test Partner for Google Metrics',
          contact_email: 'test-google@partner.com'
        })
        .select()
        .single();

      const { data: profileData } = await supabase
        .from('business_profiles')
        .insert({
          partner_id: partnerData.id,
          business_name: 'Test Business Profile',
          address: 'Test Address'
        })
        .select()
        .single();

      // Mock Google metrics data
      const mockGoogleMetrics = {
        gmbMetrics: {
          profileComplete: true,
          hasPhotos: true,
          rating: 4.5,
          reviewCount: 25
        },
        ga4Metrics: {
          sessions: 1500,
          pageviews: 4500,
          bounceRate: 0.35
        },
        adsMetrics: {
          impressions: 10000,
          clicks: 250,
          ctr: 0.025
        }
      };

      // Call update-business-profile function
      const response = await supabase.functions.invoke('update-business-profile', {
        body: {
          partnerId: partnerData.id,
          ...mockGoogleMetrics
        }
      });

      expect(response.error).toBeNull();
      expect(response.data.success).toBe(true);

      // Verify the profile was updated
      const { data: updatedProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', profileData.id)
        .single();

      expect(updatedProfile.gmb_metrics).toEqual(mockGoogleMetrics.gmbMetrics);
      expect(updatedProfile.ga4_metrics).toEqual(mockGoogleMetrics.ga4Metrics);
      expect(updatedProfile.ads_metrics).toEqual(mockGoogleMetrics.adsMetrics);
      expect(updatedProfile.gmb_connected).toBe(true);

      // Clean up
      await supabase.from('business_profiles').delete().eq('id', profileData.id);
      await supabase.from('business_partners').delete().eq('id', partnerData.id);
    });
  });

  describe('OAuth Token Management', () => {
    it('should handle multiple Google service tokens per user', async () => {
      // This test verifies the new schema supports different service types
      const mockTokens = [
        {
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          google_user_id: 'test-gmb-user',
          access_token: 'mock-gmb-token',
          service_type: 'gmb',
          gmb_account_id: 'test-gmb-account',
          email: 'test@gmb.com'
        },
        {
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          google_user_id: 'test-ga4-user',
          access_token: 'mock-ga4-token',
          service_type: 'analytics',
          ga4_property_id: 'test-ga4-property',
          email: 'test@analytics.com'
        }
      ];

      // Insert test tokens
      const { data: insertedTokens, error } = await supabase
        .from('google_oauth_tokens')
        .insert(mockTokens)
        .select();

      expect(error).toBeNull();
      expect(insertedTokens).toHaveLength(2);

      // Verify we can query by service type
      const { data: gmbTokens } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440001')
        .eq('service_type', 'gmb');

      expect(gmbTokens).toHaveLength(1);
      expect(gmbTokens[0].gmb_account_id).toBe('test-gmb-account');

      // Clean up
      await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440001');
    });
  });
});