import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, TrendingUp, Target, Play } from 'lucide-react';
import { VCData, useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';

interface VCLaunchWidgetProps {
  onStart?: (formData: VCData) => void;
}

export const VCLaunchWidget: React.FC<VCLaunchWidgetProps> = ({ onStart }) => {
  // UserJourneyManager & Auth hooks
  const { setEntryPoint, setVCData } = useUserJourney();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    // 1. Entry Point tracken (ohne Form-Daten im Widget)
    setEntryPoint('vc');

    // 2. Wenn nicht eingeloggt → AuthModal öffnen
    if (!user) {
      openAuthModal('register');
      return;
    }

    // 3. Eingeloggter User → direkt zum Figma-Onboarding routen
    navigate('/visibilitycheck/onboarding/step1');

    // 4. Optional: Legacy onStart callback
    onStart?.({});
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Restaurant <span className="text-primary">Sichtbarkeits-Analyse</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse
        </p>
      </div>

      {/* Main CTA Card */}
      <Card className="mb-12 border-2 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            Kostenlose Sichtbarkeitsanalyse starten
          </h2>
          <p className="text-muted-foreground mb-8">
            Basis-Analyse mit eingeschränkten Features
          </p>
          

          <Button 
            onClick={handleStart}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            ⚡ Basis-Analyse starten
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            Kostenlos • Keine Registrierung erforderlich • 3-5 Minuten
          </p>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Basis-Analyse</h3>
            <p className="text-sm text-muted-foreground">
              Grundlegende Sichtbarkeits-Überprüfung Ihrer wichtigsten Plattformen
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Schnelle Insights</h3>
            <p className="text-sm text-muted-foreground">
              Sofortige Ergebnisse zu Ihrer digitalen Präsenz
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-2">Erste Empfehlungen</h3>
            <p className="text-sm text-muted-foreground">
              Grundlegende Optimierungsvorschläge für bessere Sichtbarkeit
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};