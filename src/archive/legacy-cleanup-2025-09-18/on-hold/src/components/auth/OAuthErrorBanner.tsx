import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OAuthErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const OAuthErrorBanner: React.FC<OAuthErrorBannerProps> = ({ 
  error, 
  onRetry, 
  onDismiss 
}) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <div className="flex gap-2 ml-4">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="h-7 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Wiederholen
            </Button>
          )}
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="h-7 px-2"
            >
              ✕
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};