
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions';
import DynamicQuestionField from '@/components/onboarding/DynamicQuestionField';

const PartnerOnboarding: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const { questions, loading, error } = useOnboardingQuestions(currentStep);
  
  const handleAnswerChange = (questionSlug: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionSlug]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Unternehmensdaten';
      case 2: return 'Service-Auswahl';
      case 3: return 'Qualifikationsfragen';
      case 4: return 'Google Business Profil verknüpfen';
      default: return 'Onboarding';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">Fehler beim Laden der Fragen: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>Onboarding Wizard - Schritt {currentStep}/4</CardTitle>
              <Progress value={(currentStep / 4) * 100} className="w-full" />
              <h2 className="text-xl font-semibold">{getStepTitle()}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Lade Fragen...</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-6">
                {questions.map((question) => (
                  <DynamicQuestionField
                    key={question.id}
                    question={question}
                    value={answers[question.slug]}
                    onChange={(value) => handleAnswerChange(question.slug, value)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Keine Fragen für diesen Schritt verfügbar.</p>
              </div>
            )}
            
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Zurück
              </Button>
              <Button 
                onClick={handleNext}
                disabled={currentStep === 4}
              >
                {currentStep === 4 ? 'Abschließen' : 'Weiter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerOnboarding;
