
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import VisibilityStepOne from './VisibilityStepOne';
import VisibilityStepTwo from './VisibilityStepTwo';
import VisibilityStepThree from './VisibilityStepThree';
import VisibilityResults from './VisibilityResults';
// TODO: Migrate to AWS Lambda VC API  
// Temporarily disabled during Supabase migration
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
  // Enhanced fields according to blueprint
  categoryId?: number;
  categoryName?: string;
  competitorUrls?: string[];
  language?: string;
  locationData?: {
    city: string;
    country: string;
    coordinates?: [number, number];
  };
  socialLinks?: Record<string, string>;
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
        businessName: stepOneData.businessName,
        location: stepOneData.location || '',
        postalCode: stepOneData.postalCode || '',
        mainCategory: stepOneData.mainCategory,
        subCategory: stepOneData.subCategory,
        matbakhTags: [stepOneData.matbakhCategory].filter(Boolean),
        website: data.website || '',
        facebookName: data.facebook || '',
        instagramName: data.instagram || '',
        benchmarks: [data.benchmarkOne, data.benchmarkTwo, data.benchmarkThree].filter(Boolean),
        email: data.email || '',
        phoneNumber: '',
        gdprConsent: data.gdprConsent || false,
        marketingConsent: data.marketingConsent || false,
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
        leadId: leadId,
        actionType: 'analysis_started',
        details: { step: 'visibility_check' },
      });

      // Enhanced data preparation with new fields according to blueprint
      const locationParts = stepOneData.location.split(',').map(s => s.trim());
      const city = locationParts[0] || stepOneData.location;
      const country = locationParts[1] || 'Deutschland';
      
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
        // Enhanced fields for better AI analysis
        categoryName: stepOneData.mainCategory,
        competitorUrls: [data.benchmarkOne, data.benchmarkTwo, data.benchmarkThree]
          .filter(Boolean)
          .map(name => `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}`),
        language: 'de', // TODO: Make this dynamic based on user preference
        locationData: {
          city,
          country,
          coordinates: undefined // TODO: Geocoding integration
        },
        socialLinks: {
          facebook: data.facebook ? `https://www.facebook.com/${data.facebook}` : undefined,
          instagram: data.instagram ? `https://www.instagram.com/${data.instagram}` : undefined,
          linkedin: data.linkedin ? `https://www.linkedin.com/company/${data.linkedin}` : undefined,
          website: data.website
        }
      };

      console.log('🚀 Starting enhanced visibility check with data:', completeFormData);
      
      const { data: result, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: completeFormData
      });

      if (error) {
        console.error('❌ Analysis error:', error);
        await trackLeadAction({
          leadId: leadId,
          actionType: 'analysis_failed',
          details: { error: error.message },
        });
        
        // Show user-friendly error and stay on current step
        setLoading(false);
        // TODO: Add error state handling here
        throw new Error(error.details?.userMessage || 'Die Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.');
      }

      console.log('✅ Enhanced analysis complete:', result);
      
      // Update the lead with analysis results
      await updateLeadAnalysis(leadId, result, 'completed');
      
      // Track successful analysis
      await trackLeadAction({
        leadId: leadId,
        actionType: 'analysis_completed',
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

  // Show analysis results directly without requiring confirmation
  if (analysisResult) {
    return (
      <VisibilityResults
        businessName={stepOneData?.businessName || ''}
        analysisResult={analysisResult}
        onRequestDetailedReport={handleRequestDetailedReport}
        onNewAnalysis={restart}
        reportRequested={reportRequested}
        email={stepTwoData?.email}
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
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-4">Social Media & Website</h3>
          <p className="text-muted-foreground mb-6">
            Diese Seite wird in der nächsten Phase implementiert.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(3)}>
              Weiter zur Analyse
            </Button>
          </div>
        </div>
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
