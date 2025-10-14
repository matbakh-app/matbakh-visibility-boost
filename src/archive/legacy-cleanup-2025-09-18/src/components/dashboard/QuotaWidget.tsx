
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface QuotaWidgetProps {
  currentUploads: number;
  maxUploads: number;
  title: string;
}

const QuotaWidget: React.FC<QuotaWidgetProps> = ({ 
  currentUploads, 
  maxUploads, 
  title 
}) => {
  const percentage = (currentUploads / maxUploads) * 100;
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{title}</h4>
        <span className={`text-sm ${isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-gray-600'}`}>
          {currentUploads} / {maxUploads}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isCritical ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : ''}`}
      />
      <p className="text-xs text-gray-500">
        {maxUploads - currentUploads} Uploads verbleibend
      </p>
    </div>
  );
};

export default QuotaWidget;
