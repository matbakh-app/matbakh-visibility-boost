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
      setError(t('passwordMismatch'));
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
        setError('Ein Unternehmen mit diesem Namen ist bereits registriert');
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
        alert('Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail und melden Sie sich dann an.');
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
        <Label htmlFor="email">Geschäftliche E-Mail</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="ihr.name@unternehmen.de"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
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
        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
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
        <Label htmlFor="companyName">Firmenname</Label>
        <Input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="Ihr Unternehmen GmbH"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contactPerson">Ansprechpartner</Label>
        <Input
          id="contactPerson"
          type="text"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          placeholder="Max Mustermann"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessCategory">Branche</Label>
        <Select value={formData.businessCategory} onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Wählen Sie Ihre Branche" />
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
        {loading ? 'Registrierung läuft...' : 'Unternehmen registrieren'}
      </Button>
    </form>
  );
};

export default EmailRegisterForm;