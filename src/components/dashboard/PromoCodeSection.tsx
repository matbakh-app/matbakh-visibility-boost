import { useState, useEffect } from 'react'
import { PromoCodeRedeem } from '@/components/PromoCodeRedeem'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { getUserPromoUsage } from '@/lib/promo-codes'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift, Clock, Shield, Loader2 } from 'lucide-react'

interface PromoUsage {
  id: string
  used_at: string
  promo_codes: {
    code: string
    description: string
    granted_features: string[]
    granted_role: string
    is_review_code: boolean
  }
}

export function PromoCodeSection() {
  const { access, loading } = useFeatureAccess()
  const [promoUsage, setPromoUsage] = useState<PromoUsage[]>([])
  const [usageLoading, setUsageLoading] = useState(true)

  useEffect(() => {
    loadPromoUsage()
  }, [])

  const loadPromoUsage = async () => {
    try {
      const { data, error } = await getUserPromoUsage()
      if (data) {
        setPromoUsage(data as PromoUsage[])
      }
      if (error) {
        console.error('Error loading promo usage:', error)
      }
    } catch (error) {
      console.error('Error loading promo usage:', error)
    } finally {
      setUsageLoading(false)
    }
  }

  const handleRedeemSuccess = () => {
    loadPromoUsage()
  }

  if (loading || usageLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Promo Code Redeem */}
      <PromoCodeRedeem onSuccess={handleRedeemSuccess} />
      
      {/* Current Feature Access */}
      {access.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Ihre aktiven Premium-Features
            </CardTitle>
            <CardDescription>
              Features, die durch Gutschein-Codes freigeschaltet wurden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {access.features.map(feature => (
                <Badge key={feature} variant="secondary">
                  {getFeatureDisplayName(feature)}
                </Badge>
              ))}
            </div>
            
            {access.accessUntil && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {access.isExpired 
                  ? <span className="text-red-600">⚠️ Zugriff abgelaufen</span>
                  : <span className="text-green-600">
                      Aktiv bis {access.accessUntil.toLocaleDateString('de-DE')}
                    </span>
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Promo Code Usage History */}
      {promoUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Eingelöste Gutscheine
            </CardTitle>
            <CardDescription>
              Ihre Gutschein-Verlauf und gewährte Berechtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {promoUsage.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium">{usage.promo_codes?.code}</span>
                      {usage.promo_codes?.is_review_code && (
                        <Badge variant="outline" className="text-xs">
                          Review Code
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {usage.promo_codes?.description}
                    </p>
                    {usage.promo_codes?.granted_features && (
                      <div className="flex flex-wrap gap-1">
                        {usage.promo_codes.granted_features.map((feature: string) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {getFeatureDisplayName(feature)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(usage.used_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getFeatureDisplayName(feature: string): string {
  const displayNames: Record<string, string> = {
    'business_analytics': 'Business Analytics',
    'premium_features': 'Premium Features',
    'export_reports': 'Report Export',
    'ai_recommendations': 'KI-Empfehlungen',
    'advanced_dashboard': 'Erweiterte Dashboard',
    'multi_location': 'Mehrere Standorte',
    'team_management': 'Team-Verwaltung'
  }
  return displayNames[feature] || feature
}