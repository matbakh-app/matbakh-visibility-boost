
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackHomeButtons: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    const homeRoute = i18n.language === 'en' ? '/' : '/';
    navigate(homeRoute);
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('navigation.back')}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleHome}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        {t('navigation.home')}
      </Button>
    </div>
  );
};

export default BackHomeButtons;
