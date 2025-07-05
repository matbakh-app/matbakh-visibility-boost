
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface QuickActionButtonProps {
  recommendation: {
    id: string;
    title: string;
    description: string;
    recommendation_type: string;
    priority: string;
  };
  onClick: (recommendation: any) => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ recommendation, onClick }) => {
  const { t } = useTranslation('dashboard');

  const getActionText = (type: string) => {
    switch (type) {
      case 'visibility':
        return t('quickActions.improveVisibility', { defaultValue: 'Sichtbarkeit verbessern' });
      case 'reviews':
        return t('quickActions.respondToReviews', { defaultValue: 'Bewertungen beantworten' });
      case 'photos':
        return t('quickActions.addPhotos', { defaultValue: 'Fotos hinzufügen' });
      case 'hours':
        return t('quickActions.updateHours', { defaultValue: 'Öffnungszeiten aktualisieren' });
      default:
        return recommendation.title;
    }
  };

  const getVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Button
      variant={getVariant(recommendation.priority)}
      onClick={() => onClick(recommendation)}
      className="text-sm"
    >
      {getActionText(recommendation.recommendation_type)}
    </Button>
  );
};

export default QuickActionButton;
