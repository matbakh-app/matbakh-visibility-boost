
import React, { useState } from 'react';
import VisibilityStepOne from './VisibilityStepOne';
import VisibilityStepTwo from './VisibilityStepTwo';
import VisibilityStepThree from './VisibilityStepThree';
import VisibilityResults from './VisibilityResults';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '@/types/visibility';

export interface VisibilityFormData {
  companyName: string;
  location: string;
  postalCode?: string;
  mainCategory: string;
  subCategory: string;
  matbakhCategory: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  benchmarkOne?: string;
  benchmarkTwo?: string;
  benchmarkThree?: string;
}

const VisibilityWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [stepOneData, setStepOneData] = useState<any>(null);
  const [stepTwoData, setStepTwoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reportRequested, setReportRequested] = useState(false);
  const [instagramCandidates, setInstagramCandidates] = useState<any[]>([]);

  const handleStepOne = async (data: any) => {
    setStepOneData(data);
    
    // Pre-run Instagram candidate search for Step 2
    const preCheckData = {
      businessName: data.companyName,
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

    // Combine all form data
    const completeFormData = {
      businessName: stepOneData.companyName,
      location: stepOneData.location,
      mainCategory: stepOneData.mainCategory,
      subCategory: stepOneData.subCategory,
      matbakhTags: [stepOneData.matbakhCategory],
      website: data.website || '',
      facebookName: data.facebook || '',
      instagramName: data.instagram || '',
      benchmarks: [data.benchmarkOne, data.benchmarkTwo, data.benchmarkThree].filter(Boolean),
      email: ''
    };

    try {
      console.log('🚀 Starting visibility check with data:', completeFormData);
      
      const { data: result, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: completeFormData
      });

      if (error) {
        console.error('❌ Analysis error:', error);
        throw error;
      }

      console.log('✅ Analysis complete:', result);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Error during analysis:', err);
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
        businessName={stepOneData?.companyName || ''}
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
          restaurantName={stepOneData?.companyName}
        />
      )}
    </div>
  );
};

export default VisibilityWizard;
