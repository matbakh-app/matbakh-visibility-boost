import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface SkeletonCardProps {
  height?: string;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  height = "h-64", 
  className = "" 
}) => {
  return (
    <Card className={`${className} animate-pulse`}>
      <CardHeader className="space-y-2">
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="h-3 bg-muted rounded w-1/3"></div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`bg-muted rounded ${height}`}></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full"></div>
          <div className="h-3 bg-muted rounded w-3/4"></div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Error loading widget",
  message = "Something went wrong. Please try again.",
  onRetry
}) => {
  return (
    <Card className="border-error/50">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-error" />
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </CardContent>
    </Card>
  );
};

interface ConnectionStateProps {
  isConnected: boolean;
  service?: string;
}

export const ConnectionState: React.FC<ConnectionStateProps> = ({
  isConnected,
  service = "service"
}) => {
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-success" />
          <Badge variant="secondary" className="bg-success-light text-success">
            Connected
          </Badge>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-error" />
          <Badge variant="secondary" className="bg-error-light text-error">
            Disconnected
          </Badge>
        </>
      )}
      <span className="text-sm text-muted-foreground">{service}</span>
    </div>
  );
};

interface WidgetStateWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export const WidgetStateWrapper: React.FC<WidgetStateWrapperProps> = ({
  children,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = "No data available"
}) => {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};