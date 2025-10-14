import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent';

interface AuthErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: 'emailRateLimit' | 'technicalError' | 'partnerCreationError' | 'general';
  onRetry?: () => void;
  onUseOtherEmail?: () => void;
  onContactSupport?: () => void;
}

const AuthErrorDialog: React.FC<AuthErrorDialogProps> = ({
  isOpen,
  onClose,
  errorType,
  onRetry,
  onUseOtherEmail,
  onContactSupport
}) => {
  const { t } = useTranslation('auth');
  const { trackEvent } = useAnalyticsEvent();

  // Track dialog display
  useEffect(() => {
    if (isOpen) {
      trackEvent('auth_error_dialog_shown', { errorType });
    }
  }, [isOpen, errorType, trackEvent]);

  const getErrorMessage = () => {
    switch (errorType) {
      case 'emailRateLimit':
        return t('messages.emailRateLimit');
      case 'technicalError':
        return t('messages.technicalError');
      case 'partnerCreationError':
        return t('messages.partnerCreationError');
      default:
        return t('messages.technicalError');
    }
  };

  const showRetry = errorType === 'technicalError' || errorType === 'general';
  const showOtherEmail = errorType === 'emailRateLimit';
  const showSupport = errorType === 'partnerCreationError' || errorType === 'emailRateLimit';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {errorType === 'emailRateLimit' ? t('messages.emailRateLimitTitle', 'E-Mail Limit erreicht') : t('messages.registrationFailed', 'Registrierung fehlgeschlagen')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-2">
            <div>{getErrorMessage()}</div>
            {errorType === 'emailRateLimit' && (
              <div className="text-sm text-muted-foreground mt-2">
                {t('messages.emailRateLimitTimeout')}
              </div>
            )}
            {(errorType === 'emailRateLimit' || errorType === 'partnerCreationError') && showSupport && (
              <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                {t('messages.supportInfo')}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="default" className="w-full sm:w-auto">
              {t('form.tryAgain')}
            </Button>
          )}
          {showOtherEmail && onUseOtherEmail && (
            <Button onClick={onUseOtherEmail} variant="default" className="w-full sm:w-auto">
              {t('form.useOtherEmail')}
            </Button>
          )}
          {showSupport && onContactSupport && (
            <Button onClick={onContactSupport} variant="outline" className="w-full sm:w-auto">
              {t('form.contactSupport')}
            </Button>
          )}
          <AlertDialogAction onClick={onClose} className="w-full sm:w-auto">
            Schließen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AuthErrorDialog;