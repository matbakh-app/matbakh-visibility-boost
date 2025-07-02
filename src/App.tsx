import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import AngebotePage from './pages/AngebotePage';
import AngeboteDE from './pages/AngeboteDE';
import PackagesEN from './pages/PackagesEN';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import AGB from './pages/AGB';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import CheckoutSuccess from './pages/CheckoutSuccess';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AngebotePage />} />
            <Route path="/de" element={<AngeboteDE />} />
            <Route path="/en" element={<PackagesEN />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/agb" element={<AGB />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
