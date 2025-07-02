
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import AngebotePage from './pages/AngebotePage';
import AngeboteDE from './pages/AngeboteDE';
import PackagesEN from './pages/PackagesEN';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import AGB from './pages/AGB';
import Dashboard from './pages/Dashboard';
import Nutzung from './pages/legal/Nutzung';
import Usage from './pages/legal/Usage';
import { Toaster } from '@/components/ui/sonner';
import CheckoutSuccess from './pages/CheckoutSuccess';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Routes>
        <Route path="/" element={<AngebotePage />} />
        <Route path="/de" element={<AngeboteDE />} />
        <Route path="/en" element={<PackagesEN />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb" element={<AGB />} />
        <Route path="/nutzung" element={<Nutzung />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout-success" element={<CheckoutSuccess />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
