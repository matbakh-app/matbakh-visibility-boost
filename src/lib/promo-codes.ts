import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type PromoCode = Database['public']['Tables']['promo_codes']['Row']
type PromoCodeUsage = Database['public']['Tables']['promo_code_usage']['Row']

export interface PromoCodeValidationResult {
  success: boolean
  error?: string
  promoCode?: PromoCode
  message?: string
}

export async function redeemPromoCode(code: string): Promise<PromoCodeValidationResult> {
  try {
    // 1. User Authentication Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Bitte melden Sie sich zuerst an' }
    }

    // 2. Promo-Code validieren
    const { data: promoCode, error: fetchError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('status', 'active')
      .single()

    if (fetchError || !promoCode) {
      return { success: false, error: 'Ungültiger oder inaktiver Gutschein-Code' }
    }

    // 3. Verfügbarkeit prüfen
    if (promoCode.current_uses >= promoCode.max_uses) {
      return { success: false, error: 'Gutschein-Code bereits aufgebraucht' }
    }

    // 4. Gültigkeit prüfen
    if (promoCode.valid_until && new Date() > new Date(promoCode.valid_until)) {
      return { success: false, error: 'Gutschein-Code abgelaufen' }
    }

    // 5. Bereits verwendet?
    const { data: existingUsage, error: usageCheckError } = await supabase
      .from('promo_code_usage')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (usageCheckError) {
      console.error('Usage check error:', usageCheckError)
      return { success: false, error: 'Fehler bei der Validierung' }
    }

    if (existingUsage) {
      return { success: false, error: 'Gutschein-Code bereits von Ihnen verwendet' }
    }

    // 6. Transaktion: Usage erstellen + Counter erhöhen + Profil aktualisieren
    const { error: transactionError } = await supabase.rpc('redeem_promo_code_transaction', {
      p_promo_code_id: promoCode.id,
      p_user_id: user.id,
      p_granted_features: promoCode.granted_features || [],
      p_granted_role: promoCode.granted_role || 'user'
    })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return { success: false, error: 'Fehler beim Einlösen des Codes' }
    }

    // 7. Session refresh für neue JWT Claims
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      console.warn('Session refresh warning:', refreshError)
      // Not critical, user can refresh manually
    }

    return { 
      success: true, 
      promoCode,
      message: `Gutschein erfolgreich eingelöst: ${promoCode.description}`
    }

  } catch (error) {
    console.error('Unexpected error in redeemPromoCode:', error)
    return { success: false, error: 'Unerwarteter Fehler beim Einlösen' }
  }
}

export async function getUserPromoUsage() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('promo_code_usage')
    .select(`
      *,
      promo_codes (
        code,
        description,
        granted_features,
        granted_role,
        is_review_code
      )
    `)
    .eq('user_id', user.id)
    .order('used_at', { ascending: false })

  return { data, error }
}

export async function getActivePromoCodes() {
  // Nur für Admins - prüfe in Component
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return { data, error }
}