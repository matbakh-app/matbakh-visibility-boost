
import { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

// Core pages - loaded immediately
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthModal } from '@/components/auth/AuthModal';

// Layouts - loaded immediately for structure
import AppLayout from '@/components/layout/AppLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loaded pages and components
const BusinessLanding = lazy(() => import('@/pages/BusinessLanding'));
const B2CLanding = lazy(() => import('@/pages/B2CLanding'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const AngebotePage = lazy(() => import('@/pages/AngebotePage'));
const AngeboteDE = lazy(() => import('@/pages/AngeboteDE'));
const PackagesEN = lazy(() => import('@/pages/PackagesEN'));
const BusinessLogin = lazy(() => import('@/pages/BusinessLogin'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const PasswordReset = lazy(() => import('@/pages/PasswordReset'));

// Partner/Business pages
const PartnerOnboarding = lazy(() => import('@/pages/PartnerOnboarding'));
const PartnerProfile = lazy(() => import('@/pages/PartnerProfile'));
const PartnerCalendar = lazy(() => import('@/pages/PartnerCalendar'));
const DashboardMain = lazy(() => import('@/pages/DashboardMain'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));

// Registration & Auth
const RegistrationOptions = lazy(() => import('@/pages/RegistrationOptions'));
const EmailRegistration = lazy(() => import('@/pages/EmailRegistration'));
const StandardOnboarding = lazy(() => import('@/pages/StandardOnboarding'));
const GoogleOAuth = lazy(() => import('@/pages/GoogleOAuth'));
const GoogleCallback = lazy(() => import('@/pages/GoogleCallback'));
const GoogleEnhancedOnboarding = lazy(() => import('@/pages/GoogleEnhancedOnboarding'));

// Utility pages
const NotesPage = lazy(() => import('@/pages/NotesPage'));
const CheckoutSuccess = lazy(() => import('@/pages/CheckoutSuccess'));
const RedeemPage = lazy(() => import('@/pages/RedeemPage'));

// Visibility Check
const VisibilityCheckPage = lazy(() => import('@/components/visibility/VisibilityCheckPage'));
const VisibilityCheckVerified = lazy(() => import('@/pages/VisibilityCheckVerified'));

// Profile components
const MyProfile = lazy(() => import('@/components/Profile/MyProfile').then(m => ({ default: m.MyProfile })));
const CompanyProfile = lazy(() => import('@/components/Profile/CompanyProfile').then(m => ({ default: m.CompanyProfile })));

import { GoogleOAuthCallback } from '@/components/auth/GoogleOAuthCallback';
import { QuickVerifyMode } from '@/components/onboarding/QuickVerifyMode';
import { RestaurantInfoStep } from '@/components/figma-onboarding/RestaurantInfoStep';
import { WebsiteAnalysisStep } from '@/components/figma-onboarding/WebsiteAnalysisStep';

// DEBUG: Navigate tracing (DEV only)
if (import.meta.env.DEV) {
  const origNavigate = console.log; // Will be replaced in useNavigate hook
}

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

// VC Route wrappers to handle navigation and data persistence
function VCStep1Route() {
  const navigate = useNavigate();
  return (
    <RestaurantInfoStep
      onNext={(data) => {
        console.log('Step 1 data:', data);
        try {
          const prev = JSON.parse(localStorage.getItem('vc:data') || '{}');
          localStorage.setItem('vc:data', JSON.stringify({ ...prev, ...data }));
        } catch {}
        navigate('/visibilitycheck/onboarding/step2');
      }}
      onBack={() => window.history.back()}
      skipEmailGate={true}
    />
  );
}

function VCStep2Route() {
  return (
    <WebsiteAnalysisStep
      onNext={(data) => {
        console.log('Step 2 data:', data);
      }}
      onBack={() => window.history.back()}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-background">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-pulse">Loading...</div>
            </div>
          }>
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
                
                {/* Figma-based Visibility Check Routes */}
                <Route path="visibilitycheck/onboarding/step1" element={<VCStep1Route />} />
                <Route path="visibilitycheck/onboarding/step2" element={<VCStep2Route />} />
                
                {/* Temporarily disabled Figma Router */}
                {/* <Route path="visibilitycheck/*" element={<FigmaMainRouter />} /> */}
                
                <Route path="redeem" element={<RedeemPage />} />
                <Route path="auth/google/callback" element={<GoogleOAuthCallback />} />
                <Route path="quick-verify" element={<QuickVerifyMode />} />
                <Route path="notes" element={<NotesPage />} />
                
                {/* Profile Routes */}
                <Route path="profile" element={
                  <ProtectedRoute>
                    <MyProfile />
                  </ProtectedRoute>
                } />
                <Route path="company-profile" element={
                  <ProtectedRoute>
                    <CompanyProfile />
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
          <AuthModal />
          <Toaster />
          <SonnerToaster />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
