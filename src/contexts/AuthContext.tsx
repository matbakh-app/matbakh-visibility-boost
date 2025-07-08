
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.email || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event === 'SIGNED_IN') {
          console.log('AuthProvider: User signed in, checking profile and redirecting');
          
          // Defer data fetching to prevent deadlocks
          setTimeout(async () => {
            try {
              // Check admin role
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              setIsAdmin(profile?.role === 'admin');
              
               // Check if onboarding is completed
              const { data: partner } = await supabase
                .from('business_partners')
                .select('id, onboarding_completed')
                .eq('user_id', session.user.id)
                .single();

              // Log auth event
              await supabase
                .from('oauth_event_logs')
                .insert({
                  event_type: 'login_success',
                  provider: 'email',
                  user_id: session.user.id,
                  partner_id: partner?.id,
                  success: true,
                  context: { 
                    has_partner: !!partner,
                    onboarding_completed: partner?.onboarding_completed 
                  }
                });
              
              // Only redirect if not on login or landing pages
              const isOnLandingPage = location.pathname === '/' || 
                                     location.pathname.startsWith('/business/partner');
              
              if (!isOnLandingPage || location.pathname === '/business/partner/login') {
                if (!partner?.onboarding_completed) {
                  console.log('AuthProvider: Redirecting to onboarding');
                  navigate('/partner/onboarding', { replace: true });
                } else {
                  console.log('AuthProvider: Redirecting to dashboard');
                  navigate('/dashboard', { replace: true });
                }
              }
            } catch (error) {
              console.log('AuthProvider: No partner record found, will redirect to onboarding on next navigation');
              
              // Log auth event with error
              await supabase
                .from('oauth_event_logs')
                .insert({
                  event_type: 'login_success',
                  provider: 'email',
                  user_id: session.user.id,
                  success: false,
                  error_message: 'No partner record found'
                });
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
    console.log('AuthProvider: Starting Google sign in');
    const redirectUrl = `${window.location.origin}/business/partner/login`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/analytics.readonly',
        redirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('AuthProvider: Login error:', error);
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
    signInWithGoogle,
    signIn,
    signOut
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
