import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Sparkles, 
  BarChart3, 
  Zap,
  ArrowRight
} from 'lucide-react';
// MIGRATED: Supabase removed - use AWS services

export default function StepDone() {
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Auto-complete onboarding when this step loads
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    if (completed) return;
    
    setIsCompleting(true);
    
    try {
      const session = await supabase.auth.getSession();
      
      const response = await fetch('/functions/v1/onboarding-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      });

      if (response.ok) {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setCompleted(true); // Continue anyway
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleStartFirstAction = () => {
    navigate('/dashboard?action=first_steps');
  };

  return (
    <div className="space-y-8 text-center">
      {/* Success Animation */}
      <div className="space-y-4">
        <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold">
          Fertig! 🎉
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Dein Restaurant ist jetzt bereit für mehr Sichtbarkeit und neue Gäste.
        </p>
      </div>

      {/* What's Next */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Das passiert jetzt:</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-left">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full mt-0.5">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Visibility Score berechnen</h3>
                <p className="text-sm text-muted-foreground">
                  Wir analysieren deine aktuelle Online-Präsenz und erstellen deinen Ausgangswert.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-left">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full mt-0.5">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Quick Wins vorbereiten</h3>
                <p className="text-sm text-muted-foreground">
                  Wir erstellen deine ersten 3 Maßnahmen für sofortige Verbesserungen.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-left">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Dashboard aktivieren</h3>
                <p className="text-sm text-muted-foreground">
                  Dein persönliches Restaurant-Dashboard mit allen wichtigen Kennzahlen.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      {isCompleting && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">
                Onboarding wird abgeschlossen...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {completed && (
        <div className="space-y-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Setup abgeschlossen
          </Badge>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={handleGoToDashboard}
          size="lg" 
          className="w-full"
          disabled={isCompleting}
        >
          Dashboard öffnen
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        <Button 
          onClick={handleStartFirstAction}
          variant="outline"
          size="lg" 
          className="w-full"
          disabled={isCompleting}
        >
          Erste Aktion starten
          <Zap className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Footer Note */}
      <div className="text-xs text-muted-foreground">
        Du kannst alle Einstellungen später im Dashboard anpassen
      </div>
    </div>
  );
}