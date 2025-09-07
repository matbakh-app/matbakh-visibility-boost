
import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigationUtils } from './navigationUtils';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';

const LanguageToggle: React.FC = () => {
  const { languageUpper, isReady } = useSafeTranslation();
  const { toggleLanguage } = useNavigationUtils();

  if (!isReady) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-gray-400"
      >
        <Globe className="h-4 w-4 mr-2" />
        --
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="text-gray-700 hover:text-black"
    >
      <Globe className="h-4 w-4 mr-2" />
      {languageUpper}
    </Button>
  );
};

export default LanguageToggle;
