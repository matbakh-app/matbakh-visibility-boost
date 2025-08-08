import React, { Suspense, ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ErrorBoundary from './ErrorBoundary';

interface LazyWidgetProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const DefaultSkeleton = () => (
  <Card className="h-full bg-card">
    <CardContent className="p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    </CardContent>
  </Card>
);

const LazyWidget: React.FC<LazyWidgetProps> = ({ 
  component: Component, 
  fallback = <DefaultSkeleton />,
  ...props 
}) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyWidget;