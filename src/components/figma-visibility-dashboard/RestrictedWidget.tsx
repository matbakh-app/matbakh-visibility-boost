import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Eye } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface RestrictedWidgetProps {
  children: React.ReactNode;
  isRestricted: boolean;
  restrictionType: 'premium' | 'business' | 'enterprise';
  context?: string;
  title?: string;
  description?: string;
  showPreview?: boolean;
  blurLevel?: 'light' | 'medium' | 'heavy';
  onUpgrade?: () => void;
}

const RestrictedWidget: React.FC<RestrictedWidgetProps> = ({
  children,
  isRestricted,
  restrictionType,
  context = '',
  title = '',
  description = '',
  showPreview = false,
  blurLevel = 'medium',
  onUpgrade
}) => {
  const { language } = useLanguage();

  const translations = {
    upgrade: {
      de: 'Upgraden',
      en: 'Upgrade'
    },
    preview: {
      de: 'Vorschau',
      en: 'Preview'
    },
    premium: {
      de: 'Premium erforderlich',
      en: 'Premium Required'
    },
    business: {
      de: 'Business erforderlich',
      en: 'Business Required'
    },
    enterprise: {
      de: 'Enterprise erforderlich',
      en: 'Enterprise Required'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  if (!isRestricted) {
    return <>{children}</>;
  }

  const blurClass = {
    light: 'blur-sm',
    medium: 'blur-md',
    heavy: 'blur-lg'
  }[blurLevel];

  const restrictionIcon = {
    premium: Crown,
    business: Lock,
    enterprise: Lock
  }[restrictionType];

  const Icon = restrictionIcon;

  return (
    <div className="relative">
      <div className={`${blurClass} pointer-events-none`}>
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <Card className="w-64 shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <Icon className="w-8 h-8 text-primary mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">
                {title || getText(restrictionType)}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {showPreview && (
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  {getText('preview')}
                </Button>
              )}
              <Button size="sm" onClick={onUpgrade} className="flex-1">
                {getText('upgrade')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestrictedWidget;