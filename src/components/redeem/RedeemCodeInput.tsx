import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface RedeemCodeInputProps {
  leadId: string
  onCodeRedeemed?: () => void
}

export function RedeemCodeInput({ leadId, onCodeRedeemed }: RedeemCodeInputProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: {
          code: code.toUpperCase().trim(),
          leadId
        }
      })

      if (error) {
        toast.error(`Fehler: ${error.message}`)
        return
      }

      toast.success(`Code erfolgreich eingelöst!${data.campaignTag ? ` (Kampagne: ${data.campaignTag})` : ''}`)
      setCode('')
      onCodeRedeemed?.()

    } catch (error) {
      console.error('Error redeeming code:', error)
      toast.error('Fehler beim Einlösen des Codes')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem-Code einlösen</CardTitle>
        <CardDescription>
          Geben Sie hier Ihren Redeem-Code ein, um den vollständigen Report freizuschalten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Redeem-Code</Label>
            <Input
              id="code"
              placeholder="z.B. ABCD1234"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
          
          <Button type="submit" disabled={isLoading || !code.trim()} className="w-full">
            {isLoading ? 'Code wird eingelöst...' : 'Code einlösen'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}