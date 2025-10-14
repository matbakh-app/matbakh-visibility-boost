import React from 'react';
import { useTranslation } from 'react-i18next';

const GoogleCtaNotice: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
      {t('googleCtaNotice')}
    </p>
  );
};

export default GoogleCtaNotice;