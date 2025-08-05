import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VisibilityCheckOnboarding from './visibility/VisibilityCheckOnboarding';

export const FigmaMainRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="onboarding/*" element={<VisibilityCheckOnboarding />} />
      <Route path="dashboard/*" element={<div>Dashboard coming soon</div>} />
    </Routes>
  );
};