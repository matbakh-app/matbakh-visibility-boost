import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signIn, signOut, signUp, confirmSignUp } from 'aws-amplify/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeCognito } from '@/services/cognito-auth';

// AWS Cognito User Interface
interface AWSUser {
  id: string;
  email: string;
  name?: string;
  attributes?: Record<string, any>;
}

interface AuthContextType {
  user: AWSUser | null;
  loading: boolean;
  isAdmin: boolean;
  hasCompletedUserProfile: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, attributes?: Record<string, any>) => Promise<{ error: any }>;
  confirmSignUp: (email: string, code: string) => Promise<{ error: any }>;
  oauthError: string | null;
  // Modal functionality
  showAuthModal: boolean;
  authModalMode: 'login' | 'register';
  vcData: any | null;
  openAuthModal: (mode: 'login' | 'register', vcData?: any) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('AWS AuthProvider: Starting component render');

  const [user, setUser] = useState<AWSUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCompletedUserProfile, setHasCompletedUserProfile] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [vcData, setVcData] = useState<any | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize AWS Cognito on mount
  useEffect(() => {
    initializeCognito();
  }, []);

  // Check current user on mount
  useEffect(() => {
    console.log('AWS AuthProvider: Checking current user');

    const checkCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('AWS AuthProvider: Current user found:', currentUser.username);

        const awsUser: AWSUser = {
          id: currentUser.userId,
          email: currentUser.username,
          name: currentUser.signInDetails?.loginId,
          attributes: {}
        };

        setUser(awsUser);

        // Check admin role from user attributes or external service
        // For now, set based on email domain or specific users
        const adminEmails = ['info@matbakh.app', 'admin@matbakh.app'];
        setIsAdmin(adminEmails.includes(currentUser.username));
        setHasCompletedUserProfile(true);

      } catch (error) {
        console.log('AWS AuthProvider: No current user found');
        setUser(null);
        setIsAdmin(false);
        setHasCompletedUserProfile(false);
      } finally {
        setLoading(false);
      }
    };

    checkCurrentUser();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    console.log('AWS AuthProvider: Starting email sign in');
    setOauthError(null);

    try {
      const result = await signIn({ username: email, password });

      if (result.isSignedIn) {
        // Get user details after successful sign in
        const currentUser = await getCurrentUser();
        const awsUser: AWSUser = {
          id: currentUser.userId,
          email: currentUser.username,
          name: currentUser.signInDetails?.loginId,
          attributes: {}
        };

        setUser(awsUser);

        // Check admin role
        const adminEmails = ['info@matbakh.app', 'admin@matbakh.app'];
        setIsAdmin(adminEmails.includes(currentUser.username));
        setHasCompletedUserProfile(true);

        return { error: null };
      }

      return { error: new Error('Sign in incomplete') };
    } catch (error) {
      console.error('AWS AuthProvider: Email login error:', error);
      setOauthError(error instanceof Error ? error.message : 'Login failed');
      return { error };
    }
  };

  const handleSignUp = async (email: string, password: string, attributes?: Record<string, any>) => {
    console.log('AWS AuthProvider: Starting sign up');
    setOauthError(null);

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...attributes
          }
        }
      });

      return { error: null };
    } catch (error) {
      console.error('AWS AuthProvider: Sign up error:', error);
      setOauthError(error instanceof Error ? error.message : 'Sign up failed');
      return { error };
    }
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    console.log('AWS AuthProvider: Confirming sign up');
    setOauthError(null);

    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { error: null };
    } catch (error) {
      console.error('AWS AuthProvider: Confirm sign up error:', error);
      setOauthError(error instanceof Error ? error.message : 'Confirmation failed');
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    console.log('AWS AuthProvider: Starting Google OAuth sign in');
    setOauthError(null);

    try {
      // AWS Cognito OAuth with Google
      const domain = 'matbakh-auth.auth.eu-central-1.amazoncognito.com';
      const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');

      const oauthUrl = `https://${domain}/oauth2/authorize?` +
        `identity_provider=Google&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `scope=openid email profile`;

      window.location.href = oauthUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth error';
      console.error('AWS AuthProvider: Google OAuth error:', errorMessage);
      setOauthError(`Google Login fehlgeschlagen: ${errorMessage}`);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    console.log('AWS AuthProvider: Starting Facebook OAuth sign in');
    setOauthError(null);

    try {
      // AWS Cognito OAuth with Facebook
      const domain = 'matbakh-auth.auth.eu-central-1.amazoncognito.com';
      const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');

      const oauthUrl = `https://${domain}/oauth2/authorize?` +
        `identity_provider=Facebook&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `scope=openid email profile`;

      window.location.href = oauthUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth error';
      console.error('AWS AuthProvider: Facebook OAuth error:', errorMessage);
      setOauthError(`Facebook Login fehlgeschlagen: ${errorMessage}`);
      throw error;
    }
  };

  const handleSignOut = async () => {
    console.log('AWS AuthProvider: Signing out');
    try {
      await signOut();
      setUser(null);
      setIsAdmin(false);
      setHasCompletedUserProfile(false);
      navigate('/');
    } catch (error) {
      console.error('AWS AuthProvider: Sign out error:', error);
    }
  };

  // Modal functions
  const openAuthModal = (mode: 'login' | 'register', vcData?: any) => {
    setAuthModalMode(mode);
    setVcData(vcData || null);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setVcData(null);
  };

  const value = {
    user,
    loading,
    isAdmin,
    hasCompletedUserProfile,
    signInWithGoogle,
    signInWithFacebook,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    oauthError,
    // Modal values
    showAuthModal,
    authModalMode,
    vcData,
    openAuthModal,
    closeAuthModal
  };

  // Allow public pages to render even while auth is loading
  const publicRoutesRender = [
    '/',
    '/business/partner',
    '/visibility',
    '/visibilitycheck',
    '/visibilitycheck/onboarding',
    '/visibilitycheck/onboarding/step1',
    '/visibilitycheck/onboarding/step2',
    '/visibilitycheck/confirm',
    '/visibility-check',
    '/profile',
    '/company-profile',
    '/impressum',
    '/datenschutz',
    '/agb',
    '/persona-debug' // Add persona debug route
  ];
  const isOnPublicRouteRender = publicRoutesRender.some(route =>
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  return (
    <AuthContext.Provider value={value}>
      {loading && !isOnPublicRouteRender ? (
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