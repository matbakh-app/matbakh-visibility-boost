import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RestaurantInfoStep } from '../../../Figma_Make/VisibilityCheckOnboarding/components/RestaurantInfoStep';
import { WebsiteAnalysisStep } from '../../../Figma_Make/VisibilityCheckOnboarding/components/WebsiteAnalysisStep';
import { AILoadingScreen } from '../../../Figma_Make/VisibilityCheckOnboarding/components/AILoadingScreen';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const FigmaOnboardingRouter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setVCData, getVCData, onOnboardingCompleted } = useUserJourney();
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  const handleStep1Complete = (data: any) => {
    // Store restaurant data in UserJourneyManager
    setVCData({
      businessName: data.restaurantName,
      location: data.address,
      mainCategory: data.mainCategory,
      subCategory: data.priceRange,
      website: data.website,
    });
    
    navigate('/visibilitycheck/onboarding/step2');
  };

  const handleStep2Complete = (data: any) => {
    // Update VCData with website analysis data
    const existingData = getVCData() || {};
    setVCData({
      ...existingData,
      website: data.website,
      facebook: data.benchmarks?.benchmark1,
      instagram: data.benchmarks?.benchmark2,
      benchmarkOne: data.benchmarks?.benchmark1,
      benchmarkTwo: data.benchmarks?.benchmark2,
      benchmarkThree: data.benchmarks?.benchmark3,
    });

    // Start analysis
    setIsAnalysisRunning(true);
    navigate('/visibilitycheck/onboarding/loading');
  };

  const handleAnalysisComplete = () => {
    setIsAnalysisRunning(false);
    onOnboardingCompleted();
    
    // Navigate to appropriate dashboard based on auth status
    if (user) {
      navigate('/visibilitycheck/dashboard/member');
    } else {
      navigate('/visibilitycheck/dashboard/public');
    }
  };

  const handleAnalysisCancel = () => {
    setIsAnalysisRunning(false);
    navigate('/visibilitycheck/onboarding/step1');
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleBackToStep1 = () => {
    navigate('/visibilitycheck/onboarding/step1');
  };

  return (
    <Routes>
      <Route 
        path="step1" 
        element={
          <RestaurantInfoStep
            onNext={handleStep1Complete}
            onBack={handleBackToLanding}
            skipEmailGate={!!user}
          />
        } 
      />
      <Route 
        path="step2" 
        element={
          <WebsiteAnalysisStep
            onNext={handleStep2Complete}
            onBack={handleBackToStep1}
            emailConfirmed={!!user}
          />
        } 
      />
      <Route 
        path="loading" 
        element={
          <AILoadingScreen
            isVisible={isAnalysisRunning}
            onComplete={handleAnalysisComplete}
            onCancel={handleAnalysisCancel}
            userPlan={user ? 'business' : 'premium'}
            usedAnalyses={0}
            totalAnalyses={1}
          />
        } 
      />
      <Route index element={<Navigate to="step1" replace />} />
    </Routes>
  );
};