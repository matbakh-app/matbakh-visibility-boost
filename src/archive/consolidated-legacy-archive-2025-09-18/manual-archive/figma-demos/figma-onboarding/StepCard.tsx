import React from 'react';
import { Check, Lock } from 'lucide-react';

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked' | 'upcoming';
  isClickable?: boolean;
  onClick?: () => void;
}

export function StepCard({ step, title, description, status, isClickable = false, onClick }: StepCardProps) {
  const getStepIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{step}</span>
          </div>
        );
      case 'locked':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-500" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <span className="text-gray-500 text-sm font-semibold">{step}</span>
          </div>
        );
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'border-success/20 bg-success/5';
      case 'current':
        return 'border-primary/20 bg-primary/5 shadow-md';
      case 'locked':
        return 'border-gray-200 bg-gray-50 opacity-60';
      default:
        return 'border-gray-200 bg-white hover:border-gray-300';
    }
  };

  return (
    <div
      className={`
        rounded-lg border-2 p-6 transition-all duration-200
        ${getStatusStyles()}
        ${isClickable && status !== 'locked' ? 'cursor-pointer hover:shadow-lg' : ''}
      `}
      onClick={isClickable && status !== 'locked' ? onClick : undefined}
    >
      <div className="flex items-start gap-4">
        {getStepIcon()}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${isCompleted ? 'bg-success border-success' : ''}
                  ${isCurrent ? 'bg-primary border-primary' : ''}
                  ${!isCompleted && !isCurrent ? 'border-gray-300 bg-white' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                    {stepNumber}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-2 ${isCurrent ? 'text-primary font-medium' : 'text-gray-500'}`}>
                Schritt {stepNumber}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-4 transition-all
                  ${stepNumber < currentStep ? 'bg-success' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}