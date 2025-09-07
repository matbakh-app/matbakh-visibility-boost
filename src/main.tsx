import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { HelmetProvider } from 'react-helmet-async'

// Zentrale Provider-Architektur
import { AppProviders } from '@/contexts/AppProviders'

// i18n initialisieren BEVOR App geladen wird
import './i18n'

import App from './App'
import './index.css'

console.log('🚀 Starting matbakh.app with unified provider architecture')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AppProviders>
        <BrowserRouter>
          <App />
          <SpeedInsights />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </AppProviders>
    </HelmetProvider>
  </React.StrictMode>,
)
