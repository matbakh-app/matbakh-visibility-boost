
import { Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import BusinessLanding from '@/pages/BusinessLanding';
import B2CLanding from '@/pages/B2CLanding';
import ServicesPage from '@/pages/ServicesPage';
import AngebotePage from '@/pages/AngebotePage';
import AngeboteDE from '@/pages/AngeboteDE';
import PackagesEN from '@/pages/PackagesEN';
import BusinessLogin from '@/pages/BusinessLogin';
import PartnerOnboarding from '@/pages/PartnerOnboarding';
import PartnerProfile from '@/pages/PartnerProfile';
import PartnerCalendar from '@/pages/PartnerCalendar';
import RegistrationOptions from '@/pages/RegistrationOptions';
import EmailRegistration from '@/pages/EmailRegistration';
import StandardOnboarding from '@/pages/StandardOnboarding';
import GoogleOAuth from '@/pages/GoogleOAuth';
import GoogleCallback from '@/pages/GoogleCallback';
import GoogleEnhancedOnboarding from '@/pages/GoogleEnhancedOnboarding';
import DashboardMain from '@/pages/DashboardMain';
import AdminPanel from '@/pages/AdminPanel';
import PasswordReset from '@/pages/PasswordReset';
import NotFound from '@/pages/NotFound';
import NotesPage from '@/pages/NotesPage';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import VisibilityCheckVerified from '@/pages/VisibilityCheckVerified';
import RedeemPage from '@/pages/RedeemPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MyProfile } from '@/components/Profile/MyProfile';
import { CompanyProfile } from '@/components/Profile/CompanyProfile';
import AppLayout from '@/components/layout/AppLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import VisibilityCheckPage from '@/components/visibility/VisibilityCheckPage';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoginPage from '@/pages/LoginPage';

import { GoogleOAuthCallback } from '@/components/auth/GoogleOAuthCallback';
import { QuickVerifyMode } from '@/components/onboarding/QuickVerifyMode';

// Legal pages
import Impressum from '@/pages/legal/Impressum';
import Datenschutz from '@/pages/legal/Datenschutz';
import AGB from '@/pages/legal/AGB';
import Nutzung from '@/pages/legal/Nutzung';
import Kontakt from '@/pages/legal/Kontakt';
import Imprint from '@/pages/legal/Imprint';
import Privacy from '@/pages/legal/Privacy';
import Terms from '@/pages/legal/Terms';
import Usage from '@/pages/legal/Usage';
import Contact from '@/pages/legal/Contact';
import FacebookDataDeletion from '@/pages/FacebookDataDeletion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Main routes with AppLayout wrapper */}
              <Route path="/" element={<AppLayout><Outlet /></AppLayout>}>
                <Route index element={<Index />} />
                <Route path="business" element={<BusinessLanding />} />
                <Route path="b2c" element={<B2CLanding />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="angebote" element={<AngebotePage />} />
                <Route path="angebote-de" element={<AngeboteDE />} />
                <Route path="packages" element={<PackagesEN />} />
                <Route path="login" element={<BusinessLogin />} />
                <Route path="business/partner/login" element={<BusinessLogin />} />
                <Route path="auth/login" element={<LoginPage />} />
                <Route path="password-reset" element={<PasswordReset />} />
                <Route path="checkout-success" element={<CheckoutSuccess />} />
                <Route path="visibility-check" element={<VisibilityCheckPage />} />
                <Route path="visibility-check/verified/:leadId" element={<VisibilityCheckVerified />} />
                <Route path="redeem" element={<RedeemPage />} />
                <Route path="auth/google/callback" element={<GoogleOAuthCallback />} />
                <Route path="quick-verify" element={<QuickVerifyMode />} />
                <Route path="notes" element={<NotesPage />} />
                
                {/* Profile Routes */}
                <Route path="profile" element={
                  <ProtectedRoute>
                    <MyProfile 
                      onNavigateToCompanyProfile={() => window.location.href = '/company-profile'}
                      onBack={() => window.location.href = '/dashboard'}
                    />
                  </ProtectedRoute>
                } />
                <Route path="company-profile" element={
                  <ProtectedRoute requireCompleteProfile>
                    <CompanyProfile 
                      onSave={(data) => console.log('Company profile saved:', data)}
                      onBack={() => window.location.href = '/profile'}
                    />
                  </ProtectedRoute>
                } />
                
                {/* New Registration Flow */}
                <Route path="register" element={<RegistrationOptions />} />
                <Route path="register/email" element={<EmailRegistration />} />
                <Route path="onboarding/standard" element={<StandardOnboarding />} />
                
                {/* Google OAuth Flow */}
                <Route path="auth/google" element={<GoogleOAuth />} />
                <Route path="auth/callback" element={<GoogleCallback />} />
                <Route path="onboarding/google" element={<GoogleEnhancedOnboarding />} />
                
              {/* Legal pages - German */}
              <Route path="impressum" element={<Impressum />} />
              <Route path="datenschutz" element={<Datenschutz />} />
              <Route path="agb" element={<AGB />} />
              <Route path="nutzung" element={<Nutzung />} />
              <Route path="kontakt" element={<Kontakt />} />
              
              {/* Legal pages - English */}
              <Route path="imprint" element={<Imprint />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="usage" element={<Usage />} />
              <Route path="contact" element={<Contact />} />
              
              {/* Facebook Data Deletion - Required for Facebook App Verification */}
              <Route path="facebook-data-deletion" element={<FacebookDataDeletion />} />
              </Route>

              {/* Partner/Business routes */}
              <Route path="/partner" element={
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              }>
                <Route path="onboarding" element={<PartnerOnboarding />} />
                <Route path="dashboard" element={<DashboardMain />} />
                <Route path="profile" element={<PartnerProfile />} />
                <Route path="calendar" element={<PartnerCalendar />} />
              </Route>

              {/* Dashboard routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Outlet />
                  </DashboardLayout>
                </ProtectedRoute>
              }>
                <Route index element={<DashboardMain />} />
                <Route path="main" element={<DashboardMain />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                </ProtectedRoute>
              }>
                <Route path="panel" element={<AdminPanel />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          
          {/* Global components - properly nested within ThemeProvider */}
          <CookieConsentBanner />
          <Toaster />
          <SonnerToaster />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
