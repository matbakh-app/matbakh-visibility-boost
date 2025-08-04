import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

// Domain-Matrix für konsistente OAuth-Flows
const OAUTH_DOMAINS = {
  MAIN: 'https://matbakh.app',
  WWW: 'https://www.matbakh.app',
  SUPABASE_CALLBACK: 'https://uheksobnyedarrpgxhju.supabase.co/auth/v1/callback'
} as const;

// Hardcoded Redirect-URLs für OAuth - KORRIGIERTE URLS
const OAUTH_REDIRECTS = {
  BUSINESS_LOGIN: `${OAUTH_DOMAINS.MAIN}/business/partner/login`,
  PARTNER_ONBOARDING: `${OAUTH_DOMAINS.MAIN}/partner/onboarding`,
  DASHBOARD: `${OAUTH_DOMAINS.MAIN}/dashboard`
} as const;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  hasCompletedUserProfile: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  oauthError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCompletedUserProfile, setHasCompletedUserProfile] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // OAuth Event Logging Funktion
  const logOAuthEvent = async (eventType: string, provider: string, success: boolean, errorMessage?: string, context?: any) => {
    try {
      await supabase.from('oauth_event_logs').insert({
        event_type: eventType,
        provider,
        user_id: session?.user?.id || null,
        success,
        error_message: errorMessage || null,
        context: context || {},
        ip_address: null, // Frontend kann IP nicht ermitteln
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log OAuth event:', error);
    }
  };

  // Google Token Speicherung
  const storeGoogleTokens = async (session: Session) => {
    try {
      if (session.provider_token && session.provider_refresh_token) {
        const { error } = await supabase
          .from('google_oauth_tokens')
          .upsert({
            user_id: session.user.id,
            google_user_id: session.user.user_metadata?.sub || session.user.id,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token,
            email: session.user.email,
            scopes: ['profile', 'email'], // Basis-Scopes
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1 Stunde
          });

        if (error) {
          console.error('Error storing Google tokens:', error);
          await logOAuthEvent('token_storage_failed', 'google', false, error.message);
        } else {
          console.log('Google tokens stored successfully');
          await logOAuthEvent('token_storage_success', 'google', true);
        }
      }
    } catch (error) {
      console.error('Failed to store Google tokens:', error);
      await logOAuthEvent('token_storage_error', 'google', false, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Facebook Token Speicherung
  const storeFacebookTokens = async (session: Session) => {
    try {
      if (session.provider_token) {
        const { error } = await supabase
          .from('facebook_oauth_tokens')
          .upsert({
            user_id: session.user.id,
            facebook_user_id: session.user.user_metadata?.sub || session.user.id,
            access_token: session.provider_token,
            email: session.user.email,
            scopes: ['public_profile', 'email', 'pages_read_engagement'], // Facebook Scopes
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString() // 24 Stunden
          });

        if (error) {
          console.error('Error storing Facebook tokens:', error);
          await logOAuthEvent('token_storage_failed', 'facebook', false, error.message);
        } else {
          console.log('Facebook tokens stored successfully');
          await logOAuthEvent('token_storage_success', 'facebook', true);
        }
      }
    } catch (error) {
      console.error('Failed to store Facebook tokens:', error);
      await logOAuthEvent('token_storage_error', 'facebook', false, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.email || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        setOauthError(null); // Reset error on state change
        
        if (session?.user && event === 'SIGNED_IN') {
          console.log('AuthProvider: User signed in, checking profile and provider');
          
          // Store provider tokens based on login method
          if (session.user.app_metadata?.provider === 'google') {
            await storeGoogleTokens(session);
          } else if (session.user.app_metadata?.provider === 'facebook') {
            await storeFacebookTokens(session);
          }
          
          // Defer data fetching to prevent deadlocks
          setTimeout(async () => {
            try {
              // Check admin role from profiles table
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();
               
               setIsAdmin(profile?.role === 'admin');
               
               // Check if user profile is completed
               setHasCompletedUserProfile(!!profile && !!profile.role);
              
              // Check if business profile exists and onboarding is completed
              const { data: partner } = await supabase
                .from('business_partners')
                .select('id, onboarding_completed')
                .eq('user_id', session.user.id)
                .maybeSingle();

              // Log auth event
              await logOAuthEvent(
                'login_success',
                session.user.app_metadata?.provider || 'email',
                true,
                undefined,
                { 
                  has_partner: !!partner,
                  onboarding_completed: partner?.onboarding_completed,
                  partner_id: partner?.id,
                  redirect_url: location.pathname
                }
              );
              
              // Only redirect if not on login, landing, or visibility check pages
              const isOnLandingPage = location.pathname === '/' || 
                                     location.pathname.startsWith('/business/partner');
              const isOnVisibilityCheck = location.pathname.startsWith('/visibility');
              
              console.log('AuthProvider: Current path:', location.pathname, 'isOnLandingPage:', isOnLandingPage, 'isOnVisibilityCheck:', isOnVisibilityCheck);
              
              if ((!isOnLandingPage && !isOnVisibilityCheck) || location.pathname === '/business/partner/login') {
                // Check for test mode parameter
                const urlParams = new URLSearchParams(location.search);
                const testMode = urlParams.get('test');
                
                if (testMode === '1') {
                  console.log('AuthProvider: Test mode detected, redirecting to quick-verify');
                  navigate('/quick-verify', { replace: true });
                } else if (!partner?.onboarding_completed) {
                  console.log('AuthProvider: Redirecting to onboarding');
                  
                  // Route based on provider
                  const provider = session.user.app_metadata?.provider || 'email';
                  if (provider === 'google') {
                    navigate('/onboarding/google', { replace: true });
                  } else {
                    navigate('/onboarding/standard', { replace: true });
                  }
                } else {
                  console.log('AuthProvider: Redirecting to dashboard');
                  navigate('/dashboard', { replace: true });
                }
              }
            } catch (error) {
              console.log('AuthProvider: No partner record found, will redirect to onboarding on next navigation');
              
              // Log auth event with error
              await logOAuthEvent(
                'login_success',
                session.user.app_metadata?.provider || 'email',
                false,
                'No partner record found'
              );
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthProvider: Error getting session:', error);
      }
      console.log('AuthProvider: Initial session:', session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const signInWithGoogle = async () => {
    console.log('AuthProvider: Starting Google OAuth sign in');
    setOauthError(null);
    
    try {
      // Log OAuth attempt
      await logOAuthEvent('oauth_attempt', 'google', true, undefined, {
        redirect_url: OAUTH_REDIRECTS.BUSINESS_LOGIN,
        scopes: ['profile', 'email'], // Minimale Scopes für Tests
        domain: OAUTH_DOMAINS.MAIN
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Minimale Scopes für initial setup
          scopes: 'profile email openid',
          // Hardcoded Redirect URL
          redirectTo: OAUTH_REDIRECTS.BUSINESS_LOGIN,
          // Query parameters für debugging
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('AuthProvider: Google OAuth error:', error);
        setOauthError(`Google Login fehlgeschlagen: ${error.message}`);
        await logOAuthEvent('oauth_error', 'google', false, error.message);
        throw error;
      }

      console.log('AuthProvider: Google OAuth initiated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth error';
      console.error('AuthProvider: OAuth exception:', errorMessage);
      setOauthError(`OAuth Fehler: ${errorMessage}`);
      await logOAuthEvent('oauth_exception', 'google', false, errorMessage);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    console.log('AuthProvider: Starting Facebook OAuth sign in');
    setOauthError(null);
    
    try {
      // Log OAuth attempt
      await logOAuthEvent('oauth_attempt', 'facebook', true, undefined, {
        redirect_url: OAUTH_REDIRECTS.BUSINESS_LOGIN,
        scopes: ['public_profile', 'email', 'pages_read_engagement'],
        domain: OAUTH_DOMAINS.MAIN
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          // Facebook Scopes für Business-Profile - REDUZIERTE SCOPES
          scopes: 'public_profile,email',
          // Hardcoded Redirect URL - KORRIGIERT
          redirectTo: OAUTH_REDIRECTS.BUSINESS_LOGIN,
          // Query parameters für debugging
          queryParams: {
            display: 'popup'
          }
        }
      });
      
      if (error) {
        console.error('AuthProvider: Facebook OAuth error:', error);
        setOauthError(`Facebook Login fehlgeschlagen: ${error.message}`);
        await logOAuthEvent('oauth_error', 'facebook', false, error.message);
        throw error;
      }

      console.log('AuthProvider: Facebook OAuth initiated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth error';
      console.error('AuthProvider: OAuth exception:', errorMessage);
      setOauthError(`OAuth Fehler: ${errorMessage}`);
      await logOAuthEvent('oauth_exception', 'facebook', false, errorMessage);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Starting email sign in');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('AuthProvider: Email login error:', error);
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    hasCompletedUserProfile,
    signInWithGoogle,
    signInWithFacebook,
    signIn,
    signOut,
    oauthError
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">⏳ Lade Benutzerinformationen…</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
