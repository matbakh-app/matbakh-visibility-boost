
import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingStepIndicator: React.FC<OnboardingStepIndicatorProps> = ({
  currentStep,
  totalSteps
}) => {
  const { t } = useTranslation('onboarding');
  
  const steps = [
    { number: 1, title: t('steps.1.title'), description: t('steps.1.desc') },
    { number: 2, title: t('steps.2.title'), description: t('steps.2.desc') },
    { number: 3, title: t('steps.3.title'), description: t('steps.3.desc') },
    { number: 4, title: t('steps.4.title'), description: t('steps.4.desc') }
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.slice(0, totalSteps).map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
              step.number < currentStep 
                ? 'bg-green-500 text-white' 
                : step.number === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
            }`}>
              {step.number < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium ${
                step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          </div>
          
          {index < steps.slice(0, totalSteps).length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${
              step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};
