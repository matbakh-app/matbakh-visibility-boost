import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Camera, MessageSquare, Star, Check } from 'lucide-react';

export default function StepQuickWins() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const quickWinOptions = [
    {
      id: 'googleProfile',
      title: t('quickwins.options.googleProfile'),
      description: 'Profil vervollständigen und optimieren',
      icon: MapPin,
      impact: 'Hoch',
      effort: '15 Min',
      color: 'bg-red-500'
    },
    {
      id: 'openingHours',
      title: t('quickwins.options.openingHours'),
      description: 'Einheitliche Zeiten auf allen Plattformen',
      icon: Clock,
      impact: 'Mittel',
      effort: '10 Min',
      color: 'bg-blue-500'
    },
    {
      id: 'topDish',
      title: t('quickwins.options.topDish'),
      description: 'Bestes Gericht mit Foto präsentieren',
      icon: Camera,
      impact: 'Hoch',
      effort: '20 Min',
      color: 'bg-green-500'
    },
    {
      id: 'reviews',
      title: t('quickwins.options.reviews'),
      description: 'Auf aktuelle Bewertungen antworten',
      icon: MessageSquare,
      impact: 'Mittel',
      effort: '30 Min',
      color: 'bg-purple-500'
    },
    {
      id: 'photos',
      title: t('quickwins.options.photos'),
      description: 'Neue Fotos von Gerichten und Ambiente',
      icon: Star,
      impact: 'Hoch',
      effort: '45 Min',
      color: 'bg-orange-500'
    }
  ];

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else if (prev.length < 3) {
        return [...prev, actionId];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    try {
      // Save selected quick wins
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'quickwins',
          data: {
            selectedActions
          },
          next: 'baseline'
        })
      });

      if (response.ok) {
        navigate('/onboarding/baseline');
      }
    } catch (error) {
      console.error('Error saving quick wins:', error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Hoch': return 'bg-green-100 text-green-700';
      case 'Mittel': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('quickwins.title')}</h1>
        <p className="text-muted-foreground">{t('quickwins.subtitle')}</p>
      </div>

      <div className="text-center">
        <Badge variant="outline" className="text-sm">
          {selectedActions.length}/3 ausgewählt
        </Badge>
      </div>

      <div className="grid gap-4">
        {quickWinOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedActions.includes(option.id);
          const canSelect = selectedActions.length < 3 || isSelected;
          
          return (
            <Card 
              key={option.id} 
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              } ${!canSelect ? 'opacity-50' : ''}`}
              onClick={() => canSelect && toggleAction(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${option.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={getImpactColor(option.impact)}>
                          {option.impact} Impact
                        </Badge>
                        <Badge variant="outline">
                          {option.effort}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {isSelected && (
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedActions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center text-blue-700">
              <p className="font-medium">
                Geschätzte Gesamtzeit: {selectedActions.length * 20} Minuten
              </p>
              <p className="text-sm">
                Diese Maßnahmen werden automatisch für Sie geplant
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/onboarding/channels')}
        >
          {t('navigation.previous')}
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={selectedActions.length === 0}
        >
          {t('navigation.next')}
        </Button>
      </div>
    </div>
  );
}