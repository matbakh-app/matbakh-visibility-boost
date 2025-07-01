
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Index from "./pages/Index";
import BusinessLogin from "./pages/BusinessLogin";
import BusinessLanding from "./pages/BusinessLanding";
import ServicesPage from "./pages/ServicesPage";
import AngeboteDE from "./pages/AngeboteDE";
import PackagesEN from "./pages/PackagesEN";
import B2CLanding from "./pages/B2CLanding";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerProfile from "./pages/PartnerProfile";
import PartnerCalendar from "./pages/PartnerCalendar";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import NotesPage from "./pages/NotesPage";

// Legal pages - German
import Impressum from "./pages/legal/Impressum";
import Datenschutz from "./pages/legal/Datenschutz";
import AGB from "./pages/legal/AGB";
import Kontakt from "./pages/legal/Kontakt";
import Nutzung from "./pages/legal/Nutzung";

// Legal pages - English
import Imprint from "./pages/legal/Imprint";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Contact from "./pages/legal/Contact";
import Usage from "./pages/legal/Usage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Landing page ohne Layout */}
              <Route path="/" element={<Index />} />
              
              {/* Alle anderen Seiten mit Layout */}
              <Route path="/business/login" element={<AppLayout><BusinessLogin /></AppLayout>} />
              <Route path="/business/partner" element={<AppLayout><BusinessLanding /></AppLayout>} />
              <Route path="/services" element={<AppLayout><ServicesPage /></AppLayout>} />
              <Route path="/angebote" element={<AppLayout><AngeboteDE /></AppLayout>} />
              <Route path="/packages" element={<AppLayout><PackagesEN /></AppLayout>} />
              <Route path="/b2c" element={<AppLayout><B2CLanding /></AppLayout>} />
              <Route path="/b2c-en" element={<AppLayout><B2CLanding /></AppLayout>} />
              <Route path="/partner/onboarding" element={<AppLayout><PartnerOnboarding /></AppLayout>} />
              <Route path="/partner/dashboard" element={<AppLayout><PartnerDashboard /></AppLayout>} />
              <Route path="/partner/profile" element={<AppLayout><PartnerProfile /></AppLayout>} />
              <Route path="/partner/calendar" element={<AppLayout><PartnerCalendar /></AppLayout>} />
              <Route path="/admin" element={<AppLayout><AdminPanel /></AppLayout>} />
              <Route path="/notes" element={<AppLayout><NotesPage /></AppLayout>} />
              
              {/* German legal pages */}
              <Route path="/impressum" element={<AppLayout><Impressum /></AppLayout>} />
              <Route path="/datenschutz" element={<AppLayout><Datenschutz /></AppLayout>} />
              <Route path="/agb" element={<AppLayout><AGB /></AppLayout>} />
              <Route path="/kontakt" element={<AppLayout><Kontakt /></AppLayout>} />
              <Route path="/nutzung" element={<AppLayout><Nutzung /></AppLayout>} />
              
              {/* English legal pages */}
              <Route path="/imprint" element={<AppLayout><Imprint /></AppLayout>} />
              <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
              <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
              <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
              <Route path="/usage" element={<AppLayout><Usage /></AppLayout>} />
              
              <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
