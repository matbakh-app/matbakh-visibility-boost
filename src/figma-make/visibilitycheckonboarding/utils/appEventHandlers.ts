import { UserType, UserPlan, RestaurantFormData, WebsiteAnalysisFormData, GuestCodeInfo, ScheduleSettings, AIStatus } from '../types/app';
import { ViewType } from '../hooks/useAppNavigation';

export interface AppEventHandlers {
  // Analysis handlers
  handleStartAnalysis: () => void;
  handleAnalysisComplete: () => void;
  handleAnalysisCancel: () => void;
  handlePurchaseAnalysis: () => void;
  
  // Form handlers
  handleStep1Complete: (data: RestaurantFormData) => void;
  handleStep2Complete: (data: WebsiteAnalysisFormData) => void;
  
  // User handlers - FIXED: Both buttons navigate to Step1 for onboarding
  handleGuestCodeValidated: (codeInfo: GuestCodeInfo) => void;
  handleContinueWithoutCode: () => void;
  handleLogin: () => void;
  handleGuestCreateAccount: () => void;
  handleEmailResults: () => void;
  
  // Navigation handlers
  handleBackToVCLanding: () => void;
  handleBackToStep1: () => void;
  handleBackToDashboard: () => void;
  
  // Schedule handlers
  handleScheduleChange: (enabled: boolean, time: string, emailNotification: boolean) => void;
  handleSmartScheduleChange: (settings: ScheduleSettings) => void;
}

export function createAppEventHandlers(
  // State setters
  setRestaurantData: (data: RestaurantFormData | null) => void,
  setWebsiteAnalysisData: (data: WebsiteAnalysisFormData | null) => void,
  setCurrentStep: (step: number) => void,
  setIsAnalysisRunning: (running: boolean) => void,
  setAiStatus: (status: AIStatus) => void,
  setAnalysisQueue: (queue: number | null) => void,
  setGuestCodeInfo: (info: GuestCodeInfo | null) => void,
  setUserType: (type: UserType) => void,
  setUserPlan: (plan: UserPlan) => void,
  setScheduleSettings: (settings: ScheduleSettings) => void,
  
  // Current state values
  userType: UserType,
  userPlan: UserPlan,
  canStart: boolean,
  
  // Navigation function
  navigateToView: (view: ViewType) => void,
  resetFormData: () => void
): AppEventHandlers {
  
  const handleStartAnalysis = () => {
    if (!canStart) return;
    setIsAnalysisRunning(true);
    setAiStatus('busy');
    navigateToView('loading');
    setAnalysisQueue(userType === 'guest' || userPlan === 'premium' ? 1 : 3);
  };

  const handleAnalysisComplete = () => {
    setIsAnalysisRunning(false);
    setAiStatus('ready');
    navigateToView('results');
    setAnalysisQueue(null);
    if (userPlan !== 'premium' && userType !== 'guest') {
      console.log('Analysis completed, usage updated');
    }
  };

  const handleAnalysisCancel = () => {
    setIsAnalysisRunning(false);
    setAiStatus('ready');
    if (userType === 'guest') {
      navigateToView('landing');
    } else {
      navigateToView('dashboard');
    }
    setAnalysisQueue(null);
  };

  const handlePurchaseAnalysis = () => {
    console.log('Purchasing additional analysis');
    alert('Payment successful! Analysis credit added.');
  };

  const handleStep1Complete = (data: RestaurantFormData) => {
    setRestaurantData(data);
    setCurrentStep(2);
    navigateToView('step2');
    console.log('Restaurant data:', data);
  };

  const handleStep2Complete = (data: WebsiteAnalysisFormData) => {
    setWebsiteAnalysisData(data);
    
    if (userType === 'guest' || data.emailConfirmed) {
      handleStartAnalysis();
    } else {
      navigateToView('dashboard');
      alert('Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie die Analyse starten können.');
    }
    
    console.log('Website analysis data:', data);
  };

  const handleGuestCodeValidated = (codeInfo: GuestCodeInfo) => {
    setGuestCodeInfo(codeInfo);
    setUserType('guest');
    navigateToView('step1'); // Guest users go through onboarding
    console.log('Guest code validated:', codeInfo);
  };

  // FIXED: Both registration buttons now navigate to Step1 for onboarding
  const handleContinueWithoutCode = () => {
    setUserType('registered');
    navigateToView('step1'); // Navigate to onboarding, not dashboard
  };

  const handleLogin = () => {
    localStorage.setItem('isRegistered', 'true');
    setUserType('registered');
    navigateToView('step1'); // Navigate to onboarding for first-time setup
  };

  const handleGuestCreateAccount = () => {
    localStorage.setItem('isRegistered', 'true');
    setUserType('registered');
    setUserPlan('business');
    navigateToView('dashboard');
    alert('Account erstellt! Sie haben den Business Plan für 30 Tage kostenlos erhalten.');
  };

  const handleEmailResults = () => {
    console.log('Email results sent to guest user');
    alert('PDF-Report wurde an Ihre Email-Adresse gesendet!');
  };

  const handleBackToVCLanding = () => {
    navigateToView('landing');
    resetFormData();
  };

  const handleBackToStep1 = () => {
    navigateToView('step1');
    setCurrentStep(1);
  };

  const handleBackToDashboard = () => {
    if (userType === 'guest') {
      navigateToView('landing');
    } else {
      navigateToView('dashboard');
    }
  };

  const handleScheduleChange = (enabled: boolean, time: string, emailNotification: boolean) => {
    console.log('Schedule changed:', { enabled, time, emailNotification });
  };

  const handleSmartScheduleChange = (settings: ScheduleSettings) => {
    setScheduleSettings(settings);
    console.log('Smart schedule settings:', settings);
  };

  return {
    handleStartAnalysis,
    handleAnalysisComplete,
    handleAnalysisCancel,
    handlePurchaseAnalysis,
    handleStep1Complete,
    handleStep2Complete,
    handleGuestCodeValidated,
    handleContinueWithoutCode,
    handleLogin,
    handleGuestCreateAccount,
    handleEmailResults,
    handleBackToVCLanding,
    handleBackToStep1,
    handleBackToDashboard,
    handleScheduleChange,
    handleSmartScheduleChange
  };
}