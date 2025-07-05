
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { GoogleConnectModal } from './GoogleConnectModal';
import { PhotoUploader } from './PhotoUploader';
import { useToast } from '@/hooks/use-toast';

export const QuickActions: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: connectionData } = useGoogleConnection();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');

  const isGoogleConnected = connectionData?.isGoogleConnected ?? false;

  // Handler für Fotos hochladen - DIREKTE AUSFÜHRUNG
  const handleUploadPhotos = () => {
    if (isGoogleConnected) {
      setShowUploader(true);
    } else {
      setCurrentAction('photos');
      setShowGoogleModal(true);
    }
  };

  // Handler für Öffnungszeiten - DIREKTE NAVIGATION
  const handleUpdateHours = () => {
    if (isGoogleConnected) {
      // TODO: Navigate to hours editor when implemented
      navigate('/dashboard/business/hours');
    } else {
      setCurrentAction('hours');
      setShowGoogleModal(true);
    }
  };

  // Handler für Speisekarte - DIREKTE NAVIGATION
  const handleUpdateMenu = () => {
    if (isGoogleConnected) {
      // TODO: Navigate to menu editor when implemented
      navigate('/dashboard/business/menu');
    } else {
      setCurrentAction('menu');
      setShowGoogleModal(true);
    }
  };

  // Google OAuth initialisieren
  const handleGoogleConnect = () => {
    // TODO: Implement actual Google OAuth flow
    // For now, redirect to Google auth or open OAuth popup
    const redirectUrl = encodeURIComponent(`${window.location.origin}/dashboard`);
    window.location.href = `/auth/google?redirect=${redirectUrl}`;
    setShowGoogleModal(false);
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={handleUploadPhotos}
          className="w-full text-sm font-medium border bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
          variant="outline"
        >
          📤 {t('quickActions.uploadPhotos', { defaultValue: 'Fotos hochladen' })}
        </Button>
        
        <Button
          onClick={handleUpdateHours}
          className="w-full text-sm font-medium border bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
          variant="outline"
        >
          🕒 {t('quickActions.updateHours', { defaultValue: 'Öffnungszeiten ändern' })}
        </Button>
        
        <Button
          onClick={handleUpdateMenu}
          className="w-full text-sm font-medium border bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
          variant="outline"
        >
          🍽️ {t('quickActions.updateMenu', { defaultValue: 'Speisekarte bearbeiten' })}
        </Button>
      </div>

      {/* Google Connect Modal */}
      <GoogleConnectModal
        open={showGoogleModal}
        onConnect={handleGoogleConnect}
        onClose={() => setShowGoogleModal(false)}
        actionContext={currentAction}
      />

      {/* Photo Uploader */}
      <PhotoUploader
        open={showUploader}
        onClose={() => setShowUploader(false)}
      />
    </>
  );
};
