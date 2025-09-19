import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingQuestion, getTranslation, getOptions } from '@/hooks/useOnboardingQuestions';

interface DynamicQuestionFieldProps {
  question: OnboardingQuestion;
  value: any;
  onChange: (value: any) => void;
}

const DynamicQuestionField: React.FC<DynamicQuestionFieldProps> = ({
  question,
  value,
  onChange
}) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language === 'en' ? 'en' : 'de') as 'de' | 'en';

  const label = getTranslation(question.translations, currentLang, 'label');
  const description = getTranslation(question.translations, currentLang, 'description');
  const placeholder = getTranslation(question.translations, currentLang, 'placeholder');

  switch (question.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={question.slug}>
            {label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <Input
            id={question.slug}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={question.required}
          />
        </div>
      );

    case 'select':
      const options = getOptions(question.options, currentLang);
      return (
        <div className="space-y-2">
          <Label htmlFor={question.slug}>
            {label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder || 'Auswählen...'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'checkbox':
      const checkboxOptions = getOptions(question.options, currentLang);
      return (
        <div className="space-y-2">
          <Label>
            {label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <div className="space-y-2">
            {checkboxOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
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
                <Label htmlFor={`${question.slug}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );

    case 'info':
      return (
        <div className="bg-muted/50 p-4 rounded-md">
          <h4 className="font-medium mb-2">{label}</h4>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      );

    default:
      return null;
  }
};

export default DynamicQuestionField;