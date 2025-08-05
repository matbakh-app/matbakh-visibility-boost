import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import {
  ProfileLayout,
  ProfileHeader,
  ProfileContent,
  ProfileSection,
  ProfileGrid
} from './ProfileLayout';
import { 
  InputField, 
  TextAreaField, 
  SelectField, 
  MultiSelectField 
} from './ProfileFields';
import { 
  Building, 
  Globe, 
  MapPin, 
  Phone, 
  Mail,
  Upload,
  Check,
  Star,
  Users,
  Clock,
  TrendingUp,
  Save
} from 'lucide-react';

interface CompanyProfileData {
  company_name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  categories: string[];
}

export const CompanyProfile: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, save } = useCompanyProfile();
  const [formData, setFormData] = useState<CompanyProfileData>({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    categories: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        company_name: data.company_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        website: data.website || '',
        description: data.description || '',
        categories: data.categories || []
      });
    }
  }, [data]);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBanner message="Unternehmensprofil konnte nicht geladen werden" />;

  const handleSave = async () => {
    setIsSaving(true);
    const success = await save(formData);
    if (success) {
      console.log('Company profile saved successfully');
      // Could navigate to dashboard or show success message
    }
    setIsSaving(false);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page in history
  };

  const updateFormData = (field: keyof CompanyProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Options for various selects
  const categoryOptions = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Café' },
    { value: 'bar', label: 'Bar' },
    { value: 'bistro', label: 'Bistro' },
    { value: 'pizzeria', label: 'Pizzeria' },
    { value: 'fastfood', label: 'Fast Food' },
    { value: 'finedining', label: 'Fine Dining' }
  ];

  const cuisineOptions = [
    { value: 'italienisch', label: 'Italienisch' },
    { value: 'deutsch', label: 'Deutsch' },
    { value: 'international', label: 'International' },
    { value: 'vegetarisch', label: 'Vegetarisch' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'asiatisch', label: 'Asiatisch' },
    { value: 'mediterran', label: 'Mediterran' }
  ];

  return (
    <ProfileLayout>
      <ProfileHeader
        title="Firmenprofil"
        subtitle="Verwalten Sie Ihre Unternehmensinformationen"
        onBack={handleBack}
        actions={
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            In Bearbeitung
          </Badge>
        }
      />

      <ProfileContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Basic Info */}
            <Card className="p-6">
              <ProfileSection
                title="Grundinformationen"
                description="Basis-Unternehmensdaten für Ihr Profil"
              >
                <ProfileGrid columns={2}>
                  <InputField
                    label="Firmenname"
                    value={formData.company_name}
                    onChange={(value) => updateFormData('company_name', value)}
                    placeholder="z.B. Bella Vista Restaurant"
                    required
                  />
                  <InputField
                    label="Telefon"
                    value={formData.phone}
                    onChange={(value) => updateFormData('phone', value)}
                    placeholder="+49 89 12345678"
                    type="tel"
                  />
                </ProfileGrid>

                <InputField
                  label="Adresse"
                  value={formData.address}
                  onChange={(value) => updateFormData('address', value)}
                  placeholder="Musterstraße 123, 80331 München"
                />

                <ProfileGrid columns={2}>
                  <InputField
                    label="E-Mail"
                    value={formData.email}
                    onChange={(value) => updateFormData('email', value)}
                    placeholder="info@bellavista.de"
                    type="email"
                  />
                  <InputField
                    label="Website"
                    value={formData.website}
                    onChange={(value) => updateFormData('website', value)}
                    placeholder="https://www.bellavista.de"
                    type="url"
                  />
                </ProfileGrid>

                <TextAreaField
                  label="Beschreibung"
                  value={formData.description}
                  onChange={(value) => updateFormData('description', value)}
                  placeholder="Beschreiben Sie Ihr Restaurant..."
                  rows={4}
                  description="Eine kurze Beschreibung Ihres Unternehmens für Kunden"
                />
              </ProfileSection>
            </Card>

            {/* Categories & Specialization */}
            <Card className="p-6">
              <ProfileSection
                title="Kategorien & Spezialisierung"
                description="Definieren Sie Ihr Angebot und Ihre Küche"
              >
                <SelectField
                  label="Hauptkategorie"
                  value={formData.categories[0] || ''}
                  onChange={(value) => updateFormData('categories', [value, ...formData.categories.slice(1)])}
                  options={categoryOptions}
                  placeholder="Wählen Sie eine Kategorie"
                />

                <MultiSelectField
                  label="Küchenstil"
                  value={formData.categories.slice(1)}
                  onChange={(values) => updateFormData('categories', [formData.categories[0], ...values])}
                  options={cuisineOptions}
                  placeholder="Wählen Sie Küchenstile"
                  maxItems={5}
                  description="Bis zu 5 Küchenstile auswählen"
                />
              </ProfileSection>
            </Card>

            {/* Action Buttons for larger screens */}
            <div className="flex justify-between lg:hidden">
              <Button variant="outline" onClick={handleBack}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !formData.company_name}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card className="p-6">
              <ProfileSection title="Logo">
                <div className="text-center space-y-4">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {formData.company_name ? formData.company_name.charAt(0) : 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Logo hochladen
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG oder SVG. Max. 2MB
                  </p>
                </div>
              </ProfileSection>
            </Card>

            {/* Profile Status */}
            <Card className="p-6">
              <ProfileSection title="Profil-Status">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grunddaten</span>
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Google Business</span>
                    <span className="text-sm text-muted-foreground">Ausstehend</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Social Media</span>
                    <span className="text-sm text-muted-foreground">Nicht verknüpft</span>
                  </div>
                </div>
              </ProfileSection>
            </Card>

            {/* Action Buttons for desktop */}
            <div className="hidden lg:block space-y-3">
              <Button 
                onClick={handleSave}
                disabled={isSaving || !formData.company_name}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Firmenprofil speichern
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="w-full"
              >
                Zurück zu Mein Profil
              </Button>
            </div>

            {/* Next Steps */}
            <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Nächste Schritte</h3>
                  <p className="text-sm text-muted-foreground">
                    Google Business & Social Media verknüpfen
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled
                >
                  Bald verfügbar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </ProfileContent>
    </ProfileLayout>
  );
};