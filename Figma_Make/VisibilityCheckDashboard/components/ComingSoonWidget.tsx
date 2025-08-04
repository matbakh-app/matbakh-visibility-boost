import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface ComingSoonWidgetProps {
  icon: React.ComponentType<any>;
  title: string;
  description?: string;
  progressLabel?: string;
  progressValue?: number;
  onEarlyAccess?: () => void;
}

const ComingSoonWidget: React.FC<ComingSoonWidgetProps> = ({
  icon: Icon,
  title,
  description = "Demnächst verfügbar",
  progressLabel,
  progressValue,
  onEarlyAccess
}) => {
  return (
    <Card className="h-full bg-white/50 backdrop-blur-sm shadow-sm border-2 border-dashed border-gray-300 hover:border-gray-400 widget-card relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-transparent"></div>

      </div>
      
      <CardContent className="flex flex-col items-center justify-center h-full p-6 md:p-8 text-center relative z-10">
        {/* Feature Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6">
          <Icon className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
        </div>

        {/* Title */}
        <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2 md:mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-4 md:mb-6 max-w-xs">
          {description}
        </p>

        {/* Progress Bar (optional) */}
        {progressLabel && progressValue !== undefined && (
          <div className="w-full max-w-xs mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{progressLabel}</span>
              <span className="text-xs text-gray-500">{progressValue}%</span>
            </div>
            <Progress 
              value={progressValue} 
              className="h-2 bg-gray-200"
            />
          </div>
        )}

        {/* Early Access Button */}
        <Button
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 button-hover min-h-[44px] md:min-h-[auto] px-4"
          onClick={(event) => {
            console.log(`Early Access requested for: ${title}`);
            event.currentTarget.classList.add('success-flash');
            setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
            if (onEarlyAccess) onEarlyAccess();
          }}
        >
          Early Access anfragen
        </Button>

        {/* Coming Soon Badge */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200">
          Coming Soon
        </div>
      </CardContent>
    </Card>
  );
};

export default ComingSoonWidget;