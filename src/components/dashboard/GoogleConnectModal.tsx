
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface GoogleConnectModalProps {
  open: boolean;
  onConnect: () => void;
  onClose: () => void;
  actionContext?: string;
}

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({ 
  open, 
  onConnect, 
  onClose, 
  actionContext = 'photos' 
}) => {
  const { t } = useTranslation('dashboard');

  const getContextMessage = () => {
    switch (actionContext) {
      case 'photos':
        return t('googleConnect.photoContext', { 
          defaultValue: 'Um Fotos direkt auf Google My Business hochzuladen, verbinde bitte dein Google-Konto.' 
        });
      case 'hours':
        return t('googleConnect.hoursContext', { 
          defaultValue: 'Um Öffnungszeiten zu bearbeiten, verbinde bitte dein Google My Business Konto.' 
        });
      case 'menu':
        return t('googleConnect.menuContext', { 
          defaultValue: 'Um deine Speisekarte zu verwalten, verbinde bitte dein Google My Business Konto.' 
        });
      default:
        return t('googleConnect.defaultContext', { 
          defaultValue: 'Um diese Funktion zu nutzen, verbinde bitte dein Google-Konto.' 
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('googleConnect.title', { defaultValue: 'Google My Business verbinden' })}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            {getContextMessage()}
          </p>
        </div>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', { defaultValue: 'Abbrechen' })}
          </Button>
          <Button onClick={onConnect} className="bg-blue-600 hover:bg-blue-700">
            🔗 {t('googleConnect.connect', { defaultValue: 'Google verbinden' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
