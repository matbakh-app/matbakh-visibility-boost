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

interface SmartOnboardingWizardProps {
  onComplete: (answers: Record<string, any>) => void;
}

const ONBOARDING_STEPS = [
  { id: 'google', key: 'googleConnection' },
  { id: 'basics', key: 'businessBasics' },
  { id: 'services', key: 'serviceSelection' },
  { id: 'kpis', key: 'kpiInput' }
];

const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  googleConnected: false,
  companyName: '',
  address: '',
  phone: '',
  website: '',
  description: '',
  categories: [],
  selectedServices: [],
  kpiData: {}
};

export const SmartOnboardingWizard: React.FC<SmartOnboardingWizardProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);

  const { saveData, loadData } = useOnboardingPersistence();

  useEffect(() => {
    // Load existing data on component mount
    const savedData = loadData();
    if (savedData) {
      // Merge saved data with defaults to ensure all fields are present
      setData(prev => ({
        ...prev,
        ...savedData.answers
      }));
      setCurrentStep(savedData.step);
    }
  }, [loadData]);

  const handleDataChange = (newData: Partial<OnboardingData>) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    saveData(currentStep, updatedData);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveData(nextStep, data);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveData(prevStep, data);
    } else {
      // Bei Step 0 - zurück zum Onboarding-Formular (Business Login/Register Seite)
      const currentLanguage = localStorage.getItem('i18nextLng') || 'de';
      if (currentLanguage === 'en') {
        window.location.href = '/business/login';
      } else {
        window.location.href = '/business/partner/login';
      }
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps or the current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleGoogleConnection = (connectionData: any) => {
    const updatedData = { ...data, ...connectionData };
    setData(updatedData);
    saveData(currentStep, updatedData);
    handleNext();
  };

  const handleKpiComplete = (kpiData: any) => {
    const finalData = { ...data, kpiData };
    setData(finalData);
    saveData(currentStep, finalData);
    onComplete(finalData);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <GoogleConnectionStep
            gmailAddress={data.companyName}
            hasGmail={true}
            onConnectionComplete={handleGoogleConnection}
            onBack={handlePrevious}
          />
        );
      case 1:
        return (
          <BusinessBasicsStep
            data={{
              companyName: data.companyName,
              address: data.address,
              phone: data.phone,
              website: data.website,
              description: data.description,
              categories: data.categories
            }}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        return (
          <ServiceSelectionStep
            selectedServices={data.selectedServices}
            onSelectionChange={(services) => handleDataChange({ selectedServices: services })}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <KpiInputStep
            onComplete={handleKpiComplete}
            onBack={handlePrevious}
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
                currentStep={currentStep + 1}
                totalSteps={ONBOARDING_STEPS.length}
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
