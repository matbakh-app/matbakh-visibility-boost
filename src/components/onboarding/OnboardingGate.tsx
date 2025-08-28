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
  '/services'
];

async function fetchOnboardingProgress(): Promise<OnboardingProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  // For now, return a default completed state since the DB schema isn't deployed yet
  // TODO: Replace with actual RPC call once onboarding_v2_schema.sql is deployed
  return {
    completed: true, // Temporarily allow all users through
    current_step: 'done',
    steps: {}
  };
}

export default function OnboardingGate() {
  // TEMPORARILY DISABLED: OnboardingGate is disabled until DB schema is deployed
  // This allows all users to access the dashboard without onboarding completion
  console.log('OnboardingGate: Temporarily disabled - allowing all users through');
  return <Outlet />;
}