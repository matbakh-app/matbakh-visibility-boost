
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: {
    id: string;
    title: string;
    description: string;
    recommendation_type: string;
  } | null;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, recommendation }) => {
  const { t } = useTranslation('dashboard');
  const [step, setStep] = useState(1);

  if (!recommendation) return null;

  const getModalContent = () => {
    switch (recommendation.recommendation_type) {
      case 'photos':
        return {
          title: t('actionModal.photos.title', { defaultValue: 'Fotos hinzufügen' }),
          description: t('actionModal.photos.description', { 
            defaultValue: 'Neue Fotos erhöhen Ihre Sichtbarkeit erheblich.' 
          }),
          steps: [
            {
              question: t('actionModal.photos.step1', { 
                defaultValue: 'Was möchten Sie zeigen?' 
              }),
              options: [
                t('actionModal.photos.option1', { defaultValue: 'Neue Gerichte' }),
                t('actionModal.photos.option2', { defaultValue: 'Restaurant-Atmosphäre' }),
                t('actionModal.photos.option3', { defaultValue: 'Team' }),
                t('actionModal.photos.option4', { defaultValue: 'Events' })
              ]
            }
          ]
        };
      case 'reviews':
        return {
          title: t('actionModal.reviews.title', { defaultValue: 'Bewertungen beantworten' }),
          description: t('actionModal.reviews.description', { 
            defaultValue: 'Antworten auf Bewertungen zeigen Engagement.' 
          }),
          steps: [
            {
              question: t('actionModal.reviews.step1', { 
                defaultValue: 'Welche Bewertungen möchten Sie bearbeiten?' 
              }),
              options: [
                t('actionModal.reviews.option1', { defaultValue: 'Neue unbeantwortete Bewertungen' }),
                t('actionModal.reviews.option2', { defaultValue: 'Kritische Bewertungen' }),
                t('actionModal.reviews.option3', { defaultValue: 'Positive Bewertungen danken' }),
                t('actionModal.reviews.option4', { defaultValue: 'Alle Bewertungen anzeigen' })
              ]
            }
          ]
        };
      case 'hours':
        return {
          title: t('actionModal.hours.title', { defaultValue: 'Öffnungszeiten aktualisieren' }),
          description: t('actionModal.hours.description', { 
            defaultValue: 'Aktuelle Öffnungszeiten verbessern Ihre Auffindbarkeit.' 
          }),
          steps: [
            {
              question: t('actionModal.hours.step1', { 
                defaultValue: 'Was möchten Sie aktualisieren?' 
              }),
              options: [
                t('actionModal.hours.option1', { defaultValue: 'Reguläre Öffnungszeiten' }),
                t('actionModal.hours.option2', { defaultValue: 'Feiertags-Öffnungszeiten' }),
                t('actionModal.hours.option3', { defaultValue: 'Sonderöffnungszeiten' }),
                t('actionModal.hours.option4', { defaultValue: 'Temporäre Schließung' })
              ]
            }
          ]
        };
      case 'overview':
        return {
          title: recommendation.title,
          description: recommendation.description,
          steps: []
        };
      default:
        return {
          title: recommendation.title,
          description: recommendation.description,
          steps: []
        };
    }
  };

  const content = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {content.title}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {content.steps.length > 0 && step <= content.steps.length ? (
            <div>
              <h4 className="font-medium mb-3">
                {content.steps[step - 1]?.question}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {content.steps[step - 1]?.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      if (step < content.steps.length) {
                        setStep(step + 1);
                      } else {
                        // Complete action - hier würde der eigentliche Workflow starten
                        console.log(`Action completed: ${recommendation.recommendation_type} - ${option}`);
                        onClose();
                      }
                    }}
                    className="text-sm h-auto py-3 px-2 text-center"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">
                {recommendation.recommendation_type === 'overview'
                  ? t('actionModal.allActionsAvailable', { 
                      defaultValue: 'Alle Empfehlungen sind über die Quick Actions verfügbar.' 
                    })
                  : t('actionModal.comingSoon', { 
                      defaultValue: 'Diese Funktion wird bald verfügbar sein.' 
                    })
                }
              </p>
              <Button onClick={onClose}>
                {t('common.close', { defaultValue: 'Schließen' })}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionModal;
