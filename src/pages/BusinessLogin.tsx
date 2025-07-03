import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModeSelector from '@/components/auth/AuthModeSelector';
import AuthLoadingState from '@/components/auth/AuthLoadingState';

const BusinessLogin: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ready } = useTranslation('auth');

  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/partner/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  if (loading || !ready) {
    return <AuthLoadingState />;
  }

  return (
    <Suspense fallback={<AuthLoadingState />}>
      <div className="min-h-screen bg-white">
        <Header />

        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="w-full max-w-md space-y-6 p-6 border rounded-2xl shadow-sm bg-white">
            <h1 className="text-2xl font-bold text-center">{t('login.title')}</h1>
            <p className="text-sm text-gray-600 text-center">{t('login.subtitle')}</p>

            <AuthModeSelector />

            <p className="text-xs text-gray-500 mt-4 text-center">
              {t('googleCtaNotice')}
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </Suspense>
  );
};

export default BusinessLogin;
