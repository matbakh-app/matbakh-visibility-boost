import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// MIGRATED: Supabase removed - use AWS services
import { toast } from 'sonner'

interface RedeemCodeFormProps {
  partnerId: string
  onCodeGenerated?: (code: string) => void
}

type DurationUnit = 'hours' | 'days' | 'weeks'

export function RedeemCodeForm({ partnerId, onCodeGenerated }: RedeemCodeFormProps) {
  const [description, setDescription] = useState('')
  const [campaignTag, setCampaignTag] = useState('')
  const [durationValue, setDurationValue] = useState(1)
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days')
  const [maxUses, setMaxUses] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('generate-redeem-code', {
        body: {
          partnerId,
          maxUses,
          description: description || undefined,
          campaignTag: campaignTag || undefined,
          durationValue,
          durationUnit
        }
      })

      if (error) {
        toast.error(`Fehler: ${error.message}`)
        return
      }

      toast.success(`Code generiert: ${data.code}${data.campaignTag ? ` (Kampagne: ${data.campaignTag})` : ''}`)
      
      // Reset form
      setDescription('')
      setCampaignTag('')
      setDurationValue(1)
      setDurationUnit('days')
      setMaxUses(1)

      onCodeGenerated?.(data.code)

    } catch (error) {
      console.error('Error generating code:', error)
      toast.error('Fehler beim Generieren des Codes')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neuen Redeem-Code erstellen</CardTitle>
        <CardDescription>
          Erstellen Sie einen Code für Ihre Partner oder Kunden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                placeholder="z.B. VIP-Aktion für Stammkunden"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignTag">Kampagnen-Tag (optional)</Label>
              <Input
                id="campaignTag"
                placeholder="z.B. Metro, Augustiner"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationValue">Laufzeit</Label>
              <Input
                id="durationValue"
                type="number"
                min="1"
                max="365"
                value={durationValue}
                onChange={(e) => setDurationValue(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationUnit">Einheit</Label>
              <Select value={durationUnit} onValueChange={(value: DurationUnit) => setDurationUnit(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Stunden</SelectItem>
                  <SelectItem value="days">Tage</SelectItem>
                  <SelectItem value="weeks">Wochen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max. Einlösungen</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                max="1000"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Generiere Code...' : 'Code generieren'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}