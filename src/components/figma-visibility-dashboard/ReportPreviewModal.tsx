import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType?: string;
  category?: string;
  onUpgrade?: () => void;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportType,
  category,
  onUpgrade
}) => {
  const { language } = useLanguage();

  const translations = {
    title: {
      de: 'Berichtsvorschau',
      en: 'Report Preview'
    },
    description: {
      de: 'Vollständiger Zugriff auf alle Berichte mit Premium-Abo',
      en: 'Full access to all reports with Premium subscription'
    },
    upgrade: {
      de: 'Jetzt upgraden',
      en: 'Upgrade Now'
    },
    close: {
      de: 'Schließen',
      en: 'Close'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getText('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {getText('description')}
          </p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              {getText('close')}
            </Button>
            <Button onClick={onUpgrade} className="flex-1">
              {getText('upgrade')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreviewModal;