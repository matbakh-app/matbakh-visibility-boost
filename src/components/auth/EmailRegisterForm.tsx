import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions';
import { useToast } from '@/hooks/use-toast';
import AuthErrorDialog from './AuthErrorDialog';
import FeedbackModal from './FeedbackModal';

interface EmailRegisterFormProps {
  onBack: () => void;
}

const EmailRegisterForm: React.FC<EmailRegisterFormProps> = ({ onBack }) => {
  const { t } = useTranslation('auth');
  const { gmbCategories } = useOnboardingQuestions();
  const { toast } = useToast();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactPerson: '',
    businessCategory: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorType, setErrorType] = useState<'emailRateLimit' | 'technicalError' | 'partnerCreationError' | 'general'>('general');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleSupabaseError = (error: any) => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('email rate limit') || message.includes('over_email_send_rate_limit')) {
      setErrorType('emailRateLimit');
      setShowErrorDialog(true);
    } else if (message.includes('already registered') || message.includes('user_already_exists')) {
      setError(t('messages.companyExists'));
    } else {
      setErrorType('technicalError');
      setShowErrorDialog(true);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      contactPerson: '',
      businessCategory: ''
    });
    setError(null);
    setRegistrationStep('');
    setProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setProgress(10);

    if (formData.password !== formData.confirmPassword) {
      setError(t('messages.passwordMismatch'));
      setLoading(false);
      setProgress(0);
      return;
    }

    try {
      // Phase 1: Check company (using maybeSingle instead of single)
      setRegistrationStep(t('form.checkingCompany'));
      setProgress(25);
      
      const { data: existingPartner, error: checkError } = await supabase
        .from('business_partners')
        .select('id')
        .eq('company_name', formData.companyName as any)
        .maybeSingle();

      if (checkError) {
        console.error('Company check error:', checkError);
        handleSupabaseError(checkError);
        return;
      }

      if (existingPartner) {
        setError(t('messages.companyExists'));
        setLoading(false);
        setProgress(0);
        return;
      }

      // Phase 2: Create auth account
      setRegistrationStep(t('form.sendingEmail'));
      setProgress(50);

      const redirectUrl = `${window.location.origin}/partner/onboarding`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            company_name: formData.companyName,
            contact_person: formData.contactPerson,
            business_category: formData.businessCategory
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        handleSupabaseError(signUpError);
        return;
      }

      setProgress(75);

      // Phase 3: Create business partner (only after successful auth)
      if (authData.user) {
        setRegistrationStep(t('form.creatingProfile'));
        setProgress(90);

        // Use setTimeout to avoid deadlock with auth state change
        setTimeout(async () => {
          try {
            const { error: partnerError } = await supabase
              .from('business_partners')
              .insert({
                user_id: authData.user.id,
                company_name: formData.companyName,
                contact_email: formData.email,
                status: 'pending',
                onboarding_completed: false
              } as any);

            if (partnerError) {
              console.error('Partner creation error:', partnerError);
              setErrorType('partnerCreationError');
              setShowErrorDialog(true);
            } else {
              setProgress(100);
              setError(null);
              // Use toast instead of alert for better UX
              toast({
                title: t('messages.registrationSuccessTitle', 'Registrierung erfolgreich!'),
                description: t('messages.registrationSuccess'),
                duration: 5000,
              });
              
              // Show feedback modal after successful registration
              setTimeout(() => {
                setShowFeedbackModal(true);
              }, 1000);
            }
          } catch (partnerErr: any) {
            console.error('Partner creation error:', partnerErr);
            setErrorType('partnerCreationError');
            setShowErrorDialog(true);
          } finally {
            setLoading(false);
            setRegistrationStep('');
            setProgress(0);
          }
        }, 100);
      } else {
        setProgress(100);
        setError(null);
        toast({
          title: t('messages.registrationSuccessTitle', 'Registrierung erfolgreich!'),
          description: t('messages.registrationSuccess'),
          duration: 5000,
        });
        
        // Show feedback modal after successful registration
        setTimeout(() => {
          setShowFeedbackModal(true);
        }, 1000);
        
        setLoading(false);
        setRegistrationStep('');
        setProgress(0);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      handleSupabaseError(err);
      setLoading(false);
      setRegistrationStep('');
      setProgress(0);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress indicator during registration */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{registrationStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">{t('form.businessEmail')}</Label>
          <Input
            id="email"
            ref={emailInputRef}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('form.emailPlaceholder')}
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">{t('form.password')}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={6}
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('form.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            minLength={6}
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companyName">{t('form.companyName')}</Label>
          <Input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder={t('form.companyPlaceholder')}
            disabled={loading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactPerson">{t('form.contactPerson')}</Label>
          <Input
            id="contactPerson"
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder={t('form.contactPlaceholder')}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessCategory">{t('form.businessCategory')}</Label>
          <Select 
            value={formData.businessCategory} 
            onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('form.categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {gmbCategories
                .filter(cat => cat.is_popular)
                .map((category) => (
                  <SelectItem key={category.id} value={category.category_id}>
                    {category.name_de}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading || !formData.businessCategory}
        >
          {loading ? registrationStep || t('form.registerLoading') : t('form.registerButton')}
        </Button>
      </form>

      {/* Error Dialog */}
      <AuthErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        errorType={errorType}
        onRetry={() => {
          setShowErrorDialog(false);
          handleSubmit(new Event('submit') as any);
        }}
        onUseOtherEmail={() => {
          setShowErrorDialog(false);
          setFormData({ ...formData, email: '' });
          // Focus and clear email field
          setTimeout(() => {
            emailInputRef.current?.focus();
          }, 100);
        }}
        onContactSupport={() => {
          setShowErrorDialog(false);
          window.location.href = '/legal/contact';
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
};

export default EmailRegisterForm;