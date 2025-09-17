import { Suspense, lazy } from 'react';
import CognitoTest from './pages/CognitoTest';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

// Core pages - loaded immediately
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import ErrorBoundary from '@/components/ErrorBoundary';

// Test Pages
const TestHome = lazy(() => import('@/pages/TestHome'));
const AuthDebug = lazy(() => import('@/pages/AuthDebug'));
const PersonaDebug = lazy(() => import('@/pages/PersonaDebug'));

// SEO - disabled for now to avoid Helmet errors
// import Canonical from '@/components/seo/Canonical';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {/* Canonical tag disabled for now to avoid Helmet errors */}
        {/* <Canonical /> */}

        <div className="min-h-screen bg-background">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-pulse">Loading...</div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cognito-test" element={<CognitoTest />} />
              <Route path="/test" element={<TestHome />} />
              <Route path="/auth-debug" element={<AuthDebug />} />
              <Route path="/persona-debug" element={<PersonaDebug />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Global components - minimal for now */}
          <Toaster />
          <SonnerToaster />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;