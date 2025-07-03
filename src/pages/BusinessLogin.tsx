
import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModeSelector from '@/components/auth/AuthModeSelector';
import AuthLoadingState from '@/components/auth/AuthLoadingState';
import AuthDebugInfo from '@/components/auth/AuthDebugInfo';

const BusinessLogin: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ready } = useTranslation('auth');

  useEffect(() => {
    if (user && !loading) {
      // Redirect to where they came from or dashboard
      const from = location.state?.from?.pathname || '/partner/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  // Show loading state while i18n or auth is loading
  if (loading || !ready) {
    return <AuthLoadingState />;
  }

  return (
    <Suspense fallback={<AuthLoadingState />}>
      <div className="min-h-screen bg-white">
        <Header />
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <AuthModeSelector />
        </div>
        
        <Footer />
        {process.env.NODE_ENV === 'development' && <AuthDebugInfo />}
      </div>
    </Suspense>
  );
};

export default BusinessLogin;
