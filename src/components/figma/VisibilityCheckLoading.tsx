import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, Search, BarChart3, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ANALYSIS_STEPS = [
  { id: 1, title: 'Website scannen', description: 'Analysiere Online-Präsenz', duration: 2000 },
  { id: 2, title: 'SEO bewerten', description: 'Prüfe Suchmaschinenoptimierung', duration: 3000 },
  { id: 3, title: 'Konkurrenz analysieren', description: 'Vergleiche mit Wettbewerbern', duration: 4000 },
  { id: 4, title: 'KI-Empfehlungen generieren', description: 'Erstelle personalisierte Strategien', duration: 3000 },
];

export const VisibilityCheckLoading: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    let totalDuration = 0;
    ANALYSIS_STEPS.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1);
        setCompletedSteps(prev => [...prev, step.id]);
        
        if (index === ANALYSIS_STEPS.length - 1) {
          // Analysis complete
          setTimeout(() => {
            handleComplete();
          }, 1000);
        }
      }, totalDuration);
      totalDuration += step.duration;
    });

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  const handleComplete = () => {
    // Navigate to appropriate dashboard
    if (user) {
      navigate('/visibilitycheck/dashboard/member');
    } else {
      navigate('/visibilitycheck/dashboard/public');
    }
  };

  const handleCancel = () => {
    navigate('/visibilitycheck/onboarding/step1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              KI-Analyse läuft
            </h1>
            <p className="text-gray-600">
              Wir analysieren Ihre Online-Sichtbarkeit mit fortschrittlichen KI-Algorithmen
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Fortschritt</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Analysis Steps */}
          <div className="space-y-4 mb-8">
            {ANALYSIS_STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center p-4 rounded-lg border-2 transition-all duration-500 ${
                  completedSteps.includes(step.id)
                    ? 'border-green-200 bg-green-50'
                    : currentStep === step.id
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mr-4">
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : currentStep === step.id ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className={`font-medium ${
                    completedSteps.includes(step.id) || currentStep === step.id
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${
                    completedSteps.includes(step.id) || currentStep === step.id
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {currentStep === step.id && (
                  <div className="flex-shrink-0">
                    {step.id === 1 && <Search className="w-5 h-5 text-blue-500 animate-pulse" />}
                    {step.id === 2 && <BarChart3 className="w-5 h-5 text-blue-500 animate-pulse" />}
                    {step.id === 3 && <BarChart3 className="w-5 h-5 text-blue-500 animate-pulse" />}
                    {step.id === 4 && <Brain className="w-5 h-5 text-blue-500 animate-pulse" />}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Tipp:</strong> Diese Analyse dauert normalerweise 1-2 Minuten. 
              Sie erhalten eine umfassende Bewertung Ihrer Online-Sichtbarkeit.
            </p>
          </div>

          {/* Cancel Button */}
          <div className="text-center">
            <Button variant="outline" onClick={handleCancel}>
              Analyse abbrechen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};