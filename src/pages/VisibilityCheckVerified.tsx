import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Mail, FileText, AlertCircle, Loader2 } from 'lucide-react';

const VisibilityCheckVerified: React.FC = () => {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const status = searchParams.get('status');
  
  const [leadData, setLeadData] = useState<any>(null);
  const [visibilityResult, setVisibilityResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Polling function to fetch lead data and results
  const fetchData = useCallback(async () => {
    if (!leadId) {
      setLoading(false);
      setError('Keine Lead-ID gefunden');
      return;
    }

    try {
      setError(null);
      
      // Fetch lead data
      const { data: leadData, error: leadError } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        setError('Fehler beim Abruf des Reports');
        return;
      }

      setLeadData(leadData);

      // Fetch visibility results if available
      const { data: resultData, error: resultError } = await supabase
        .from('visibility_check_results')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (!resultError && resultData) {
        setVisibilityResult(resultData);
      }

      // If report URL is not available yet and status is not failed, start polling
      if (!leadData.report_url && leadData.status !== 'failed' && leadData.double_optin_confirmed) {
        if (!pollInterval) {
          console.log('Starting polling for report generation...');
          const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
          setPollInterval(interval);
        }
      } else if (pollInterval) {
        // Stop polling when report is ready or failed
        console.log('Stopping polling - report ready or failed');
        clearInterval(pollInterval);
        setPollInterval(null);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Unerwarteter Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, [leadId, pollInterval]);

  useEffect(() => {
    fetchData();
    
    // Cleanup polling on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [fetchData]);

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

  // Handle different states
  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-3xl font-bold text-red-600">Fehler</h1>
            <p className="text-lg text-gray-600">{error}</p>
            <Link to="/#visibility-check">
              <Button>Neuen Check starten</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isSuccess = status === 'success' && leadData?.double_optin_confirmed;
  const hasReport = leadData?.report_sent_at;
  const hasReportUrl = leadData?.report_url;
  const isFailed = leadData?.status === 'failed';
  const isAnalyzing = leadData?.status === 'analyzing';

  // Show failure state
  if (isFailed && leadData?.analysis_error_message) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-3xl font-bold text-red-600">Analyse fehlgeschlagen</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {leadData.analysis_error_message}
            </p>
            <Link to="/#visibility-check">
              <Button>Neuen Check starten</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

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
                <strong>{leadData?.business_name}</strong>{' '}
                {hasReportUrl ? 'ist fertig!' : 'wird gerade erstellt.'}
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
            {/* PDF Download Card - Show prominently when available */}
            {hasReportUrl && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-green-800 mb-2">
                    🚀 Ihr Report ist fertig!
                  </h2>
                  <p className="text-green-700 mb-4">
                    Erstellt am: {leadData.report_generated_at ? 
                      new Date(leadData.report_generated_at).toLocaleString('de-DE') : 
                      'vor wenigen Minuten'}
                  </p>
                  <a 
                    href={hasReportUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>PDF-Report herunterladen</span>
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Status Ihres Reports</h2>
                  <Badge variant={hasReportUrl ? "default" : isAnalyzing ? "secondary" : "outline"}>
                    {hasReportUrl ? "Report verfügbar" : 
                     isAnalyzing ? "Wird analysiert" : 
                     "Report wird erstellt"}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>E-Mail bestätigt</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : hasReportUrl ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>
                      {isAnalyzing ? "Analyse läuft..." :
                       hasReportUrl ? "Analyse abgeschlossen" : 
                       "Analyse wird gestartet..."}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {hasReportUrl ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full" />
                    )}
                    <span>
                      {hasReportUrl ? "PDF erstellt" : "PDF ausstehend"}
                    </span>
                  </div>
                </div>

                {!hasReportUrl && !isFailed && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-blue-800">
                        {isAnalyzing ? 
                          "Ihre Sichtbarkeit wird gerade analysiert. Dies kann einige Minuten dauern..." :
                          "Report wird erstellt und per E-Mail versendet. Diese Seite aktualisiert sich automatisch."}
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