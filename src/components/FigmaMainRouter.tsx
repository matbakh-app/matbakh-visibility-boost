import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '../components/GuestLandingPage'
import SimpleTestComponent from '../components/SimpleTestComponent'

export const FigmaMainRouter: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/visibilitycheck/onboarding/step1" element={<SimpleTestComponent />} />
    <Route path="/visibilitycheck/onboarding/loading" element={<SimpleTestComponent />} />
    <Route path="/visibilitycheck/onboarding/step2" element={<SimpleTestComponent />} />
    <Route path="/visibilitycheck/dashboard/public" element={<SimpleTestComponent />} />
    <Route path="/visibilitycheck/dashboard/member" element={<SimpleTestComponent />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)