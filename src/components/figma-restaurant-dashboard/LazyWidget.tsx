import React, { useState, useEffect, useRef, ReactNode, Suspense } from 'react';
import { WidgetStateWrapper, SkeletonCard } from './WidgetStates';

interface LazyWidgetProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  priority?: 'low' | 'normal' | 'high';
  preloadData?: boolean;
  cacheKey?: string;
}

const LazyWidget: React.FC<LazyWidgetProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  priority = 'normal',
  preloadData = false,
  cacheKey
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isInView) {
      // Progressive loading with priority
      const loadDelay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 300;
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, loadDelay);

      return () => clearTimeout(timer);
    }
  }, [isInView, priority]);

  // Preload critical data based on priority
  useEffect(() => {
    if (preloadData && priority === 'high' && cacheKey) {
      const cachedData = localStorage.getItem(`widget-cache-${cacheKey}`);
      if (!cachedData) {
        // Preload critical data in background
        console.log(`Preloading data for ${cacheKey}`);
      }
    }
  }, [preloadData, priority, cacheKey]);

  if (!isInView) {
    return (
      <div ref={ref} className="min-h-[400px] flex items-center justify-center">
        {fallback || (
          <div className="space-y-4 w-full">
            <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
            <SkeletonCard height="h-80" />
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div ref={ref} className="slide-in-mobile">
        {fallback || (
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
            <SkeletonCard height="h-80" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="slide-in-mobile">
      <Suspense
        fallback={
          fallback || (
            <div className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
              <SkeletonCard height="h-80" />
            </div>
          )
        }
      >
        {children}
      </Suspense>
    </div>
  );
};

export default LazyWidget;