
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
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthProvider: Error getting session:', error);
      }
      console.log('AuthProvider: Initial session:', session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.email || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only check admin role and redirect if user is actually logged in
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            setIsAdmin(profile?.role === 'admin');
          } catch (error) {
            console.log('AuthProvider: No profile found, assuming regular user');
            setIsAdmin(false);
          }
          
          // Only redirect if not on landing page or login page
          const isOnLandingPage = location.pathname === '/' || location.pathname.startsWith('/business/partner');
          if (!isOnLandingPage) {
            // Check if onboarding is completed
            try {
              const { data: partner } = await supabase
                .from('business_partners')
                .select('onboarding_completed')
                .eq('user_id', session.user.id)
                .single();
              
              if (!partner?.onboarding_completed) {
                navigate('/partner/onboarding');
              } else {
                navigate('/partner/dashboard');
              }
            } catch (error) {
              console.log('AuthProvider: No partner record found, redirecting to onboarding');
              navigate('/partner/onboarding');
            }
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const signInWithGoogle = async () => {
    console.log('AuthProvider: Starting Google sign in');
    const redirectUrl = `${window.location.origin}/business/partner/login`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/calendar',
        redirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('AuthProvider: Login error:', error);
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAdmin,
      signInWithGoogle,
      signOut
    }}>
      {children}
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
