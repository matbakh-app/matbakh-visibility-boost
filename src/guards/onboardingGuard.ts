import { getFlagBool } from '@/utils/featureFlags';
import { supabase } from '@/integrations/supabase/client';
import type { Role } from '@/lib/rbac';

const PUBLIC_WHITELIST: string[] = [
  '/', '/_kiro', '/vc/quick', '/vc/result', '/vc/result/dashboard',
  '/privacy', '/datenschutz', '/impressum', '/imprint', '/agb', '/terms', '/usage',
  '/login', '/register', '/auth/login', '/auth/google', '/auth/callback',
  '/password-reset', '/facebook-data-deletion', '/kontakt', '/contact',
  '/business', '/b2c', '/services', '/angebote', '/angebote-de', '/packages'
];

/**
 * Get current user role from database
 */
async function getCurrentUserRole(): Promise<Role> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'viewer';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return (profile?.role as Role) || 'viewer';
  } catch {
    return 'viewer';
  }
}

/**
 * Get local profile snapshot from context/storage if available
 */
function getLocalProfileSnapshot(): {
  profile?: { onboarding_complete?: boolean; profile_complete?: boolean };
  business?: { status?: string | null };
} {
  try {
    // Try to get from localStorage or context if available
    const cached = localStorage.getItem('auth_profile_cache');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore cache errors
  }
  
  return {};
}

/**
 * Central onboarding guard function
 * Returns false if no redirect needed, or redirect path if redirect required
 */
export async function shouldRedirectToOnboarding(
  currentPath: string,
  ctx?: {
    profile?: { onboarding_complete?: boolean; profile_complete?: boolean };
    business?: { status?: string | null };
  }
): Promise<false | string> {
  try {
    // 1) Flag controls the entire mechanism
    const guardLive = await getFlagBool('onboarding_guard_live', false);
    if (!guardLive) {
      console.log('OnboardingGuard: Disabled by feature flag');
      return false;
    }

    // 2) Public whitelist - allow these routes always
    if (PUBLIC_WHITELIST.some(p => currentPath.startsWith(p))) {
      console.log('OnboardingGuard: Public route whitelisted:', currentPath);
      return false;
    }

    // 3) Admin/Super-Admin bypass
    const role = await getCurrentUserRole();
    if (['admin', 'super_admin'].includes(role)) {
      console.log('OnboardingGuard: Admin bypass for role:', role);
      return false;
    }

    // 4) Get profile context (use provided or fetch local snapshot)
    const context = ctx || getLocalProfileSnapshot();

    // 5) Profile/Partner checks (robust against missing data)
    const onboardingDone = !!(
      context.profile?.onboarding_complete || 
      context.profile?.profile_complete
    );
    
    const partnerActive = (context.business?.status || '').toLowerCase() === 'active';

    console.log('OnboardingGuard: Status check', {
      currentPath,
      role,
      onboardingDone,
      partnerActive,
      context
    });

    // Only redirect if BOTH conditions are not met
    if (!onboardingDone && !partnerActive) {
      console.log('OnboardingGuard: Redirecting to onboarding');
      return '/onboarding/standard';
    }

    console.log('OnboardingGuard: No redirect needed');
    return false;
  } catch (error) {
    console.error('OnboardingGuard: Error in guard logic:', error);
    // On error, don't redirect to avoid breaking the app
    return false;
  }
}

/**
 * React hook version for use in components
 */
export function useOnboardingGuard(currentPath: string) {
  const [shouldRedirect, setShouldRedirect] = React.useState<false | string>(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    shouldRedirectToOnboarding(currentPath)
      .then(setShouldRedirect)
      .finally(() => setLoading(false));
  }, [currentPath]);

  return { shouldRedirect, loading };
}

// For React import
import React from 'react';