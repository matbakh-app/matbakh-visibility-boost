/**
 * Security Tests for Redeem Code Feature
 * 
 * Tests RLS policies, authorization, and data protection
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create client with limited anon key for security testing
const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

describe('Redeem Code Security', () => {
  let testPartnerId1: string;
  let testPartnerId2: string;
  let testCode1: string;
  let testCode2: string;

  beforeAll(async () => {
    // Create two test partners for cross-tenant testing
    const { data: partner1 } = await supabaseAdmin
      .from('business_partners')
      .insert({
        company_name: 'Security Test Partner 1',
        user_id: '00000000-0000-0000-0000-000000000001'
      })
      .select()
      .single();

    const { data: partner2 } = await supabaseAdmin
      .from('business_partners')
      .insert({
        company_name: 'Security Test Partner 2',
        user_id: '00000000-0000-0000-0000-000000000002'
      })
      .select()
      .single();

    testPartnerId1 = partner1.id;
    testPartnerId2 = partner2.id;

    // Create test codes for each partner
    const { data: code1 } = await supabaseAdmin
      .from('redeem_codes')
      .insert({
        code: 'SECURE01',
        partner_id: testPartnerId1,
        campaign_tag: 'SECURITY_TEST_1',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 24h from now
        max_uses: 5,
        uses: 0,
        is_active: true
      })
      .select()
      .single();

    const { data: code2 } = await supabaseAdmin
      .from('redeem_codes')
      .insert({
        code: 'SECURE02',
        partner_id: testPartnerId2,
        campaign_tag: 'SECURITY_TEST_2',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        max_uses: 5,
        uses: 0,
        is_active: true
      })
      .select()
      .single();

    testCode1 = code1.code;
    testCode2 = code2.code;
  });

  afterAll(async () => {
    // Cleanup
    await supabaseAdmin.from('redeem_codes').delete().in('partner_id', [testPartnerId1, testPartnerId2]);
    await supabaseAdmin.from('business_partners').delete().in('id', [testPartnerId1, testPartnerId2]);
  });

  describe('Row Level Security (RLS)', () => {
    it('should prevent anonymous access to redeem_codes table', async () => {
      const { data, error } = await supabaseAnon
        .from('redeem_codes')
        .select('*')
        .eq('code', testCode1);

      // Should either return empty array or access denied
      expect(data).toEqual([]);
    });

    it('should prevent direct database manipulation without proper auth', async () => {
      const { error } = await supabaseAnon
        .from('redeem_codes')
        .insert({
          code: 'HACKED01',
          partner_id: testPartnerId1,
          expires_at: new Date().toISOString(),
          max_uses: 999,
          uses: 0,
          is_active: true
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('violates row-level security policy');
    });

    it('should prevent cross-tenant data access', async () => {
      // Try to access partner 1's data while authenticated as partner 2
      // Note: This would require setting up proper auth context
      // For now, we test the function-level isolation

      const { data: reportData } = await supabaseAdmin
        .rpc('campaign_report', { pid: testPartnerId1 });

      const { data: wrongReportData } = await supabaseAdmin
        .rpc('campaign_report', { pid: testPartnerId2 });

      // Reports should be different and contain only respective partner's data
      expect(reportData).not.toEqual(wrongReportData);
      
      const partner1Tags = reportData.map((r: any) => r.campaign_tag);
      const partner2Tags = wrongReportData.map((r: any) => r.campaign_tag);
      
      expect(partner1Tags).toContain('SECURITY_TEST_1');
      expect(partner1Tags).not.toContain('SECURITY_TEST_2');
      expect(partner2Tags).toContain('SECURITY_TEST_2');
      expect(partner2Tags).not.toContain('SECURITY_TEST_1');
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should reject malicious code strings', async () => {
      const maliciousCodes = [
        "'; DROP TABLE redeem_codes; --",
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        'UNION SELECT * FROM auth.users',
        '${process.env.SECRET_KEY}'
      ];

      for (const maliciousCode of maliciousCodes) {
        const { data } = await supabaseAdmin.functions.invoke('redeem-code', {
          body: {
            code: maliciousCode,
            leadId: '00000000-0000-0000-0000-000000000001'
          }
        });

        expect(data.error).toBeTruthy();
        expect(data.error).toContain('Ungültiger Code');
      }
    });

    it('should validate partner ID format', async () => {
      const invalidPartnerIds = [
        'not-a-uuid',
        '12345',
        '',
        null,
        undefined,
        '00000000-0000-0000-0000-00000000000g' // Invalid UUID character
      ];

      for (const invalidId of invalidPartnerIds) {
        const { data } = await supabaseAdmin.functions.invoke('generate-redeem-code', {
          body: {
            partnerId: invalidId,
            maxUses: 1,
            durationValue: 1,
            durationUnit: 'days'
          }
        });

        expect(data.error).toBeTruthy();
      }
    });
  });

  describe('Rate Limiting & Abuse Prevention', () => {
    it('should prevent code enumeration attacks', async () => {
      const attempts = [];
      
      // Try multiple invalid codes rapidly
      for (let i = 0; i < 10; i++) {
        const attempt = supabaseAdmin.functions.invoke('redeem-code', {
          body: {
            code: `INVALID${i.toString().padStart(2, '0')}`,
            leadId: '00000000-0000-0000-0000-000000000001'
          }
        });
        attempts.push(attempt);
      }

      const results = await Promise.all(attempts);
      
      // All should fail with consistent error message (no timing attacks)
      results.forEach(result => {
        expect(result.data.error).toContain('Ungültiger Code');
      });
    });

    it('should prevent brute force on max_uses', async () => {
      // Create a code with 1 max use
      const { data: testCode } = await supabaseAdmin
        .from('redeem_codes')
        .insert({
          code: 'BRUTETEST',
          partner_id: testPartnerId1,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          max_uses: 1,
          uses: 0,
          is_active: true
        })
        .select()
        .single();

      // Create test lead
      const { data: lead } = await supabaseAdmin
        .from('visibility_check_leads')
        .insert({
          email: 'brute-test@example.com',
          business_name: 'Brute Test',
          status: 'completed',
          hasSubscription: false
        })
        .select()
        .single();

      // First redemption should succeed
      const { data: firstAttempt } = await supabaseAdmin.functions.invoke('redeem-code', {
        body: { code: 'BRUTETEST', leadId: lead.id }
      });
      expect(firstAttempt.success).toBe(true);

      // Subsequent attempts should fail consistently
      for (let i = 0; i < 5; i++) {
        const { data: attempt } = await supabaseAdmin.functions.invoke('redeem-code', {
          body: { code: 'BRUTETEST', leadId: lead.id }
        });
        expect(attempt.error).toContain('vollständig eingelöst');
      }

      // Cleanup
      await supabaseAdmin.from('redeem_codes').delete().eq('code', 'BRUTETEST');
      await supabaseAdmin.from('visibility_check_leads').delete().eq('id', lead.id);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain ACID properties during concurrent redemptions', async () => {
      // Create code with limited uses
      const { data: concurrentCode } = await supabaseAdmin
        .from('redeem_codes')
        .insert({
          code: 'CONCURRENT',
          partner_id: testPartnerId1,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          max_uses: 3,
          uses: 0,
          is_active: true
        })
        .select()
        .single();

      // Create multiple leads
      const leadIds = [];
      for (let i = 0; i < 5; i++) {
        const { data: lead } = await supabaseAdmin
          .from('visibility_check_leads')
          .insert({
            email: `concurrent-${i}@example.com`,
            business_name: `Concurrent Test ${i}`,
            status: 'completed',
            hasSubscription: false
          })
          .select()
          .single();
        leadIds.push(lead.id);
      }

      // Attempt concurrent redemptions
      const concurrentAttempts = leadIds.map(leadId =>
        supabaseAdmin.functions.invoke('redeem-code', {
          body: { code: 'CONCURRENT', leadId }
        })
      );

      const results = await Promise.all(concurrentAttempts);
      
      // Only 3 should succeed (max_uses = 3)
      const successful = results.filter(r => r.data.success === true);
      const failed = results.filter(r => r.data.error);

      expect(successful.length).toBe(3);
      expect(failed.length).toBe(2);

      // Verify final state
      const { data: finalCode } = await supabaseAdmin
        .from('redeem_codes')
        .select('uses')
        .eq('code', 'CONCURRENT')
        .single();

      expect(finalCode.uses).toBe(3);

      // Cleanup
      await supabaseAdmin.from('redeem_codes').delete().eq('code', 'CONCURRENT');
      await supabaseAdmin.from('visibility_check_leads').delete().in('id', leadIds);
    });
  });
});