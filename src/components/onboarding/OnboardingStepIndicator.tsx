
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export const OnboardingStepIndicator: React.FC<OnboardingStepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels
}) => {
  const { t } = useTranslation('onboarding');

  const defaultStepLabels = [
    t('steps.1.title', 'Google-Verbindung'),
    t('steps.2.title', 'Unternehmensdaten'),
    t('steps.3.title', 'Services auswählen'),
    t('steps.4.title', 'KPI-Eingabe')
  ];

  const labels = stepLabels || defaultStepLabels;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              
              {stepNumber < totalSteps && (
                <div className={`h-0.5 w-16 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        {labels.slice(0, totalSteps).map((label, index) => (
          <div key={index} className="text-center max-w-20">
            <span className="break-words">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
