import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const QuickVerifyMode: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuickVerify = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Fehler',
          description: 'Nicht angemeldet',
          variant: 'destructive'
        });
        return;
      }

      // Erstelle Dummy-Profildaten für Test
      const testData = {
        companyName: 'Test Restaurant München',
        address: 'Ridlerstraße 29F, 80331 München',
        phone: '+49 (0) 89 123456',
        website: 'https://matbakh.app',
        description: 'Test-Restaurant für Facebook-Verifikation',
        categories: ['restaurant'],
        businessModel: ['dine_in'],
        revenueStreams: ['food_sales'],
        targetAudience: ['locals'],
        seatingCapacity: 50,
        specialFeatures: ['terrace', 'wifi'],
        testMode: true,
        verificationPurpose: 'facebook_review'
      };

      // Speichere Test-Daten lokal für Verifikation
      localStorage.setItem('quickVerifyData', JSON.stringify(testData));
      console.log('Quick verify test data stored:', testData);

      toast({
        title: 'Quick-Verify aktiviert!',
        description: 'Test-Profil erstellt. Weiterleitung zum Dashboard...',
      });

      // Weiterleitung mit Test-Parameter
      setTimeout(() => {
        navigate('/dashboard?test=1&mode=verify');
      }, 1500);

    } catch (error) {
      console.error('Quick verify error:', error);
      // Fallback: Direkt weiterleiten auch bei Fehlern
      navigate('/dashboard?test=1&mode=verify');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Quick-Verify Modus
          </CardTitle>
          <CardDescription>
            Für Facebook-Reviewer und Verifikationszwecke
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
              Was passiert:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Test-Restaurantprofil wird erstellt</li>
              <li>• Dummy-Daten für München werden gesetzt</li>
              <li>• Direkter Zugang zum Dashboard</li>
              <li>• Alle Features sind testbar</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Dies ist ein Testmodus nur für Verifikationszwecke. 
              Echte Kundendaten werden nicht verarbeitet.
            </p>
          </div>

          <Button 
            onClick={handleQuickVerify}
            className="w-full"
            size="lg"
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick-Verify starten
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate('/partner/onboarding')}
            className="w-full"
          >
            Zurück zum normalen Onboarding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};