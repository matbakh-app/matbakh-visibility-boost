import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVisibilityResults } from '@/hooks/useVisibilityResults';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Mail, FileText } from 'lucide-react';

const VisibilityCheckVerified: React.FC = () => {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const status = searchParams.get('status');
  
  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { data: visibilityResult } = useVisibilityResults(leadId || undefined);

  useEffect(() => {
    const fetchLeadData = async () => {
      if (!leadId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('visibility_check_leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (error) {
          console.error('Error fetching lead:', error);
        } else {
          setLeadData(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Laden...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isSuccess = status === 'success' && leadData?.double_optin_confirmed;
  const hasReport = leadData?.report_sent_at;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          {isSuccess ? (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-3xl font-bold text-green-600">
                E-Mail erfolgreich bestätigt!
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Vielen Dank! Ihr Sichtbarkeits-Report für{' '}
                <strong>{leadData?.business_name}</strong> wird nun erstellt und 
                innerhalb der nächsten Minuten an{' '}
                <strong>{leadData?.email}</strong> versendet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h1 className="text-3xl font-bold text-red-600">
                Verifizierung fehlgeschlagen
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Der Verifizierungslink ist ungültig oder bereits abgelaufen.
                Bitte starten Sie einen neuen Sichtbarkeits-Check.
              </p>
            </div>
          )}
        </div>

        {isSuccess && leadData && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Status Ihres Reports</h2>
                  <Badge variant={hasReport ? "default" : "secondary"}>
                    {hasReport ? "Report versendet" : "Report wird erstellt"}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>E-Mail bestätigt</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {hasReport ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>
                      {hasReport ? "Report per E-Mail versendet" : "Report wird erstellt..."}
                    </span>
                  </div>
                </div>

                {hasReport && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">
                        Report wurde am {new Date(hasReport).toLocaleString('de-DE')} versendet
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {visibilityResult && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Ihre Sichtbarkeits-Auswertung
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(visibilityResult as any).overall_score || visibilityResult.visibility_score || 'N/A'}%
                      </div>
                      <div className="text-sm text-gray-600">Gesamtbewertung</div>
                    </div>
                    
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(visibilityResult as any).platform_analyses?.length || 
                         (visibilityResult.provider ? 1 : 0) || 0}
                      </div>
                      <div className="text-sm text-gray-600">Analysierte Plattformen</div>
                    </div>
                    
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(visibilityResult as any).quick_wins?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Sofort-Empfehlungen</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-4">
                <Link to="/#visibility-check">
                  <Button>
                    Neuen Check starten
                  </Button>
                </Link>
                
                <Link to="/business">
                  <Button variant="outline">
                    Mehr über unsere Services
                  </Button>
                </Link>
              </div>
              
              <p className="text-sm text-gray-500">
                Bei Fragen kontaktieren Sie uns gerne unter mail@matbakh.app
              </p>
            </div>
          </div>
        )}

        {!isSuccess && (
          <div className="text-center space-y-4 mt-8">
            <Link to="/#visibility-check">
              <Button>
                Neuen Sichtbarkeits-Check starten
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VisibilityCheckVerified;