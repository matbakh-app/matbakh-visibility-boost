
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface TrialBannerProps {
  daysRemaining?: number;
  isActive?: boolean;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ 
  daysRemaining = 14, 
  isActive = true 
}) => {
  if (!isActive) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Kostenlose Testphase
          </Badge>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            14 Tage kostenlos testen
          </h3>
          <p className="text-sm text-gray-600">
            {daysRemaining > 0 
              ? `Noch ${daysRemaining} Tage in Ihrer kostenlosen Testphase. Danach nur €39/Monat.`
              : 'Ihr kostenloses Trial endet heute. Upgraden Sie jetzt für nur €39/Monat.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
