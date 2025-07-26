
import React, { useState } from 'react';
import VisibilityStepOne from './VisibilityStepOne';
import VisibilityStepTwo from './VisibilityStepTwo';
import VisibilityStepThree from './VisibilityStepThree';
import VisibilityResults from './VisibilityResults';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedLeadTracking } from '@/hooks/useEnhancedLeadTracking';
import type { AnalysisResult } from '@/types/visibility';

export interface VisibilityFormData {
  businessName: string;
  location: string;
  postalCode?: string;
  mainCategory: string;
  subCategory: string;
  matbakhCategory: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  benchmarkOne?: string;
  benchmarkTwo?: string;
  benchmarkThree?: string;
  email?: string;
  gdprConsent?: boolean;
  marketingConsent?: boolean;
}

const VisibilityWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [stepOneData, setStepOneData] = useState<any>(null);
  const [stepTwoData, setStepTwoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reportRequested, setReportRequested] = useState(false);
  const [instagramCandidates, setInstagramCandidates] = useState<any[]>([]);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  
  const { createEnhancedLead, updateLeadAnalysis, processGDPRConsent, trackLeadAction } = useEnhancedLeadTracking();

  const handleStepOne = async (data: any) => {
    setStepOneData(data);
    
    // Pre-run Instagram candidate search for Step 2
    const preCheckData = {
      businessName: data.businessName,
      location: data.location,
      mainCategory: data.mainCategory,
      subCategory: data.subCategory,
      matbakhTags: [data.matbakhCategory],
      website: '',
      facebookName: '',
      instagramName: '',
      benchmarks: [],
      email: ''
    };

    try {
      console.log('🔍 Pre-checking Instagram candidates...');
      const { data: result, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: preCheckData
      });

      if (!error && result?.platformAnalyses) {
        const instagramAnalysis = result.platformAnalyses.find((p: any) => p.platform === 'instagram');
        if (instagramAnalysis?.candidates) {
          console.log(`📸 Found ${instagramAnalysis.candidates.length} Instagram candidates`);
          setInstagramCandidates(instagramAnalysis.candidates);
        }
      }
    } catch (err) {
      console.log('⚠️ Pre-check failed, continuing without candidates:', err);
    }

    setStep(2);
  };

  const handleStepTwo = async (data: any) => {
    setStepTwoData(data);
    setLoading(true);
    setStep(3);

    try {
      // First, create the enhanced lead in our database
      const leadData = {
        business_name: stepOneData.businessName,
        location: stepOneData.location,
        postal_code: stepOneData.postalCode || '',
        main_category: stepOneData.mainCategory,
        sub_category: stepOneData.subCategory,
        matbakh_category: stepOneData.matbakhCategory,
        website: data.website || '',
        facebook_handle: data.facebook || '',
        instagram_handle: data.instagram || '',
        tiktok_handle: data.tiktok || '',
        linkedin_handle: data.linkedin || '',
        benchmarks: [data.benchmarkOne, data.benchmarkTwo, data.benchmarkThree].filter(Boolean),
        email: data.email || '',
        gdpr_consent: data.gdprConsent || false,
        marketing_consent: data.marketingConsent || false,
      };

      console.log('🏗️ Creating enhanced lead:', leadData);
      const leadId = await createEnhancedLead(leadData);
      
      if (!leadId) {
        throw new Error('Failed to create lead');
      }
      
      setCurrentLeadId(leadId);

      // Process GDPR consent
      await processGDPRConsent(leadId, data.email, data.gdprConsent, data.marketingConsent);

      // Track the analysis start action
      await trackLeadAction({
        lead_id: leadId,
        action_type: 'analysis_started',
        details: { step: 'visibility_check' },
      });

      // Prepare data for the legacy analysis function
      const completeFormData = {
        businessName: stepOneData.businessName,
        location: stepOneData.location,
        postalCode: stepOneData.postalCode || '',
        mainCategory: stepOneData.mainCategory,
        subCategory: stepOneData.subCategory,
        matbakhTags: [stepOneData.matbakhCategory],
        website: data.website || '',
        facebookName: data.facebook || '',
        instagramName: data.instagram || '',
        tiktokName: data.tiktok || '',
        linkedinName: data.linkedin || '',
        benchmarks: [data.benchmarkOne, data.benchmarkTwo, data.benchmarkThree].filter(Boolean),
        email: data.email || '',
        gdprConsent: data.gdprConsent || false,
        marketingConsent: data.marketingConsent || false,
        leadId: leadId, // Pass the lead ID to the analysis function
      };

      console.log('🚀 Starting enhanced visibility check with data:', completeFormData);
      
      const { data: result, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: completeFormData
      });

      if (error) {
        console.error('❌ Analysis error:', error);
        await trackLeadAction({
          lead_id: leadId,
          action_type: 'analysis_failed',
          details: { error: error.message },
        });
        throw error;
      }

      console.log('✅ Enhanced analysis complete:', result);
      
      // Update the lead with analysis results
      await updateLeadAnalysis(leadId, result, 'completed');
      
      // Track successful analysis
      await trackLeadAction({
        lead_id: leadId,
        action_type: 'analysis_completed',
        details: { 
          overall_score: result?.overallScore,
          platforms_analyzed: result?.platformAnalyses?.length || 0
        },
      });
      
      setAnalysisResult(result);
    } catch (err) {
      console.error('❌ Error during enhanced analysis:', err);
      
      if (currentLeadId) {
        await updateLeadAnalysis(currentLeadId, { error: err.message }, 'failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStepOneData(null);
    setStepTwoData(null);
    setAnalysisResult(null);
    setInstagramCandidates([]);
    setStep(1);
    setLoading(false);
  };

  const handleRequestDetailedReport = () => {
    setReportRequested(true);
    console.log('📧 Detailed report requested');
  };

  // Show results if analysis is complete
  if (analysisResult) {
    return (
      <VisibilityResults
        businessName={stepOneData?.businessName || ''}
        analysisResult={analysisResult}
        onRequestDetailedReport={handleRequestDetailedReport}
        onNewAnalysis={restart}
        reportRequested={reportRequested}
        email=""
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNum ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {stepNum}
            </div>
            {stepNum < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <VisibilityStepOne 
          onNext={handleStepOne} 
          defaultValues={stepOneData}
        />
      )}
      
      {step === 2 && (
        <VisibilityStepTwo 
          onNext={handleStepTwo}
          onBack={() => setStep(1)}
          defaultValues={stepTwoData}
          instagramCandidates={instagramCandidates}
        />
      )}
      
      {step === 3 && (
        <VisibilityStepThree
          loading={loading}
          success={!!analysisResult}
          onRestart={restart}
          restaurantName={stepOneData?.businessName}
        />
      )}
    </div>
  );
};

export default VisibilityWizard;
