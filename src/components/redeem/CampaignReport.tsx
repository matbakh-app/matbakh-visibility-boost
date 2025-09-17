import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
// MIGRATED: Supabase removed - use AWS services
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface RedeemCode {
  id: string
  code: string
  partner_id: string
  description?: string
  campaign_tag?: string
  expires_at: string
  max_uses: number
  uses: number
  created_at: string
  updated_at: string
  is_active: boolean
}

interface CampaignStat {
  campaign_tag: string | null
  codes_generated: number
  codes_used: number
  total_uses: number
}

interface CampaignReportProps {
  partnerId: string
}

export function CampaignReport({ partnerId }: CampaignReportProps) {
  // Mock data until redeem_codes table is migrated and available in types
  const codes: RedeemCode[] = []
  const campaignStats: CampaignStat[] = []
  const isLoading = false

  // TODO: Replace with real queries once table is migrated:
  // const { data: codes, isLoading } = useQuery({
  //   queryKey: ['redeem-codes', partnerId],
  //   queryFn: async () => {
  //     const { data, error } = await supabase
  //       .from('redeem_codes')
  //       .select('*')
  //       .eq('partner_id', partnerId)
  //       .order('created_at', { ascending: false })
  //     if (error) throw error
  //     return data as RedeemCode[]
  //   }
  // })

  if (isLoading) {
    return <div>Lade Kampagnen-Report...</div>
  }

  const getRemainingDays = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getStatusBadge = (code: RedeemCode) => {
    const remainingDays = getRemainingDays(code.expires_at)
    const remainingUses = code.max_uses - code.uses

    if (remainingDays === 0) {
      return <Badge variant="destructive">Abgelaufen</Badge>
    }
    if (remainingUses === 0) {
      return <Badge variant="secondary">Vollständig eingelöst</Badge>
    }
    if (!code.is_active) {
      return <Badge variant="outline">Deaktiviert</Badge>
    }
    return <Badge variant="default">Aktiv</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Campaign Statistics */}
      {campaignStats && campaignStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kampagnen-Statistiken</CardTitle>
            <CardDescription>Übersicht über Ihre Redeem-Code-Kampagnen</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampagne</TableHead>
                  <TableHead>Generierte Codes</TableHead>
                  <TableHead>Eingelöste Codes</TableHead>
                  <TableHead>Gesamt-Einlösungen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignStats.map((stat) => (
                  <TableRow key={stat.campaign_tag || 'no-tag'}>
                    <TableCell>{stat.campaign_tag || '—'}</TableCell>
                    <TableCell>{stat.codes_generated}</TableCell>
                    <TableCell>{stat.codes_used}</TableCell>
                    <TableCell>{stat.total_uses}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detailed Code List */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Redeem-Codes</CardTitle>
          <CardDescription>Detaillierte Liste aller generierten Codes</CardDescription>
        </CardHeader>
        <CardContent>
          {!codes || codes.length === 0 ? (
            <p className="text-muted-foreground">Noch keine Codes generiert.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Kampagne</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verwendung</TableHead>
                  <TableHead>Ablauf</TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>{code.campaign_tag || '—'}</TableCell>
                    <TableCell>{code.description || '—'}</TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>
                      {code.uses} / {code.max_uses}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(code.expires_at).toLocaleDateString('de-DE')}</div>
                        <div className="text-muted-foreground">
                          {getRemainingDays(code.expires_at) > 0
                            ? `${getRemainingDays(code.expires_at)} Tage verbleibend`
                            : 'Abgelaufen'
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(code.created_at), {
                        addSuffix: true,
                        locale: de
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}