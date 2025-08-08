import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSwitchProps {
  variant?: 'default' | 'compact';
}

export function LanguageSwitch({ variant = 'default' }: LanguageSwitchProps) {
  const [language, setLanguage] = React.useState<'de' | 'en'>('de');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'de' ? 'en' : 'de');
  };

  if (variant === 'compact') {
    return (
      <Button variant="ghost" size="sm" onClick={toggleLanguage}>
        <Globe className="w-4 h-4 mr-2" />
        {language.toUpperCase()}
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={toggleLanguage}>
      <Globe className="w-4 h-4 mr-2" />
      {language === 'de' ? 'Deutsch' : 'English'}
    </Button>
  );
}