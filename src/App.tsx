
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import BusinessLanding from "./pages/BusinessLanding";
import BusinessLogin from "./pages/BusinessLogin";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerProfile from "./pages/PartnerProfile";
import PartnerCalendar from "./pages/PartnerCalendar";
import AdminPanel from "./pages/AdminPanel";

// Legal Pages - German
import Impressum from "./pages/legal/Impressum";
import Datenschutz from "./pages/legal/Datenschutz";
import AGB from "./pages/legal/AGB";
import Kontakt from "./pages/legal/Kontakt";

// Legal Pages - English
import Imprint from "./pages/legal/Imprint";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Contact from "./pages/legal/Contact";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* B2B Routes */}
                <Route path="/" element={<BusinessLanding />} />
                <Route path="/business/partner" element={<BusinessLanding />} />
                <Route path="/business/partner/login" element={<BusinessLogin />} />
                
                {/* Partner Dashboard Routes */}
                <Route path="/partner/onboarding" element={<PartnerOnboarding />} />
                <Route path="/partner/dashboard" element={<PartnerDashboard />} />
                <Route path="/partner/profile" element={<PartnerProfile />} />
                <Route path="/partner/calendar" element={<PartnerCalendar />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminPanel />} />
                
                {/* Legal Routes - German */}
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/agb" element={<AGB />} />
                <Route path="/kontakt" element={<Kontakt />} />
                
                {/* Legal Routes - English */}
                <Route path="/imprint" element={<Imprint />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Catch All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
