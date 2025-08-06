import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '../components/GuestLandingPage'
import RestaurantInfoStep from '../Figma/VisibilityCheckOnboarding/components/RestaurantInfoStep'
import WebsiteAnalysisStep from '../Figma/VisibilityCheckOnboarding/components/WebsiteAnalysisStep'
import LoadingScreen from '../Figma/VisibilityCheckOnboarding/components/AILoadingScreen'

import VCPublicDashboard from '../Figma/VisibilityCheckDashboard/App'
import VCMemberDashboard from '../Figma/RestaurantDashboardSystem/App'

export const FigmaMainRouter: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/visibilitycheck/onboarding/step1" element={<RestaurantInfoStep />} />
    <Route path="/visibilitycheck/onboarding/loading" element={<LoadingScreen />} />
    <Route path="/visibilitycheck/onboarding/step2" element={<WebsiteAnalysisStep />} />
    <Route path="/visibilitycheck/dashboard/public" element={<VCPublicDashboard />} />
    <Route path="/visibilitycheck/dashboard/member" element={<VCMemberDashboard />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)