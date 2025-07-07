
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions';
import { useAiCategorySuggestions } from '@/hooks/useAiCategorySuggestions';
import { SmartQuestionField } from './SmartQuestionField';
import { AiSuggestionCard } from './AiSuggestionCard';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { GmailSetupGuide } from './GmailSetupGuide';
import { GoogleConnectionStep } from './GoogleConnectionStep';
import { Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react';

interface SmartOnboardingWizardProps {
  onComplete?: (data: Record<string, any>) => void;
}

export const SmartOnboardingWizard: React.FC<SmartOnboardingWizardProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language === 'en' ? 'en' : 'de') as 'de' | 'en';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showGmailGuide, setShowGmailGuide] = useState(false);
  
  const { questions, gmbCategories, loading, error } = useOnboardingQuestions(currentStep);
  const { suggestions, loading: aiLoading, getSuggestions } = useAiCategorySuggestions();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Trigger AI suggestions when business info is provided
  useEffect(() => {
    if (answers.business_description && answers.business_name && gmbCategories.length > 0) {
      getSuggestions(answers.business_description, answers.business_name, gmbCategories);
    }
  }, [answers.business_description, answers.business_name, gmbCategories]);

  const handleAnswerChange = (questionSlug: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionSlug]: value
    }));
  };

  const handleAiSuggestionAccept = (categoryId: string) => {
    setAnswers(prev => ({
      ...prev,
      business_category: categoryId
    }));
  };

  const handleNext = () => {
    // Special handling for Gmail setup
    if (currentStep === 3 && answers.has_gmail === 'no') {
      setShowGmailGuide(true);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.(answers);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return t('onboarding.step1.title', 'Unternehmensdaten');
      case 2: return t('onboarding.step2.title', 'Service-Auswahl');
      case 3: return t('onboarding.step3.title', 'Qualifikationsfragen');
      case 4: return t('onboarding.step4.title', 'Google-Konto verknüpfen');
      default: return t('onboarding.title', 'Onboarding');
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return t('onboarding.step1.description', 'Erzählen Sie uns von Ihrem Unternehmen');
      case 2: return t('onboarding.step2.description', 'Wählen Sie die gewünschten Services');
      case 3: return t('onboarding.step3.description', 'Einige wichtige Fragen zu Ihrem Setup');
      case 4: return t('onboarding.step4.description', 'Verbinden Sie Ihr Google-Konto für die Synchronisation');
      default: return '';
    }
  };

  const canProceed = () => {
    const requiredQuestions = questions.filter(q => q.required);
    return requiredQuestions.every(q => answers[q.slug] !== undefined && answers[q.slug] !== '');
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              {t('onboarding.error', 'Fehler beim Laden der Fragen:')} {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showGmailGuide) {
    return (
      <GmailSetupGuide 
        onComplete={() => {
          setShowGmailGuide(false);
          setCurrentStep(4);
        }}
        onBack={() => setShowGmailGuide(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <OnboardingStepIndicator currentStep={currentStep} totalSteps={totalSteps} />
            <Progress value={progress} className="w-full" />
            <div>
              <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
              <p className="text-gray-600 mt-2">{getStepDescription()}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('onboarding.loading', 'Lade Fragen...')}</p>
            </div>
          ) : (
            <>
              {/* AI Suggestions */}
              {currentStep === 1 && suggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-gray-900">
                      {t('onboarding.aiSuggestions', 'KI-Vorschläge für Ihre Kategorie')}
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {suggestions.map((suggestion) => (
                      <AiSuggestionCard
                        key={suggestion.id}
                        category={suggestion}
                        language={currentLang}
                        selected={answers.business_category === suggestion.category_id}
                        onSelect={() => handleAiSuggestionAccept(suggestion.category_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-6">
                {questions.map((question) => (
                  <SmartQuestionField
                    key={question.id}
                    question={question}
                    value={answers[question.slug]}
                    onChange={(value) => handleAnswerChange(question.slug, value)}
                    language={currentLang}
                  />
                ))}
              </div>

              {/* Special handling for Google connection step */}
              {currentStep === 4 && (
                <GoogleConnectionStep 
                  gmailAddress={answers.gmail_account}
                  onConnectionComplete={(connectionData) => {
                    setAnswers(prev => ({ ...prev, ...connectionData }));
                    onComplete?.(answers);
                  }}
                />
              )}
            </>
          )}
          
          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back', 'Zurück')}
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2"
            >
              {currentStep === totalSteps ? 
                t('onboarding.complete', 'Abschließen') : 
                t('common.next', 'Weiter')
              }
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
