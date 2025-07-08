
import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthTabsContainer from '@/components/auth/AuthTabsContainer';
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
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Business Partner Portal</h1>
              <p className="text-sm text-gray-600">Melden Sie sich an oder registrieren Sie Ihr Unternehmen</p>
            </div>

            <AuthTabsContainer />
          </div>
        </main>

        <Footer />
      </div>
    </Suspense>
  );
};

export default BusinessLogin;
