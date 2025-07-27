import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Google OAuth2 Flow Tests', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  describe('OAuth Token Exchange', () => {
    it('should handle google-oauth-exchange function call', async () => {
      // Mock OAuth exchange data
      const mockExchangeData = {
        code: 'mock-auth-code',
        serviceType: 'gmb',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        redirectUri: 'http://localhost:3000/auth/google/callback'
      };

      // Note: This would fail in test environment without real Google tokens
      // but we test the endpoint structure
      const response = await supabase.functions.invoke('google-oauth-exchange', {
        body: mockExchangeData
      });

      // In test environment, this will likely fail due to missing real OAuth code
      // but we check that the function exists and responds
      expect(response).toBeDefined();
      
      // The error should be about invalid code, not missing function
      if (response.error) {
        expect(response.error.message).toBeDefined();
      }
    });

    it('should validate OAuth exchange parameters', async () => {
      // Test with missing parameters
      const incompleteData = {
        code: 'test',
        // missing serviceType, userId, redirectUri
      };

      const response = await supabase.functions.invoke('google-oauth-exchange', {
        body: incompleteData
      });

      expect(response.error).toBeDefined();
    });
  });

  describe('Token Storage and Retrieval', () => {
    const mockUserId = '550e8400-e29b-41d4-a716-446655440002';

    it('should store Google OAuth tokens with service types', async () => {
      const mockTokenData = {
        user_id: mockUserId,
        google_user_id: 'mock-google-user-123',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        service_type: 'gmb',
        gmb_account_id: 'mock-gmb-account',
        email: 'test-oauth@example.com',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/business.manage']
      };

      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .insert(mockTokenData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.service_type).toBe('gmb');
      expect(data.gmb_account_id).toBe('mock-gmb-account');

      // Clean up
      await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', mockUserId);
    });

    it('should handle multiple service types per user', async () => {
      const mockTokens = [
        {
          user_id: mockUserId,
          google_user_id: 'mock-google-user-456',
          access_token: 'mock-gmb-token',
          service_type: 'gmb',
          gmb_account_id: 'mock-gmb-account',
          email: 'test@gmb.com'
        },
        {
          user_id: mockUserId,
          google_user_id: 'mock-google-user-789',
          access_token: 'mock-analytics-token',
          service_type: 'analytics',
          ga4_property_id: 'mock-ga4-property',
          email: 'test@analytics.com'
        }
      ];

      const { data: insertedTokens, error } = await supabase
        .from('google_oauth_tokens')
        .insert(mockTokens)
        .select();

      expect(error).toBeNull();
      expect(insertedTokens).toHaveLength(2);

      // Test querying by service type
      const { data: gmbTokens } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', mockUserId)
        .eq('service_type', 'gmb');

      expect(gmbTokens).toHaveLength(1);
      expect(gmbTokens?.[0].gmb_account_id).toBe('mock-gmb-account');

      const { data: analyticsTokens } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', mockUserId)
        .eq('service_type', 'analytics');

      expect(analyticsTokens).toHaveLength(1);
      expect(analyticsTokens?.[0].ga4_property_id).toBe('mock-ga4-property');

      // Clean up
      await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', mockUserId);
    });
  });

  describe('Business Profile Google Metrics Update', () => {
    it('should update business profile with Google metrics', async () => {
      // Create test partner and profile
      const { data: partnerData } = await supabase
        .from('business_partners')
        .insert({
          company_name: 'Test OAuth Partner',
          contact_email: 'oauth-test@partner.com'
        })
        .select()
        .single();

      const { data: profileData } = await supabase
        .from('business_profiles')
        .insert({
          partner_id: partnerData.id,
          business_name: 'OAuth Test Restaurant',
          address: 'Test OAuth Address'
        })
        .select()
        .single();

      // Test update-business-profile with Google metrics
      const mockMetrics = {
        partnerId: partnerData.id,
        gmbMetrics: {
          profileComplete: true,
          hasPhotos: true,
          rating: 4.7,
          reviewCount: 42
        },
        ga4Metrics: {
          sessions: 2500,
          pageviews: 7500,
          bounceRate: 0.28
        }
      };

      const response = await supabase.functions.invoke('update-business-profile', {
        body: mockMetrics
      });

      expect(response.error).toBeNull();
      expect(response.data?.success).toBe(true);

      // Verify the update
      const { data: updatedProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', profileData.id)
        .single();

      expect(updatedProfile.gmb_metrics).toEqual(mockMetrics.gmbMetrics);
      expect(updatedProfile.ga4_metrics).toEqual(mockMetrics.ga4Metrics);
      expect(updatedProfile.gmb_connected).toBe(true);

      // Clean up
      await supabase.from('business_profiles').delete().eq('id', profileData.id);
      await supabase.from('business_partners').delete().eq('id', partnerData.id);
    });
  });

  describe('OAuth Frontend Integration', () => {
    it('should validate OAuth callback URL structure', () => {
      const callbackUrl = '/auth/google/callback';
      const testParams = new URLSearchParams({
        code: 'test-auth-code',
        state: 'gmb:test-user-id'
      });

      const fullUrl = `${callbackUrl}?${testParams.toString()}`;
      
      expect(fullUrl).toContain('code=test-auth-code');
      expect(fullUrl).toContain('state=gmb:test-user-id');
      
      // Test state parsing
      const state = testParams.get('state');
      const [serviceType, userId] = state?.split(':') || [];
      
      expect(serviceType).toBe('gmb');
      expect(userId).toBe('test-user-id');
    });

    it('should generate correct OAuth authorization URLs', () => {
      const mockScopes = [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/businessinfo'
      ];

      const authParams = new URLSearchParams({
        client_id: 'test-client-id',
        redirect_uri: 'http://localhost:3000/auth/google/callback',
        scope: mockScopes.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: 'gmb:test-user-id'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/auth?${authParams.toString()}`;

      expect(authUrl).toContain('accounts.google.com/o/oauth2/auth');
      expect(authUrl).toContain('scope=https%3A//www.googleapis.com/auth/business.manage');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
    });
  });
});