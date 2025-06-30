
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigationUtils } from './navigationUtils';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const { toggleLanguage } = useNavigationUtils();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="text-gray-700 hover:text-black"
    >
      <Globe className="h-4 w-4 mr-2" />
      {i18n.language.toUpperCase()}
    </Button>
  );
};

export default LanguageToggle;
