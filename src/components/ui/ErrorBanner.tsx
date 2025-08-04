import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBannerProps {
  message: string;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ 
  message, 
  className = '' 
}) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};