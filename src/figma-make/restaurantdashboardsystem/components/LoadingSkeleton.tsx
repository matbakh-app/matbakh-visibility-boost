import React from 'react';
import { SkeletonCard } from './WidgetStates';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-16 bg-card shadow-sm border-b border-border">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <div className="w-32 h-8 bg-muted animate-pulse rounded"></div>
          <div className="flex space-x-4">
            <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
            <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
            <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 md:p-6 space-y-4">
        <div className="w-64 h-8 bg-muted animate-pulse rounded"></div>
        <div className="w-96 h-4 bg-muted animate-pulse rounded"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height="h-80" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;