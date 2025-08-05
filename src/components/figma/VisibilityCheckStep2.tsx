import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, Target, CheckCircle, Mail } from 'lucide-react';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  website: string;
  benchmark1: string;
  benchmark2: string;
  benchmark3: string;
  emailConfirmed: boolean;
}

export const VisibilityCheckStep2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setVCData, getVCData } = useUserJourney();
  
  // Get existing data
  const existingData = getVCData();
  
  const [formData, setFormData] = useState<FormData>({
    website: existingData?.website || '',
    benchmark1: existingData?.benchmarkOne || '',
    benchmark2: existingData?.benchmarkTwo || '',
    benchmark3: existingData?.benchmarkThree || '',
    emailConfirmed: !!user
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    // Update VCData with website analysis data
    setVCData({
      ...existingData,
      website: formData.website,
      benchmarkOne: formData.benchmark1,
      benchmarkTwo: formData.benchmark2,
      benchmarkThree: formData.benchmark3,
    });

    // Navigate to loading screen
    navigate('/visibilitycheck/onboarding/loading');
  };

  const handleBack = () => {
    navigate('/visibilitycheck/onboarding/step1');
  };

  const isFormValid = () => {
    return formData.website.trim() && 
           (formData.benchmark1.trim() || formData.benchmark2.trim() || formData.benchmark3.trim()) &&
           (user || formData.emailConfirmed);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <span className="text-sm text-muted-foreground">Schritt 2 von 2</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Website & Wettbewerber</h1>
          <p className="text-muted-foreground mb-4">
            Geben Sie Ihre Website und wichtige Konkurrenten an für eine detaillierte Marktanalyse
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full w-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Website Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                Website Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Ihre Website *</Label>
                <div className="relative">
                  <Input
                    id="website"
                    placeholder="https://www.ihr-restaurant.de"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Wir analysieren Ihre Website auf Sichtbarkeit und SEO-Performance
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                Wettbewerber-Analyse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Nennen Sie 1-3 Ihrer wichtigsten Konkurrenten für einen Marktvergleich
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="benchmark1">Konkurrent 1</Label>
                  <Input
                    id="benchmark1"
                    placeholder="z.B. restaurant-konkurrent.de oder Name"
                    value={formData.benchmark1}
                    onChange={(e) => handleInputChange('benchmark1', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benchmark2">Konkurrent 2 (optional)</Label>
                  <Input
                    id="benchmark2"
                    placeholder="z.B. anderer-konkurrent.de oder Name"
                    value={formData.benchmark2}
                    onChange={(e) => handleInputChange('benchmark2', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benchmark3">Konkurrent 3 (optional)</Label>
                  <Input
                    id="benchmark3"
                    placeholder="z.B. dritter-konkurrent.de oder Name"
                    value={formData.benchmark3}
                    onChange={(e) => handleInputChange('benchmark3', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Confirmation for Guests */}
          {!user && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  E-Mail Bestätigung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-600">
                  Um Ihre Analyse zu erhalten, bestätigen Sie bitte Ihre E-Mail-Adresse nach dem Start der Analyse.
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600">Bereit für E-Mail-Bestätigung</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Status */}
          {user && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600">
                    Sie sind angemeldet - Analyse wird direkt in Ihr Dashboard übertragen
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Zurück zu Schritt 1
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isFormValid()}
              className="min-w-32"
            >
              Analyse starten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};