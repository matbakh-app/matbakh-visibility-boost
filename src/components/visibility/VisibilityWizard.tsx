
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
        location: stepOneData.location || null,
        postal_code: stepOneData.postalCode || null,
        main_category: stepOneData.mainCategory || null,
        sub_category: stepOneData.subCategory || null,
        matbakh_category: stepOneData.matbakhCategory || null,
        website: data.website || null,
        facebook_handle: data.facebook || null,
        instagram_handle: data.instagram || null,
        tiktok_handle: data.tiktok || null,
        linkedin_handle: data.linkedin || null,
        benchmarks: [data.benchmarkOne, data.benchmarkTwo, data.benchmarkThree].filter(Boolean),
        email: data.email || null,
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

      // Send double opt-in email immediately after successful analysis
      const leadIdForEmail = currentLeadId || leadId; // Use leadId from the analysis process
      if (leadIdForEmail && completeFormData?.email && completeFormData?.businessName) {
        console.log('📧 Sending double opt-in email...');
        try {
          const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-visibility-report', {
            body: {
              leadId: leadIdForEmail,
              email: completeFormData.email,
              businessName: completeFormData.businessName,
              reportType: 'double_optin'
            }
          });

          if (emailError) {
            console.error('❌ Error sending double opt-in email:', emailError);
          } else {
            console.log('✅ Double opt-in email sent successfully');
          }
        } catch (emailError) {
          console.error('❌ Error sending double opt-in email:', emailError);
        }
      } else {
        console.error('❌ Missing data for email:', { leadIdForEmail, currentLeadId, email: completeFormData?.email, businessName: completeFormData?.businessName });
      }
      
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

  const sendDoubleOptInEmail = async (leadId: string, email: string, businessName: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-visibility-report', {
        body: {
          leadId,
          email,
          businessName,
          reportType: 'basic'
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Double opt-in email sent successfully');
    } catch (error) {
      console.error('❌ Failed to send double opt-in email:', error);
      throw error;
    }
  };

  const handleRequestDetailedReport = async () => {
    setReportRequested(true);
    console.log('📧 Detailed report requested');
    
    // Send detailed report email if we have the necessary data
    if (analysisResult && stepTwoData?.email && stepOneData?.businessName) {
      try {
        // Get the lead ID from the current analysis
        const leadId = (analysisResult as any)?.leadId;
        if (leadId) {
          await supabase.functions.invoke('send-visibility-report', {
            body: {
              leadId,
              email: stepTwoData.email,
              businessName: stepOneData.businessName,
              reportType: 'detailed'
            }
          });
          console.log('✅ Detailed report email sent successfully');
        }
      } catch (error) {
        console.error('❌ Failed to send detailed report email:', error);
      }
    }
  };

  // Show double opt-in confirmation if analysis is complete
  if (analysisResult) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-16 px-6 max-w-xl mx-auto">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Analyse abgeschlossen!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Vielen Dank für Ihr Interesse an unserem Sichtbarkeits-Check für <strong>{stepOneData?.businessName}</strong>.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📧 Bestätigungs-E-Mail versendet
            </h3>
            <p className="text-blue-800 text-sm">
              Wir haben Ihnen eine E-Mail an <strong>{stepTwoData?.email}</strong> gesendet. 
              Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihren detaillierten Sichtbarkeits-Report zu erhalten.
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>✅ Ihr Gesamtscore: <strong>{analysisResult.overallScore}/100</strong></p>
            <p>📊 {analysisResult.platformAnalyses?.length || 0} Plattformen analysiert</p>
            <p>🎯 {analysisResult.quickWins?.length || 0} sofortige Verbesserungen identifiziert</p>
          </div>
          
          <div className="mt-8 space-y-4">
            <p className="text-xs text-gray-500">
              E-Mail nicht erhalten? Prüfen Sie Ihren Spam-Ordner oder 
              <button 
                onClick={restart}
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                starten Sie eine neue Analyse
              </button>
            </p>
            
            <button
              onClick={restart}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Neue Analyse starten
            </button>
          </div>
        </div>
      </div>
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
