
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TrialBannerProps {
  daysRemaining?: number;
  isActive?: boolean;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ 
  daysRemaining = 14, 
  isActive = true 
}) => {
  const { t, ready } = useTranslation('common');

  // Debug logging für Entwicklung
  if (process.env.NODE_ENV === 'development') {
    console.log('[TrialBanner] Translation ready:', ready);
    console.log('[TrialBanner] Translation test:', {
      badge: t('trial.badge'),
      title: t('trial.title'),
      description: t('trial.description', { days: daysRemaining })
    });
  }

  if (!isActive) return null;
  
  // Warten bis Übersetzungen geladen sind
  if (!ready) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Loading...
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {t('trial.badge')}
          </Badge>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {t('trial.title')}
          </h3>
          <p className="text-sm text-gray-600">
            {daysRemaining > 0 
              ? t('trial.description', { days: daysRemaining })
              : t('trial.expired')
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
