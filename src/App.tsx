
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import BusinessLogin from "./pages/BusinessLogin";
import BusinessLanding from "./pages/BusinessLanding";
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

// Legal pages - English
import Imprint from "./pages/legal/Imprint";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Contact from "./pages/legal/Contact";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/business/login" element={<BusinessLogin />} />
                  <Route path="/business/partner" element={<BusinessLanding />} />
                  <Route path="/partner/onboarding" element={<PartnerOnboarding />} />
                  <Route path="/partner/dashboard" element={<PartnerDashboard />} />
                  <Route path="/partner/profile" element={<PartnerProfile />} />
                  <Route path="/partner/calendar" element={<PartnerCalendar />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/notes" element={<NotesPage />} />
                  
                  {/* German legal pages */}
                  <Route path="/impressum" element={<Impressum />} />
                  <Route path="/datenschutz" element={<Datenschutz />} />
                  <Route path="/agb" element={<AGB />} />
                  <Route path="/kontakt" element={<Kontakt />} />
                  
                  {/* English legal pages */}
                  <Route path="/imprint" element={<Imprint />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
