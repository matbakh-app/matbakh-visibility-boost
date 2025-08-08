import React from 'react';
import { AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shimmer animation component with design tokens
const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-muted via-accent to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite] ${className}`} />
);

// Skeleton components for different content types
export const SkeletonChart = ({ height = "h-32" }: { height?: string }) => (
  <div className={`${height} flex items-end space-x-2 p-4`}>
    {Array.from({ length: 7 }, (_, i) => (
      <div key={i} className="flex-1 flex flex-col justify-end">
        <div className={`w-full bg-muted rounded-sm animate-pulse`} style={{ height: `${Math.random() * 60 + 20}%` }} />
      </div>
    ))}
  </div>
);

export const SkeletonGauge = () => (
  <div className="flex flex-col items-center space-y-4">
    <div className="relative w-24 h-12 md:w-32 md:h-16">
      <Shimmer className="w-full h-full rounded-t-full bg-muted" />
    </div>
    <div className="text-center space-y-2">
      <Shimmer className="w-16 h-8 mx-auto bg-muted rounded" />
      <Shimmer className="w-24 h-4 mx-auto bg-muted rounded" />
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3, width = "full" }: { lines?: number; width?: string }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }, (_, i) => (
      <Shimmer 
        key={i} 
        className={`h-4 bg-muted rounded ${
          width === "full" ? "w-full" : 
          width === "half" ? "w-1/2" :
          width === "quarter" ? "w-1/4" :
          i === lines - 1 ? "w-2/3" : "w-full"
        }`} 
      />
    ))}
  </div>
);

export const SkeletonCard = ({ height = "" }: { height?: string }) => (
  <div className={`bg-muted p-2 md:p-3 rounded-lg space-y-2 ${height}`}>
    <div className="flex items-center justify-between">
      <Shimmer className="w-4 h-4 bg-border rounded" />
      <Shimmer className="w-8 h-3 bg-border rounded" />
    </div>
    <Shimmer className="w-12 h-6 bg-border rounded" />
    <Shimmer className="w-16 h-3 bg-border rounded" />
  </div>
);

export const SkeletonList = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded">
        <div className="flex items-center space-x-2">
          <Shimmer className="w-4 h-4 bg-border rounded" />
          <Shimmer className="w-20 h-4 bg-border rounded" />
        </div>
        <Shimmer className="w-16 h-4 bg-border rounded" />
      </div>
    ))}
  </div>
);

// Error State Component
export const ErrorState = ({ 
  onRetry, 
  title = "Daten konnten nicht geladen werden",
  description = "Bitte versuchen Sie es erneut oder kontaktieren Sie den Support."
}: {
  onRetry: () => void;
  title?: string;
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="w-12 h-12 bg-error-light rounded-full flex items-center justify-center mb-4">
      <AlertTriangle className="w-6 h-6 text-error" />
    </div>
    <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
    <p className="text-xs text-muted-foreground mb-4 max-w-xs">{description}</p>
    <Button 
      onClick={onRetry}
      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 py-2 min-h-[44px] md:min-h-[auto] flex items-center space-x-2"
    >
      <RefreshCw className="w-4 h-4" />
      <span>Erneut versuchen</span>
    </Button>
  </div>
);

// Empty State Component
export const EmptyState = ({ 
  title = "Noch keine Daten verfügbar",
  description = "Daten werden gesammelt...",
  icon: Icon = BarChart3
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<any>;
}) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
    <p className="text-xs text-caption-foreground max-w-xs">{description}</p>
  </div>
);

// Widget wrapper that handles all states
export const WidgetStateWrapper = ({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  children,
  skeletonComponent,
  emptyTitle,
  emptyDescription,
  emptyIcon
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  children: React.ReactNode;
  skeletonComponent: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<any>;
}) => {
  if (isLoading) {
    return <>{skeletonComponent}</>;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <EmptyState 
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  return <>{children}</>;
};