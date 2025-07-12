/*  ⚠️ KRITISCHE ROUTING-DATEI – NICHT OHNE GENEHMIGUNG ÄNDERN! ⚠️
 *
 *  Diese Datei definiert alle URL-Routen der Website.
 *  Eine falsche Änderung bricht:
 *    – Benutzer-Navigation komplett
 *    – SEO-URLs (/angebote, /packages)
 *    – Mehrsprachige Weiterleitung
 *
 *  VOR JEDEM COMMIT:
 *    1) Änderung mit Product-Owner abklären
 *    2) Routing-Tests durchführen
 *    3) Sitemap.xml auf Konsistenz prüfen
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import './App.css';
import './lib/i18n'; // Initialize i18n with validation

if (process.env.NODE_ENV === 'development') {
  console.warn('🚨 App.tsx Routing geladen – Änderungen nur nach Approval!');
}

import AngebotePage from './pages/AngebotePage';
import AngeboteDE from './pages/AngeboteDE';
import PackagesEN from './pages/PackagesEN';
import Datenschutz from './pages/legal/Datenschutz';
import Privacy from './pages/legal/Privacy';
import Impressum from './pages/legal/Impressum';
import Imprint from './pages/legal/Imprint';
import AGB from './pages/legal/AGB';
import Terms from './pages/legal/Terms';
import Dashboard from './pages/Dashboard';
import Nutzung from './pages/legal/Nutzung';
import Usage from './pages/legal/Usage';
import ServicesPage from './pages/ServicesPage';
import B2CLanding from './pages/B2CLanding';
import BusinessLanding from './pages/BusinessLanding';
import Kontakt from './pages/legal/Kontakt';
import Contact from './pages/legal/Contact';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AdminPanel from './pages/AdminPanel';
import BusinessLogin from './pages/BusinessLogin';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerOnboarding from './pages/PartnerOnboarding';
import PartnerProfile from './pages/PartnerProfile';
import PartnerCalendar from './pages/PartnerCalendar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { I18nDebugPanel } from '@/hooks/useI18nDebug';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminRouteWrapper />
      <CookieConsentBanner />
    </QueryClientProvider>
  );
}

function AdminRouteWrapper() {
  const { isAdmin } = useAuth();
  
  return (
    <>
      <Toaster />
      <I18nDebugPanel />
      <Routes>
        <Route path="/" element={<AngebotePage />} />
        <Route path="/de" element={<AngeboteDE />} />
        <Route path="/en" element={<PackagesEN />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/b2c" element={<B2CLanding />} />
        <Route path="/b2c-en" element={<B2CLanding />} />
        <Route path="/business/partner" element={<BusinessLanding />} />
        <Route path="/angebote" element={<AngeboteDE />} />
        <Route path="/packages" element={<PackagesEN />} />
        {/* Legal Routes - DE */}
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/agb" element={<AGB />} />
        <Route path="/nutzung" element={<Nutzung />} />
        
        {/* Legal Routes - EN */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
        
        {/* Auth Routes */}
        <Route path="/business/partner/login" element={<BusinessLogin />} />
        
        {/* Protected Partner Routes */}
        <Route path="/partner/dashboard" element={
          <ProtectedRoute requirePartner={true}>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/partner/profile" element={
          <ProtectedRoute requirePartner={true}>
            <Navigate to="/dashboard/profile" replace />
          </ProtectedRoute>
        } />
        <Route path="/partner/calendar" element={
          <ProtectedRoute requirePartner={true}>
            <Navigate to="/dashboard/calendar" replace />
          </ProtectedRoute>
        } />
        <Route path="/partner/onboarding" element={
          <ProtectedRoute requirePartner={true}>
            <PartnerOnboarding />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        {isAdmin && (
          <Route path="/admin" element={<AdminPanel />} />
        )}
        
        {/* Legacy Redirects removed - now using proper dual-language routes */}
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
