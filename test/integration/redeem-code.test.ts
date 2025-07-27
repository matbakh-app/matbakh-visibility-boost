import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Redeem-Code Workflow', () => {
  let partnerId: string
  let leadId: string
  let code: string

  beforeAll(async () => {
    // 1) Test-Partner und Test-Lead anlegen
    const { data: partner } = await supabase
      .from('business_partners')
      .insert({ company_name: 'Test Partner Redeem', contact_email: 'redeem@partner.test' })
      .select('id')
      .single()
    partnerId = partner!.id

    const { data: lead } = await supabase
      .from('visibility_check_leads')
      .insert({
        business_name: 'Test Redeem Bistro',
        email: 'redeem@lead.test',
        status: 'pending',
      })
      .select('id')
      .single()
    leadId = lead!.id
  })

  afterAll(async () => {
    // Aufräumen
    await supabase.from('redeem_codes').delete().eq('partner_id', partnerId)
    await supabase.from('visibility_check_leads').delete().eq('id', leadId)
    await supabase.from('business_partners').delete().eq('id', partnerId)
  })

  describe('Code Generation with Flexible Duration', () => {
    it('generates a redeem code with hours duration', async () => {
      const { data, error } = await supabase.functions.invoke('generate-redeem-code', {
        body: {
          partnerId,
          maxUses: 1,
          durationValue: 12,
          durationUnit: 'hours'
        }
      })

      expect(error).toBeNull()
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('duration', '12 hours')
      expect(data.code).toHaveLength(8)

      // Verify expiration time (should be ~12 hours from now)
      const { data: dbCode } = await supabase
        .from('redeem_codes')
        .select('expires_at')
        .eq('code', data.code)
        .single()

      const expiresAt = new Date(dbCode.expires_at).getTime()
      const expectedExpiry = Date.now() + (12 * 3600_000)
      const diff = Math.abs(expiresAt - expectedExpiry)
      expect(diff).toBeLessThan(5000) // Allow 5 second tolerance
    })

    it('generates a redeem code with days duration', async () => {
      const { data, error } = await supabase.functions.invoke('generate-redeem-code', {
        body: {
          partnerId,
          maxUses: 2,
          durationValue: 7,
          durationUnit: 'days'
        }
      })

      expect(error).toBeNull()
      expect(data).toHaveProperty('duration', '7 days')

      code = data.code

      // Verify DB entry
      const { data: dbCode } = await supabase
        .from('redeem_codes')
        .select('*')
        .eq('code', code)
        .single()

      expect(dbCode.partner_id).toBe(partnerId)
      expect(dbCode.max_uses).toBe(2)
      expect(dbCode.uses).toBe(0)

      // Check expiration (~7 days from now)
      const expiresAt = new Date(dbCode.expires_at).getTime()
      const expectedExpiry = Date.now() + (7 * 24 * 3600_000)
      const diff = Math.abs(expiresAt - expectedExpiry)
      expect(diff).toBeLessThan(60000) // Allow 1 minute tolerance
    })

    it('generates a redeem code with weeks duration', async () => {
      const { data, error } = await supabase.functions.invoke('generate-redeem-code', {
        body: {
          partnerId,
          maxUses: 1,
          durationValue: 2,
          durationUnit: 'weeks'
        }
      })

      expect(error).toBeNull()
      expect(data).toHaveProperty('duration', '2 weeks')

      // Verify expiration time (~2 weeks from now)
      const { data: dbCode } = await supabase
        .from('redeem_codes')
        .select('expires_at')
        .eq('code', data.code)
        .single()

      const expiresAt = new Date(dbCode.expires_at).getTime()
      const expectedExpiry = Date.now() + (2 * 7 * 24 * 3600_000)
      const diff = Math.abs(expiresAt - expectedExpiry)
      expect(diff).toBeLessThan(60000) // Allow 1 minute tolerance
    })

    it('generates a personalized code with campaign tag', async () => {
      const { data, error } = await supabase.functions.invoke('generate-redeem-code', {
        body: {
          partnerId,
          maxUses: 1,
          durationValue: 3,
          durationUnit: 'days',
          description: 'VIP-Aktion',
          campaignTag: 'Augustiner'
        }
      })

      expect(error).toBeNull()
      expect(data.campaignTag).toBe('Augustiner')

      // DB-Verifikation
      const { data: row } = await supabase
        .from('redeem_codes')
        .select('campaign_tag, description')
        .eq('code', data.code)
        .single()

      expect(row.campaign_tag).toBe('Augustiner')
      expect(row.description).toBe('VIP-Aktion')
    })
  })

  describe('Code Redemption', () => {
    it('redeems the code successfully', async () => {
      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: { code, leadId }
      })

      expect(error).toBeNull()
      expect(data).toHaveProperty('success', true)

      // DB-Checks
      const { data: codeRow } = await supabase
        .from('redeem_codes')
        .select('uses')
        .eq('code', code)
        .single()
      expect(codeRow.uses).toBe(1)

      const { data: leadRow } = await supabase
        .from('visibility_check_leads')
        .select('hasSubscription')
        .eq('id', leadId)
        .single()
      expect(leadRow.hasSubscription).toBe(true)
    })

    it('enforces maxUses limit', async () => {
      // 1 weitere Einlösung (should work - max_uses is 2)
      const { data: d2, error: e2 } = await supabase.functions.invoke('redeem-code', {
        body: { code, leadId }
      })
      expect(e2).toBeNull()
      expect(d2).toHaveProperty('success', true)

      // 3. Versuch sollte fehlschlagen
      const { data: d3, error: e3 } = await supabase.functions.invoke('redeem-code', {
        body: { code, leadId }
      })
      expect(d3).toBeNull()
      expect(e3!.message).toMatch(/bereits vollständig eingelöst/)
    })

    it('rejects invalid codes', async () => {
      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: { code: 'INVALIDCODE', leadId }
      })
      expect(data).toBeNull()
      expect(error!.message).toMatch(/Ungültiger Code/)
    })

    it('rejects expired codes', async () => {
      // Create expired code
      const { data: expiredCodeData } = await supabase.functions.invoke('generate-redeem-code', {
        body: {
          partnerId,
          maxUses: 1,
          durationValue: 1,
          durationUnit: 'hours'
        }
      })

      // Manually expire it in DB
      await supabase
        .from('redeem_codes')
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq('code', expiredCodeData.code)

      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: { code: expiredCodeData.code, leadId }
      })

      expect(data).toBeNull()
      expect(error!.message).toMatch(/Code abgelaufen/)
    })
  })

  describe('Campaign Report Function', () => {
    it('returns campaign statistics', async () => {
      const { data, error } = await supabase.rpc('campaign_report', { pid: partnerId })
      
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      if (data.length > 0) {
        const firstCampaign = data[0]
        expect(firstCampaign).toHaveProperty('campaign_tag')
        expect(firstCampaign).toHaveProperty('codes_generated')
        expect(firstCampaign).toHaveProperty('codes_used')
        expect(firstCampaign).toHaveProperty('total_uses')
      }
    })
  })
})