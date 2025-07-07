
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OnboardingQuestion, getTranslation, getOptions } from '@/hooks/useOnboardingQuestions';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SmartQuestionFieldProps {
  question: OnboardingQuestion;
  value: any;
  onChange: (value: any) => void;
  language: 'de' | 'en';
}

export const SmartQuestionField: React.FC<SmartQuestionFieldProps> = ({
  question,
  value,
  onChange,
  language
}) => {
  const label = getTranslation(question.translations, language, 'label');
  const description = getTranslation(question.translations, language, 'description');
  const placeholder = getTranslation(question.translations, language, 'placeholder');

  const renderHelpTooltip = () => {
    if (!description) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderValidationError = () => {
    if (!question.validation_rules?.error) return null;
    
    return (
      <div className="flex items-center gap-2 mt-1 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span>{question.validation_rules.error}</span>
      </div>
    );
  };

  switch (question.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={question.slug} className="text-sm font-medium">
              {label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderHelpTooltip()}
          </div>
          
          {question.slug === 'business_description' ? (
            <Textarea
              id={question.slug}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={question.required}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
          ) : (
            <Input
              id={question.slug}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={question.required}
              type={question.slug.includes('email') ? 'email' : 
                    question.slug.includes('phone') ? 'tel' : 'text'}
            />
          )}
          
          {question.slug === 'business_description' && (
            <p className="text-xs text-gray-500">
              {(value || '').length}/500 Zeichen
            </p>
          )}
          
          {renderValidationError()}
        </div>
      );

    case 'select':
      const options = getOptions(question.options, language);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={question.slug} className="text-sm font-medium">
              {label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderHelpTooltip()}
          </div>
          
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder || 'Auswählen...'} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {renderValidationError()}
        </div>
      );

    case 'checkbox':
      const checkboxOptions = getOptions(question.options, language);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              {label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderHelpTooltip()}
          </div>
          
          <div className="space-y-3">
            {checkboxOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={`${question.slug}-${option.value}`}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label 
                  htmlFor={`${question.slug}-${option.value}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          
          {renderValidationError()}
        </div>
      );

    case 'info':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">{label}</h4>
          {description && (
            <p className="text-sm text-blue-700">{description}</p>
          )}
        </div>
      );

    default:
      return null;
  }
};
