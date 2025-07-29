import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VisibilityResults from '@/components/visibility/VisibilityResults';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VisibilityCheckVerified: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [leadData, setLeadData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (leadId) {
      verifyAndLoadResults();
    }
  }, [leadId, token]);

  const verifyAndLoadResults = async () => {
    try {
      setVerificationStatus('loading');

      // If there's a token, verify it first
      if (token) {
        const { error: verifyError } = await supabase
          .from('visibility_check_leads')
          .update({ 
            email_verified: true,
            verification_token: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .eq('verification_token', token);

        if (verifyError) {
          console.error('Token verification failed:', verifyError);
          setErrorMessage('Ungültiger oder abgelaufener Verifikationslink.');
          setVerificationStatus('error');
          return;
        }
      }

      // Load lead data and results
      const { data: lead, error: leadError } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        setErrorMessage('Lead-Daten konnten nicht gefunden werden.');
        setVerificationStatus('error');
        return;
      }

      // Load analysis results
      const { data: results, error: resultsError } = await supabase
        .from('visibility_check_results')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resultsError) {
        console.error('Error loading results:', resultsError);
        setErrorMessage('Analyseergebnisse konnten nicht geladen werden.');
        setVerificationStatus('error');
        return;
      }

      setLeadData(lead);
      setAnalysisResult(results?.analysis_results || null);
      setVerificationStatus('success');

    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage('Ein unerwarteter Fehler ist aufgetreten.');
      setVerificationStatus('error');
    }
  };

  const handleNewAnalysis = () => {
    navigate('/');
  };

  const handleRequestDetailedReport = () => {
    console.log('Detailed report requested for verified lead');
    // This could trigger a more detailed report generation
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Verifikation läuft...</h2>
              <p className="text-muted-foreground">
                Ihre E-Mail wird verifiziert und die Ergebnisse werden geladen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-red-600">Verifikation fehlgeschlagen</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={handleNewAnalysis} className="w-full">
                Neue Analyse starten
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">E-Mail bestätigt!</h2>
              <p className="text-muted-foreground">
                Ihre E-Mail wurde erfolgreich bestätigt, aber die Analyse ist noch nicht abgeschlossen.
              </p>
              <Button onClick={handleNewAnalysis} className="w-full">
                Neue Analyse starten
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the full analysis results
  return (
    <div className="min-h-screen bg-background">
      {token && (
        <div className="bg-green-50 border-b border-green-200 py-3">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                E-Mail erfolgreich bestätigt! Hier sind Ihre vollständigen Analyseergebnisse.
              </span>
            </div>
          </div>
        </div>
      )}
      
      <VisibilityResults
        businessName={leadData?.business_name || ''}
        analysisResult={analysisResult}
        onRequestDetailedReport={handleRequestDetailedReport}
        onNewAnalysis={handleNewAnalysis}
        reportRequested={false}
        email={leadData?.email}
      />
    </div>
  );
};

export default VisibilityCheckVerified;