import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePartnerProfile } from '@/hooks/usePartnerProfile';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Building2, Mail, Phone, Globe, Settings, Shield } from 'lucide-react';

export default function DashboardProfile() {
  const { t } = useTranslation(['common', 'dashboard']);
  const { toast } = useToast();
  const { data: profile, isLoading, refetch } = usePartnerProfile();
  const { data: googleConnection } = useGoogleConnection();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    business_name: '',
    address: ''
  });

  React.useEffect(() => {
    if (profile?.partner && profile?.profile) {
      setFormData({
        company_name: profile.partner.company_name || '',
        contact_email: profile.partner.contact_email || '',
        contact_phone: profile.partner.contact_phone || '',
        website: profile.partner.website || '',
        business_name: profile.profile.business_name || '',
        address: profile.profile.address || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.partner) return;
    
    setSaving(true);
    try {
      // Update business partner
      const { error: partnerError } = await supabase
        .from('business_partners')
        .update({
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          website: formData.website
        })
        .eq('id', profile.partner.id);

      if (partnerError) throw partnerError;

      // Update business profile if exists
      if (profile.profile) {
        const { error: profileError } = await supabase
          .from('business_profiles')
          .update({
            business_name: formData.business_name,
            address: formData.address
          })
          .eq('partner_id', profile.partner.id);

        if (profileError) throw profileError;
      }

      toast({
        title: t('common:success'),
        description: t('dashboard:profile.saved')
      });
      
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('common:error'),
        description: t('dashboard:profile.saveFailed'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleReconnect = () => {
    // Redirect to Google OAuth
    window.location.href = '/business/partner/login?action=reconnect';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard:profile.title', 'Mein Profil')}</h1>
          <p className="text-muted-foreground">{t('dashboard:profile.description', 'Verwalten Sie Ihre Konto- und Geschäftsdaten')}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                {t('common:cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('common:save')}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              {t('common:edit')}
            </Button>
          )}
        </div>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('dashboard:profile.account', 'Konto-Informationen')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">{t('dashboard:profile.companyName', 'Firmenname')}</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="contact_email">{t('dashboard:profile.email', 'E-Mail')}</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">{t('dashboard:profile.phone', 'Telefon')}</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="website">{t('dashboard:profile.website', 'Website')}</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('dashboard:profile.business', 'Geschäftsinformationen')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_name">{t('dashboard:profile.businessName', 'Restaurantname')}</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="address">{t('dashboard:profile.address', 'Adresse')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('dashboard:profile.googleConnection', 'Google-Verbindung')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${googleConnection?.isGoogleConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">
                  {googleConnection?.isGoogleConnected 
                    ? t('dashboard:profile.connected', 'Verbunden') 
                    : t('dashboard:profile.notConnected', 'Nicht verbunden')
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {googleConnection?.isGoogleConnected 
                    ? t('dashboard:profile.connectedDesc', 'Ihr Google-Konto ist mit matbakh.app verbunden')
                    : t('dashboard:profile.notConnectedDesc', 'Verbinden Sie Ihr Google-Konto für vollständige Funktionalität')
                  }
                </p>
              </div>
            </div>
            {!googleConnection?.isGoogleConnected && (
              <Button onClick={handleGoogleReconnect} variant="outline">
                {t('dashboard:profile.connect', 'Verbinden')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('dashboard:profile.services', 'Meine Services')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile?.partner?.services_selected?.map((service: string) => (
              <Badge key={service} variant="secondary">
                {service}
              </Badge>
            )) || (
              <p className="text-muted-foreground">
                {t('dashboard:profile.noServices', 'Keine Services ausgewählt')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}