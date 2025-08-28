import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Clock, 
  Target, 
  TrendingUp,
  MapPin,
  Palette,
  Menu,
  Share2
} from 'lucide-react';

const GOAL_CHIPS = [
  { id: 'visibility', label: 'Mehr Sichtbarkeit', icon: TrendingUp },
  { id: 'customers', label: 'Neue Kunden', icon: Target },
  { id: 'reviews', label: 'Bessere Bewertungen', icon: Sparkles },
  { id: 'presence', label: 'Online Präsenz', icon: Share2 }
];

export default function StepWelcome() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['onboarding', 'common']);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = async () => {
    // Save welcome step data
    try {
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          step: 'welcome',
          data: {
            goals: selectedGoals,
            language: i18n.language,
            started_at: new Date().toISOString()
          },
          next: 'restaurant'
        })
      });

      if (response.ok) {
        navigate('/onboarding/restaurant');
      }
    } catch (error) {
      console.error('Error saving welcome step:', error);
      // Continue anyway
      navigate('/onboarding/restaurant');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold">
          Los geht's – dein digitaler Gastraum
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          In 3–5 Minuten legst du Name, Marke, Menü und Kanäle fest.
        </p>

        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Dauert nur wenige Minuten</span>
        </div>
      </div>

      {/* Goals Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Was möchtest du erreichen?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {GOAL_CHIPS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);
              
              return (
                <button
                  key={goal.id}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{goal.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Wähle ein oder mehrere Ziele aus (optional)
          </p>
        </CardContent>
      </Card>

      {/* What we'll set up */}
      <Card>
        <CardHeader>
          <CardTitle>Das richten wir gemeinsam ein:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Restaurant-Daten</div>
                <div className="text-sm text-muted-foreground">Name, Adresse, Öffnungszeiten</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Marke & Design</div>
                <div className="text-sm text-muted-foreground">Logo, Farben, Tonalität</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Menu className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Menü & Medien</div>
                <div className="text-sm text-muted-foreground">Speisekarte, Fotos (optional)</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Share2 className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Kanäle verbinden</div>
                <div className="text-sm text-muted-foreground">Google, Instagram, Facebook</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col space-y-4">
        <Button 
          onClick={handleContinue}
          size="lg" 
          className="w-full"
        >
          Jetzt starten
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Du kannst jederzeit pausieren und später weitermachen
        </p>
      </div>
    </div>
  );
}