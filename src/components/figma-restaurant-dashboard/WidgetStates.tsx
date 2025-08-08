import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const SkeletonCard = ({ height = 'h-32' }: { height?: string }) => (
  <div className={`${height} bg-gray-200 rounded animate-pulse`} />
);

export const SkeletonChart = ({ height = 'h-48' }: { height?: string }) => (
  <div className={`${height} bg-gray-200 rounded animate-pulse`} />
);

export const SkeletonText = ({ width = 'w-32' }: { width?: string }) => (
  <div className={`h-4 bg-gray-200 rounded animate-pulse ${width}`} />
);

export const SkeletonList = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-2">
    {Array(items).fill(0).map((_, i) => (
      <SkeletonCard key={i} height="h-16" />
    ))}
  </div>
);

interface WidgetStateWrapperProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  skeletonComponent: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: React.ComponentType<any>;
  children: React.ReactNode;
}

export const WidgetStateWrapper: React.FC<WidgetStateWrapperProps> = ({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  skeletonComponent,
  emptyTitle,
  emptyDescription,
  emptyIcon: Icon,
  children
}) => {
  if (isLoading) {
    return <>{skeletonComponent}</>;
  }

  if (isError) {
    return (
      <Card className="h-full bg-card border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <Icon className="w-12 h-12 text-destructive" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">Error</h3>
            <p className="text-sm text-muted-foreground">
              Something went wrong loading this widget.
            </p>
          </div>
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className="h-full bg-card">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <Icon className="w-12 h-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{emptyTitle}</h3>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};