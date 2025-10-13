import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import CognitoTest from './pages/CognitoTest';

// Import optimization engine for auto-initialization
import { automaticOptimizationEngine } from '@/lib/optimization';

// Development tools
import DevTools from '@/components/dev/DevTools';
import { devTools, isDevelopment } from '@/lib/dev-utils';

// Core pages - loaded immediately
import ErrorBoundary from '@/components/ErrorBoundary';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

// Test Pages
const TestHome = lazy(() => import('@/pages/TestHome'));
const AuthDebug = lazy(() => import('@/pages/AuthDebug'));
const PersonaDebug = lazy(() => import('@/pages/PersonaDebug'));
const OptimizationTest = lazy(() => import('@/pages/OptimizationTest'));

// Admin/Optimization Pages
const OptimizationDashboard = lazy(() => import('@/components/optimization/OptimizationDashboard'));
const BedrockActivationDashboard = lazy(() => import('@/pages/admin/BedrockActivationDashboard'));

// VC Pages
const VCQuick = lazy(() => import('@/pages/vc/VCQuick'));
const VCResult = lazy(() => import('@/pages/vc/VCResult'));
const VCResultDashboard = lazy(() => import('@/pages/vc/VCResultDashboard'));

// SEO - disabled for now to avoid Helmet errors
// import Canonical from '@/components/seo/Canonical';

function App() {
  // Initialize optimization engine and dev tools on app start
  useEffect(() => {
    const initializeOptimization = async () => {
      try {
        await automaticOptimizationEngine.initialize();
        console.log('Automatic Optimization Engine initialized');
      } catch (error) {
        console.warn('Failed to initialize optimization engine:', error);
      }
    };

    // Initialize development tools
    if (isDevelopment) {
      devTools.enableReactDevTools();
      devTools.enablePerformanceObserver();
    }

    initializeOptimization();

    // Cleanup on unmount
    return () => {
      automaticOptimizationEngine.destroy();
    };
  }, []);

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
              <Route path="/optimization-test" element={<OptimizationTest />} />

              {/* VC (Visibility Check) Routes */}
              <Route path="/vc/quick" element={<VCQuick />} />
              <Route path="/vc/result" element={<VCResult />} />
              <Route path="/vc/result/dashboard" element={<VCResultDashboard />} />

              {/* Admin/Optimization Routes */}
              <Route path="/admin/optimization" element={<OptimizationDashboard />} />
              <Route path="/admin/bedrock-activation" element={<BedrockActivationDashboard />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Global components - minimal for now */}
          <Toaster />
          <SonnerToaster />

          {/* Development tools - only in development */}
          {isDevelopment && <DevTools />}
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;