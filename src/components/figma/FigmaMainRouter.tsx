import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { VisibilityCheckStep1 } from './VisibilityCheckStep1';
import { VisibilityCheckStep2 } from './VisibilityCheckStep2';
import { VisibilityCheckLoading } from './VisibilityCheckLoading';
import { VisibilityCheckDashboard } from './VisibilityCheckDashboard';

export const FigmaMainRouter: React.FC = () => {
  return (
    <Routes>
      {/* Onboarding Routes */}
      <Route path="onboarding">
        <Route path="step1" element={<VisibilityCheckStep1 />} />
        <Route path="step2" element={<VisibilityCheckStep2 />} />
        <Route path="loading" element={<VisibilityCheckLoading />} />
        <Route index element={<Navigate to="step1" replace />} />
      </Route>

      {/* Dashboard Routes */}
      <Route path="dashboard/*" element={<VisibilityCheckDashboard />} />

      {/* Default redirect */}
      <Route index element={<Navigate to="onboarding/step1" replace />} />
    </Routes>
  );
};