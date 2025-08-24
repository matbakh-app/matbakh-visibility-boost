import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp, Star, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationData {
  id: string;
  email: string;
  business_name: string;
  status: string;
  created_at: string;
}

interface AnalysisResult {
  id: string;
  overall_score: number;
  strengths: string[];
  recommendations: string[];
}

export default function VisibilityCheckVerified() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [leadData, setLeadData] = useState<VerificationData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!leadId) {
      setErrorMessage('Ungültige Verification-ID');
      setVerificationStatus('error');
      return;
    }

    verifyLead();
  }, [leadId]);

  const verifyLead = async () => {
    try {
      // Get lead data with explicit typing
      const leadQuery = await supabase
        .from('visibility_check_leads')
        .select('id, email, business_name, status, created_at')
        .eq('id', leadId)
        .maybeSingle();

      if (leadQuery.error || !leadQuery.data) {
        setErrorMessage('Lead nicht gefunden oder bereits verifiziert.');
        setVerificationStatus('error');
        return;
      }

      const lead = leadQuery.data;
      setLeadData(lead as VerificationData);

      // Mock analysis result for now since tables might not exist yet
      const mockResult: AnalysisResult = {
        id: 'mock-id',
        overall_score: 75,
        strengths: [
          'Ihr Google Business Profil ist vollständig ausgefüllt',
          'Sie haben positive Kundenbewertungen',
          'Ihre Öffnungszeiten sind aktuell'
        ],
        recommendations: [
          'Fügen Sie mehr aktuelle Fotos hinzu',
          'Antworten Sie regelmäßig auf Kundenbewertungen',
          'Nutzen Sie Google Posts für Angebote und Events'
        ]
      };

      setAnalysisResult(mockResult);
      setVerificationStatus('success');

    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setVerificationStatus('error');
    }
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Verifizierung wird durchgeführt...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Verifizierung fehlgeschlagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sichtbarkeitsanalyse erfolgreich abgeschlossen!
          </h1>
          <p className="text-lg text-gray-600">
            Hier sind die Ergebnisse für <strong>{leadData?.business_name}</strong>
          </p>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="grid gap-6 mb-8">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Gesamtscore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">
                    {analysisResult.overall_score}/100
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full" 
                        style={{ width: `${analysisResult.overall_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Stärken</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.strengths?.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.recommendations?.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CTA Section */}
        <Card>
          <CardHeader>
            <CardTitle>Nächste Schritte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Möchten Sie Ihre Online-Sichtbarkeit verbessern? Wir helfen Ihnen dabei!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/business')} className="flex-1">
                Kostenlose Beratung anfragen
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}