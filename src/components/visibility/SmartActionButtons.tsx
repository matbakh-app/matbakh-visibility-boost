import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowRight, Star, Target, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '@/types/visibility';

interface SmartActionButtonsProps {
  email?: string;
  leadId?: string;
  allowDownload?: boolean;
  reportRequested: boolean;
  analysisResult: AnalysisResult;
  businessName: string;
  onRequestDetailedReport: () => void;
  onNewAnalysis: () => void;
}

interface UserStatus {
  isLoggedIn: boolean;
  isSubscriber: boolean;
  hasBusinessProfile: boolean;
  userId?: string;
}

const SmartActionButtons: React.FC<SmartActionButtonsProps> = ({
  email,
  leadId,
  allowDownload,
  reportRequested,
  analysisResult,
  businessName,
  onRequestDetailedReport,
  onNewAnalysis
}) => {
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isLoggedIn: false,
    isSubscriber: false,
    hasBusinessProfile: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user has business profile
        const { data: businessPartner } = await supabase
          .from('business_partners')
          .select('id, status, services_selected')
          .eq('user_id', user.id as any)
          .single();

        const isSubscriber = (businessPartner as any)?.services_selected?.length > 0;
        
        setUserStatus({
          isLoggedIn: true,
          isSubscriber,
          hasBusinessProfile: !!businessPartner,
          userId: user.id
        });
      } else {
        setUserStatus({
          isLoggedIn: false,
          isSubscriber: false,
          hasBusinessProfile: false
        });
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const handleDownloadReport = async () => {
    if (!leadId || !allowDownload) return;
    
    try {
      const response = await fetch(`/api/generate-pdf-report?leadId=${leadId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${businessName}-sichtbarkeits-report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getActionPriority = () => {
    if (analysisResult.leadPotential === 'high') return 'high';
    if (analysisResult.leadPotential === 'medium') return 'medium';
    return 'low';
  };

  const getConversionMessage = () => {
    const priority = getActionPriority();
    if (priority === 'high') {
      return "Ihre Sichtbarkeit hat enormes Verbesserungspotenzial! Lassen Sie uns gemeinsam Ihre Online-Präsenz optimieren.";
    }
    if (priority === 'medium') {
      return "Mit gezielten Optimierungen können Sie noch mehr Kunden erreichen.";
    }
    return "Ihre Basis ist gut - mit professioneller Unterstützung wird sie noch besser!";
  };

  // Logged-in Subscriber - Direct to Dashboard Actions
  if (userStatus.isLoggedIn && userStatus.isSubscriber) {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">
                  Sofortige Handlungsempfehlungen für Sie!
                </h3>
              </div>
              <p className="text-green-700">
                Als Abonnent erhalten Sie personalisierte Optimierungsschritte direkt in Ihrem Dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Target className="w-4 h-4" />
                  Zu meinen Handlungsempfehlungen
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/profile')}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Profil optimieren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {allowDownload && leadId && (
          <div className="text-center">
            <Button onClick={handleDownloadReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF-Report herunterladen
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Logged-in Non-Subscriber - Upgrade Focus
  if (userStatus.isLoggedIn && !userStatus.isSubscriber) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  Schalten Sie Ihr volles Potenzial frei!
                </h3>
              </div>
              <p className="text-muted-foreground">
                {getConversionMessage()}
              </p>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Handlungsempfehlungen sind nur für Abonnenten verfügbar
              </Badge>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/packages')}
                  className="flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Jetzt upgraden & optimieren
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onNewAnalysis}
                >
                  Neue Analyse starten
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not Logged In - Lead Conversion Focus (NO PDF download!)
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Wollen Sie diese Ergebnisse in Ihrem persönlichen Dashboard?
              </h3>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              {getConversionMessage()} Erstellen Sie jetzt Ihr kostenloses Konto für detaillierte Handlungsempfehlungen.
            </p>
            
            {/* Preview of locked features */}
            <div className="bg-white/50 backdrop-blur border border-gray-200 rounded-lg p-4 max-w-sm mx-auto">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="blur-sm select-none">Detaillierte SWOT-Analyse</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="blur-sm select-none">Personalisierte Handlungsschritte</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="blur-sm select-none">Wettbewerbervergleich</span>
                </div>
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                🔒 Nur für registrierte Nutzer
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/auth?mode=register')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Kostenloses Konto erstellen
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth?mode=login')}
              >
                Bereits registriert? Anmelden
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              100% kostenlos • DSGVO-konform • Keine Verpflichtungen
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success message for report request (email verification flow) */}
      {reportRequested && email && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-green-800">
                ✅ Bestätigungslink gesendet!
              </h4>
              <p className="text-sm text-green-700">
                Wir haben eine Bestätigungs-E-Mail an {email} gesendet. 
                Klicken Sie auf den Link, um Ihre Analyse abzurufen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative: New analysis */}
      <div className="text-center">
        <Button variant="ghost" onClick={onNewAnalysis} size="sm">
          Neue Analyse starten
        </Button>
      </div>
    </div>
  );
};

export default SmartActionButtons;