import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface OnboardingProgress {
  completed: boolean;
  current_step: string;
  steps: Record<string, any>;
}

const BYPASS_ROUTES = [
  '/_kiro',
  '/vc/quick',
  '/vc/result',
  '/auth',
  '/login',
  '/register',
  '/legal',
  '/pricing',
  '/services',
  '/onboarding' // Allow access to onboarding routes
];

async function fetchOnboardingProgress(): Promise<OnboardingProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    // Check if onboarding guard is enabled
    const { data: guardEnabled } = await supabase.rpc('is_feature_enabled', {
      p_flag_name: 'onboarding_guard_live'
    });

    if (!guardEnabled) {
      console.log('OnboardingGate: Guard disabled via feature flag');
      return {
        completed: true,
        current_step: 'done',
        steps: {}
      };
    }

    // Get onboarding progress from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // No profile found, redirect to onboarding
      return {
        completed: false,
        current_step: 'welcome',
        steps: {}
      };
    }

    return {
      completed: profile.onboarding_complete || false,
      current_step: profile.onboarding_complete ? 'done' : 'welcome',
      steps: {}
    };
  } catch (error) {
    console.error('OnboardingGate: Error fetching progress:', error);
    // On error, allow through to avoid blocking users
    return {
      completed: true,
      current_step: 'done',
      steps: {}
    };
  }
}

export default function OnboardingGate() {
  const location = useLocation();
  
  // Check if current route should bypass onboarding
  const shouldBypass = BYPASS_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  if (shouldBypass) {
    return <Outlet />;
  }

  const { data: progress, isLoading, error } = useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: fetchOnboardingProgress,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    console.error('OnboardingGate: Query error:', error);
    // On error, allow through to avoid blocking users
    return <Outlet />;
  }

  // If onboarding is not completed, redirect to onboarding
  if (progress && !progress.completed) {
    console.log('OnboardingGate: Redirecting to onboarding, current step:', progress.current_step);
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding completed, allow access
  return <Outlet />;
}