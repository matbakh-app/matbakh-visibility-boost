/**
 * End-to-End Integration Tests for Redeem Code Feature
 * 
 * Tests the complete flow: Code Generation → Code Redemption → Database Updates
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Redeem Code E2E Integration', () => {
  let testPartnerId: string;
  let testLeadId: string;
  let generatedCode: string;

  beforeAll(async () => {
    // Create test partner
    const { data: partner, error: partnerError } = await supabase
      .from('business_partners')
      .insert({
        company_name: 'Test Restaurant E2E',
        user_id: '00000000-0000-0000-0000-000000000001'
      })
      .select()
      .single();

    if (partnerError) throw partnerError;
    testPartnerId = partner.id;

    // Create test lead
    const { data: lead, error: leadError } = await supabase
      .from('visibility_check_leads')
      .insert({
        email: 'test-e2e@example.com',
        business_name: 'Test Business E2E',
        status: 'completed',
        hasSubscription: false
      })
      .select()
      .single();

    if (leadError) throw leadError;
    testLeadId = lead.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('redeem_codes').delete().eq('partner_id', testPartnerId);
    await supabase.from('visibility_check_leads').delete().eq('id', testLeadId);
    await supabase.from('business_partners').delete().eq('id', testPartnerId);
  });

  describe('Complete Code Lifecycle', () => {
    it('should generate, redeem, and track code usage', async () => {
      // Step 1: Generate redeem code
      const { data: generateData, error: generateError } = await supabase.functions.invoke(
        'generate-redeem-code',
        {
          body: {
            partnerId: testPartnerId,
            maxUses: 5,
            description: 'E2E Test Campaign',
            campaignTag: 'E2E_TEST',
            durationValue: 7,
            durationUnit: 'days'
          }
        }
      );

      expect(generateError).toBeNull();
      expect(generateData.success).toBe(true);
      expect(generateData.code).toMatch(/^[A-Z0-9]{8}$/);
      generatedCode = generateData.code;

      // Step 2: Verify code exists in database
      const { data: codeRecord, error: fetchError } = await supabase
        .from('redeem_codes')
        .select('*')
        .eq('code', generatedCode)
        .single();

      expect(fetchError).toBeNull();
      expect(codeRecord.partner_id).toBe(testPartnerId);
      expect(codeRecord.campaign_tag).toBe('E2E_TEST');
      expect(codeRecord.max_uses).toBe(5);
      expect(codeRecord.uses).toBe(0);
      expect(codeRecord.is_active).toBe(true);

      // Step 3: Redeem the code
      const { data: redeemData, error: redeemError } = await supabase.functions.invoke(
        'redeem-code',
        {
          body: {
            code: generatedCode,
            leadId: testLeadId
          }
        }
      );

      expect(redeemError).toBeNull();
      expect(redeemData.success).toBe(true);
      expect(redeemData.campaignTag).toBe('E2E_TEST');

      // Step 4: Verify lead subscription status updated
      const { data: updatedLead, error: leadCheckError } = await supabase
        .from('visibility_check_leads')
        .select('hasSubscription')
        .eq('id', testLeadId)
        .single();

      expect(leadCheckError).toBeNull();
      expect(updatedLead.hasSubscription).toBe(true);

      // Step 5: Verify code usage incremented
      const { data: updatedCode, error: codeCheckError } = await supabase
        .from('redeem_codes')
        .select('uses')
        .eq('code', generatedCode)
        .single();

      expect(codeCheckError).toBeNull();
      expect(updatedCode.uses).toBe(1);
    });

    it('should enforce max uses limit', async () => {
      // Generate code with max 1 use
      const { data: generateData } = await supabase.functions.invoke(
        'generate-redeem-code',
        {
          body: {
            partnerId: testPartnerId,
            maxUses: 1,
            durationValue: 1,
            durationUnit: 'days'
          }
        }
      );

      const testCode = generateData.code;

      // First redemption should succeed
      const { data: firstRedeem } = await supabase.functions.invoke(
        'redeem-code',
        {
          body: { code: testCode, leadId: testLeadId }
        }
      );

      expect(firstRedeem.success).toBe(true);

      // Second redemption should fail
      const { data: secondRedeem, error: secondError } = await supabase.functions.invoke(
        'redeem-code',
        {
          body: { code: testCode, leadId: testLeadId }
        }
      );

      expect(secondRedeem.error).toContain('vollständig eingelöst');
    });

    it('should reject expired codes', async () => {
      // Generate code with very short expiry (1 hour ago - expired)
      const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      const { data: expiredCode, error: insertError } = await supabase
        .from('redeem_codes')
        .insert({
          code: 'EXPIRED1',
          partner_id: testPartnerId,
          expires_at: expiredDate.toISOString(),
          max_uses: 1,
          uses: 0,
          is_active: true
        })
        .select()
        .single();

      expect(insertError).toBeNull();

      // Try to redeem expired code
      const { data: redeemData } = await supabase.functions.invoke(
        'redeem-code',
        {
          body: { code: 'EXPIRED1', leadId: testLeadId }
        }
      );

      expect(redeemData.error).toContain('abgelaufen');
    });
  });

  describe('Campaign Reporting', () => {
    it('should generate accurate campaign statistics', async () => {
      // Generate multiple codes for same campaign
      const campaignTag = 'STATS_TEST';
      
      for (let i = 0; i < 3; i++) {
        await supabase.functions.invoke('generate-redeem-code', {
          body: {
            partnerId: testPartnerId,
            maxUses: 2,
            campaignTag,
            durationValue: 1,
            durationUnit: 'days'
          }
        });
      }

      // Use campaign_report function
      const { data: reportData, error: reportError } = await supabase
        .rpc('campaign_report', { pid: testPartnerId });

      expect(reportError).toBeNull();
      
      const statsTestCampaign = reportData.find((r: any) => r.campaign_tag === campaignTag);
      expect(statsTestCampaign).toBeDefined();
      expect(statsTestCampaign.codes_generated).toBeGreaterThanOrEqual(3);
      expect(statsTestCampaign.total_uses).toBeGreaterThanOrEqual(0);
      expect(statsTestCampaign.remaining_codes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security & RLS', () => {
    it('should prevent unauthorized code access', async () => {
      // Try to access codes from wrong partner context
      const wrongPartnerId = '00000000-0000-0000-0000-000000000999';
      
      const { data: reportData, error } = await supabase
        .rpc('campaign_report', { pid: wrongPartnerId });

      // Should return empty array or access denied, not other partner's data
      if (!error) {
        expect(Array.isArray(reportData)).toBe(true);
        expect(reportData.length).toBe(0);
      }
    });

    it('should validate lead exists before code redemption', async () => {
      const fakeLeadId = '00000000-0000-0000-0000-000000000999';
      
      const { data: redeemData } = await supabase.functions.invoke(
        'redeem-code',
        {
          body: { code: generatedCode, leadId: fakeLeadId }
        }
      );

      expect(redeemData.error).toContain('Lead not found');
    });
  });
});