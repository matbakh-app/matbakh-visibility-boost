import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Search, Star, MapPin, Users, Plus, X } from 'lucide-react';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface CompetitorForm {
  competitors: Array<{ name: string; url: string }>;
}

export default function StepBaseline() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [showCompetitors, setShowCompetitors] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibilityScore, setVisibilityScore] = useState<{
    overall: number;
    google: number;
    social: number;
    website: number;
  } | null>(null);
  
  const { register, handleSubmit, watch, setValue, getValues } = useForm<CompetitorForm>({
    defaultValues: {
      competitors: [{ name: '', url: '' }]
    }
  });
  
  const competitors = watch('competitors');

  const addCompetitor = () => {
    const current = getValues('competitors');
    if (current.length < 3) {
      setValue('competitors', [...current, { name: '', url: '' }]);
    }
  };

  const removeCompetitor = (index: number) => {
    const current = getValues('competitors');
    if (current.length > 1) {
      setValue('competitors', current.filter((_, i) => i !== index));
    }
  };

  const startAnalysis = async (data: CompetitorForm) => {
    setShowCompetitors(false);
    setIsCalculating(true);
    
    // GTM Event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onb_competitors_added', {
        competitor_count: data.competitors.filter(c => c.name.trim()).length
      });
    }
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    // Simulate API call delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      // Mock visibility score
      setVisibilityScore({
        overall: 42,
        google: 35,
        social: 28,
        website: 65
      });
      
      setIsCalculating(false);
    }, 3000);
  };

  const handleComplete = async () => {
    try {
      // Save baseline data and complete onboarding
      const competitorData = getValues('competitors').filter(c => c.name.trim());
      
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'baseline',
          data: {
            visibilityScore,
            competitors: competitorData
          },
          next: 'done'
        })
      });

      if (response.ok) {
        navigate('/onboarding/done');
      }
    } catch (error) {
      console.error('Error saving baseline:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { text: 'Gut', class: 'bg-green-100 text-green-700' };
    if (score >= 40) return { text: 'Ausbaufähig', class: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Verbesserungsbedarf', class: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('baseline.title')}</h1>
        <p className="text-muted-foreground">{t('baseline.subtitle')}</p>
      </div>

      {showCompetitors ? (
        <form onSubmit={handleSubmit(startAnalysis)} className="space-y-6">
          {/* Competitors Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Wettbewerber (optional)</span>
              </CardTitle>
              <CardDescription>
                Nennen Sie bis zu 3 Konkurrenten in Ihrer Nähe für eine bessere Analyse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      {...register(`competitors.${index}.name`)}
                      placeholder="Restaurant Name"
                    />
                    <Input
                      {...register(`competitors.${index}.url`)}
                      placeholder="Website (optional)"
                      type="url"
                    />
                  </div>
                  {competitors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompetitor(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {competitors.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetitor}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Weiteren Wettbewerber hinzufügen
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Start Analysis */}
          <div className="text-center">
            <Button type="submit" size="lg" className="px-8">
              <TrendingUp className="w-5 h-5 mr-2" />
              Analyse starten
            </Button>
          </div>
        </form>
      ) : isCalculating ? (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="animate-pulse">
              <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('baseline.calculating')}</h3>
              <Progress value={progress} className="w-full mb-2" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% abgeschlossen</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>🔍 Analysiere Google-Präsenz...</p>
              <p>📱 Prüfe Social Media Kanäle...</p>
              <p>🌐 Bewerte Website-Performance...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Score */}
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('baseline.score')}</h3>
                <div className={`text-6xl font-bold ${getScoreColor(visibilityScore!.overall)}`}>
                  {visibilityScore!.overall}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge className={getScoreBadge(visibilityScore!.overall).class}>
                  {getScoreBadge(visibilityScore!.overall).text}
                </Badge>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t('baseline.explanation')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <h4 className="font-semibold">Google</h4>
                <div className={`text-2xl font-bold ${getScoreColor(visibilityScore!.google)}`}>
                  {visibilityScore!.google}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                <h4 className="font-semibold">Social Media</h4>
                <div className={`text-2xl font-bold ${getScoreColor(visibilityScore!.social)}`}>
                  {visibilityScore!.social}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Search className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold">Website</h4>
                <div className={`text-2xl font-bold ${getScoreColor(visibilityScore!.website)}`}>
                  {visibilityScore!.website}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Potential */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center text-blue-700">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Verbesserungspotential</h4>
                <p className="text-sm">
                  Mit den geplanten Maßnahmen können Sie Ihren Score um{' '}
                  <span className="font-bold">+25-35 Punkte</span> steigern
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/onboarding/quickwins')}
          disabled={isCalculating}
        >
          {t('navigation.previous')}
        </Button>
        
        <Button 
          onClick={handleComplete}
          disabled={isCalculating}
        >
          {t('navigation.next')}
        </Button>
      </div>
    </div>
  );
}