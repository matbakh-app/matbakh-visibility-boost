import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('auth');
  const { trackEvent } = useAnalyticsEvent();
  const [feedback, setFeedback] = useState('');
  const [hasProblems, setHasProblems] = useState<boolean | null>(null);

  const handleSubmit = (hadProblems: boolean) => {
    setHasProblems(hadProblems);
    
    trackEvent('registration_feedback', {
      hadProblems,
      feedback: feedback.trim() || null,
      timestamp: new Date().toISOString()
    });

    // Store feedback locally for now
    if (hadProblems && feedback.trim()) {
      localStorage.setItem('registration_feedback', JSON.stringify({
        hadProblems,
        feedback: feedback.trim(),
        timestamp: new Date().toISOString()
      }));
    }

    onClose();
  };

  const handleClose = () => {
    setHasProblems(null);
    setFeedback('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('feedback.title', 'Wie war Ihre Registrierung?')}</DialogTitle>
          <DialogDescription>
            {t('feedback.question', 'Hatten Sie Probleme bei der Registrierung?')}
          </DialogDescription>
        </DialogHeader>
        
        {hasProblems === null && (
          <DialogFooter className="flex-row gap-2">
            <Button 
              onClick={() => handleSubmit(true)} 
              variant="outline" 
              className="flex-1"
            >
              {t('feedback.yes', 'Ja')}
            </Button>
            <Button 
              onClick={() => handleSubmit(false)} 
              variant="default" 
              className="flex-1"
            >
              {t('feedback.no', 'Nein')}
            </Button>
          </DialogFooter>
        )}

        {hasProblems === true && (
          <>
            <div className="space-y-4">
              <Textarea
                placeholder={t('feedback.placeholder', 'Beschreiben Sie bitte kurz, welche Probleme Sie hatten...')}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => handleSubmit(true)} className="w-full">
                {t('feedback.submit', 'Feedback senden')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;