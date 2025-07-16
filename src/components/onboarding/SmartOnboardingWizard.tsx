
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { GoogleConnectionStep } from './GoogleConnectionStep';
import { BusinessBasicsStep } from './BusinessBasicsStep';
import { ServiceSelectionStep } from './ServiceSelectionStep';
import { KpiInputStep } from './KpiInputStep';
import { useOnboardingPersistence } from '@/hooks/useOnboardingPersistence';

interface OnboardingData {
  // Google Connection
  googleConnected: boolean;
  googleTokens?: any;
  
  // Business Basics
  companyName: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  categories: string[];
  
  // Service Selection
  selectedServices: string[];
  
  // KPI Input
  kpiData: Record<string, any>;
}

const ONBOARDING_STEPS = [
  { id: 'google', key: 'googleConnection' },
  { id: 'basics', key: 'businessBasics' },
  { id: 'services', key: 'serviceSelection' },
  { id: 'kpis', key: 'kpiInput' }
];

export const SmartOnboardingWizard: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    googleConnected: false,
    companyName: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    categories: [],
    selectedServices: [],
    kpiData: {}
  });

  const { saveOnboardingData, loadOnboardingData } = useOnboardingPersistence();

  useEffect(() => {
    // Load existing data on component mount
    const savedData = loadOnboardingData();
    if (savedData) {
      setData(savedData);
      // Resume from appropriate step
      if (savedData.googleConnected && savedData.companyName) {
        setCurrentStep(2);
      } else if (savedData.googleConnected) {
        setCurrentStep(1);
      }
    }
  }, []);

  const handleDataChange = (newData: Partial<OnboardingData>) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    saveOnboardingData(updatedData);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps or the current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <GoogleConnectionStep
            data={data}
            onDataChange={handleDataChange}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <BusinessBasicsStep
            data={data}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        return (
          <ServiceSelectionStep
            data={data}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <KpiInputStep
            data={data}
            onDataChange={handleDataChange}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              {t('onboarding.title')}
            </CardTitle>
            <div className="space-y-4">
              <Progress value={progressPercentage} className="w-full" />
              <OnboardingStepIndicator
                steps={ONBOARDING_STEPS}
                currentStep={currentStep}
                onStepClick={handleStepClick}
              />
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};
