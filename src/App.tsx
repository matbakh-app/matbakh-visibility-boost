
import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import PartnerDashboard from '@/pages/PartnerDashboard';
import PartnerProfile from '@/pages/PartnerProfile';
import PartnerCalendar from '@/pages/PartnerCalendar';
import Dashboard from '@/pages/Dashboard';
import DashboardOverview from '@/pages/DashboardOverview';
import DashboardProfile from '@/pages/DashboardProfile';
import DashboardGmb from '@/pages/DashboardGmb';
import DashboardGa4 from '@/pages/DashboardGa4';
import DashboardSocial from '@/pages/DashboardSocial';
import DashboardReports from '@/pages/DashboardReports';
import AdminPanel from '@/pages/AdminPanel';
import PasswordReset from '@/pages/PasswordReset';
import NotFound from '@/pages/NotFound';
import NotesPage from '@/pages/NotesPage';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import VisibilityCheckPage from '@/components/visibility/VisibilityCheckPage';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { DashboardRedirect } from '@/components/DashboardRedirect';

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Main routes */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="business" element={<BusinessLanding />} />
                <Route path="b2c" element={<B2CLanding />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="angebote" element={<AngebotePage />} />
                <Route path="angebote-de" element={<AngeboteDE />} />
                <Route path="packages" element={<PackagesEN />} />
                <Route path="login" element={<BusinessLogin />} />
                <Route path="password-reset" element={<PasswordReset />} />
                <Route path="checkout-success" element={<CheckoutSuccess />} />
                <Route path="visibility-check" element={<VisibilityCheckPage />} />
                <Route path="notes" element={<NotesPage />} />
                
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
              </Route>

              {/* Partner/Business routes */}
              <Route path="/partner" element={
                <ProtectedRoute>
                  <div />
                </ProtectedRoute>
              }>
                <Route path="onboarding" element={<PartnerOnboarding />} />
                <Route path="dashboard" element={<PartnerDashboard />} />
                <Route path="profile" element={<PartnerProfile />} />
                <Route path="calendar" element={<PartnerCalendar />} />
              </Route>

              {/* Dashboard routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardRedirect />} />
                <Route path="overview" element={<DashboardOverview />} />
                <Route path="profile" element={<DashboardProfile />} />
                <Route path="gmb" element={<DashboardGmb />} />
                <Route path="ga4" element={<DashboardGa4 />} />
                <Route path="social" element={<DashboardSocial />} />
                <Route path="reports" element={<DashboardReports />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
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
  );
}

export default App;
