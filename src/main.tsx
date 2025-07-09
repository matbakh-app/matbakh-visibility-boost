
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext'; 
import '@/lib/i18n';
import App from './App.tsx';
import './index.css';
import { clearExpiredData } from './utils/localStorage';

// Clear expired localStorage data on app load
clearExpiredData();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);
