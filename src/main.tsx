
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext'; 
import '@/lib/i18n';
import App from './App.tsx';
import { I18nProvider } from '@/contexts/i18nContext';
import './index.css';
import { clearExpiredData } from './utils/localStorage';

// Clear expired localStorage data on app load
clearExpiredData();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);
