import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions';

interface EmailRegisterFormProps {
  onBack: () => void;
}

const EmailRegisterForm: React.FC<EmailRegisterFormProps> = ({ onBack }) => {
  const { t } = useTranslation('auth');
  const { gmbCategories } = useOnboardingQuestions();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError(t('messages.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      // Check if company already exists
      const { data: existingPartner } = await supabase
        .from('business_partners')
        .select('id')
        .eq('company_name', formData.companyName)
        .single();

      if (existingPartner) {
        setError(t('messages.companyExists'));
        setLoading(false);
        return;
      }

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
        setError(signUpError.message);
      } else if (authData.user) {
        // Create business partner record immediately
        const { error: partnerError } = await supabase
          .from('business_partners')
          .insert({
            user_id: authData.user.id,
            company_name: formData.companyName,
            contact_email: formData.email,
            status: 'pending',
            onboarding_completed: false
          });

        if (partnerError) {
          console.error('Partner creation error:', partnerError);
          // Don't block user registration for this
        }

        setError(null);
        alert(t('messages.registrationSuccess'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('form.businessEmail')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder={t('form.emailPlaceholder')}
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
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessCategory">{t('form.businessCategory')}</Label>
        <Select value={formData.businessCategory} onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}>
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
        {loading ? t('form.registerLoading') : t('form.registerButton')}
      </Button>
    </form>
  );
};

export default EmailRegisterForm;