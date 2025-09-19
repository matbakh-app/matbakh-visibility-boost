import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check, Gift, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { redeemPromoCode } from '@/lib/promo-codes'
import { toast } from 'sonner'

interface PromoCodeRedeemProps {
  onSuccess?: () => void
  className?: string
}

export function PromoCodeRedeem({ onSuccess, className }: PromoCodeRedeemProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedCode = code.trim()
    if (!trimmedCode) {
      setError('Bitte geben Sie einen Gutschein-Code ein')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await redeemPromoCode(trimmedCode)
      
      if (result.success) {
        setSuccess(result.message || 'Gutschein erfolgreich eingelöst!')
        setCode('')
        toast.success('Gutschein eingelöst!', {
          description: result.message,
          duration: 5000,
        })
        
        // Call success callback
        onSuccess?.()
        
        // Reload page after delay to get new user permissions
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(result.error || 'Fehler beim Einlösen')
        toast.error('Fehler beim Einlösen', {
          description: result.error,
        })
      }
    } catch (err) {
      console.error('Error redeeming promo code:', err)
      setError('Unerwarteter Fehler aufgetreten')
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gutschein-Code einlösen
        </CardTitle>
        <CardDescription>
          Geben Sie Ihren Gutschein-Code ein, um Premium-Features freizuschalten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="z.B. FACEBOOK_REVIEW_2025"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
              disabled={loading}
              maxLength={50}
            />
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prüfen...
                </>
              ) : (
                'Einlösen'
              )}
            </Button>
          </div>
        </form>

        {/* Success Message */}
        {success && (
          <Alert className="mt-4 border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>
              {success}
              <div className="mt-2 text-sm text-green-600">
                Die Seite wird automatisch neu geladen, um Ihre neuen Features zu aktivieren...
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Help Text */}
        <div className="mt-4 text-sm text-muted-foreground">
          💡 Beispiel-Codes für Facebook-Reviewer:
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>FACEBOOK_REVIEW_2025 - Vollzugriff für 12 Monate</li>
            <li>META_TESTING_ACCESS - Business Professional Features</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}