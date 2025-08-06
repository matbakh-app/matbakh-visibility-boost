import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Building, 
  MapPin, 
  Globe, 
  Hash, 
  FileText, 
  Camera, 
  Plus, 
  X, 
  Save, 
  ArrowLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Instagram,
  Target
} from 'lucide-react';
import { useI18n } from '../contexts/i18nContext';

interface CompanyProfileProps {
  onSave: (data: CompanyProfileData) => void;
  onBack: () => void;
  initialData?: Partial<CompanyProfileData>;
}

interface CompanyProfileData {
  companyName: string;
  logo: string;
  address: {
    street: string;
    zipCode: string;
    city: string;
  };
  taxId: string;
  vatNumber: string;
  legalForm: string;
  website: string;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
  };
  competitors: string[];
}

export function CompanyProfile({ onSave, onBack, initialData }: CompanyProfileProps) {
  const { language } = useI18n();

  // Initialize form data with defaults or from props
  const [formData, setFormData] = useState<CompanyProfileData>({
    companyName: initialData?.companyName || "Bella Vista Restaurant",
    logo: initialData?.logo || "",
    address: {
      street: initialData?.address?.street || "Marienplatz 1",
      zipCode: initialData?.address?.zipCode || "80331",
      city: initialData?.address?.city || "München"
    },
    taxId: initialData?.taxId || "DE123456789",
    vatNumber: initialData?.vatNumber || "DE987654321",
    legalForm: initialData?.legalForm || "GmbH",
    website: initialData?.website || "https://bellavista-restaurant.de",
    socialMedia: {
      twitter: initialData?.socialMedia?.twitter || "@bellavista_muc",
      facebook: initialData?.socialMedia?.facebook || "bellavista.muenchen",
      instagram: initialData?.socialMedia?.instagram || "bellavista_restaurant"
    },
    competitors: initialData?.competitors || ["Italiener am Dom", "Villa Blanca", "Osteria München"]
  });

  const [newCompetitor, setNewCompetitor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const texts = {
    de: {
      headerTitle: "Firmenprofil",
      backToProfile: "Zurück zu Mein Profil",
      breadcrumb: "Mein Profil > Firmenprofil",
      
      // Logo & Name Section
      logoNameTitle: "Logo & Firmenname",
      companyLogoLabel: "Firmen-Logo",
      uploadLogo: "Logo hochladen",
      companyNameLabel: "Firmenname",
      companyNamePlaceholder: "Ihr Restaurantname",
      
      // Company Details Section
      detailsTitle: "Firmendetails",
      addressTitle: "Adresse",
      streetLabel: "Straße & Hausnummer",
      streetPlaceholder: "Marienplatz 1",
      zipCodeLabel: "PLZ",
      zipCodePlaceholder: "80331",
      cityLabel: "Stadt",
      cityPlaceholder: "München",
      
      legalInfoTitle: "Rechtliche Informationen",
      taxIdLabel: "Steuernummer",
      taxIdPlaceholder: "DE123456789",
      vatNumberLabel: "USt-IdNr.",
      vatNumberPlaceholder: "DE987654321",
      legalFormLabel: "Rechtsform",
      legalFormPlaceholder: "GmbH, UG, etc.",
      
      onlinePresenceTitle: "Online-Präsenz",
      websiteLabel: "Website",
      websitePlaceholder: "https://ihr-restaurant.de",
      socialMediaTitle: "Social Media",
      twitterLabel: "Twitter/X Handle",
      twitterPlaceholder: "@ihr_restaurant",
      facebookLabel: "Facebook Page",
      facebookPlaceholder: "ihr.restaurant",
      instagramLabel: "Instagram Handle", 
      instagramPlaceholder: "@ihr_restaurant",
      
      // Competitive Landscape Section
      competitorsTitle: "Wettbewerbslandschaft",
      competitorsDesc: "Konkurrenten aus der VC-Analyse hinzufügen oder entfernen",
      competitorFromVCLabel: "Aus VC-Analyse importiert",
      addCompetitorLabel: "Neuen Konkurrenten hinzufügen",
      addCompetitorPlaceholder: "Name des Konkurrenten",
      addCompetitorButton: "Hinzufügen",
      removeCompetitor: "Entfernen",
      manageCompetitors: "Konkurrenten verwalten",
      
      // Actions
      saveProfile: "Firmenprofil speichern",
      saving: "Wird gespeichert...",
      backToMyProfile: "Zurück zu Mein Profil",
      
      // Status
      unsavedChanges: "Ungespeicherte Änderungen",
      profileSaved: "Profil gespeichert"
    },
    en: {
      headerTitle: "Company Profile",
      backToProfile: "Back to My Profile", 
      breadcrumb: "My Profile > Company Profile",
      
      // Logo & Name Section
      logoNameTitle: "Logo & Company Name",
      companyLogoLabel: "Company Logo",
      uploadLogo: "Upload Logo",
      companyNameLabel: "Company Name",
      companyNamePlaceholder: "Your Restaurant Name",
      
      // Company Details Section
      detailsTitle: "Company Details",
      addressTitle: "Address",
      streetLabel: "Street & Number",
      streetPlaceholder: "123 Main Street",
      zipCodeLabel: "ZIP Code",
      zipCodePlaceholder: "12345",
      cityLabel: "City",
      cityPlaceholder: "New York",
      
      legalInfoTitle: "Legal Information",
      taxIdLabel: "Tax ID",
      taxIdPlaceholder: "123-45-6789",
      vatNumberLabel: "VAT Number",
      vatNumberPlaceholder: "US123456789",
      legalFormLabel: "Legal Form",
      legalFormPlaceholder: "LLC, Inc, etc.",
      
      onlinePresenceTitle: "Online Presence",
      websiteLabel: "Website",
      websitePlaceholder: "https://your-restaurant.com",
      socialMediaTitle: "Social Media",
      twitterLabel: "Twitter/X Handle",
      twitterPlaceholder: "@your_restaurant",
      facebookLabel: "Facebook Page",
      facebookPlaceholder: "your.restaurant",
      instagramLabel: "Instagram Handle",
      instagramPlaceholder: "@your_restaurant",
      
      // Competitive Landscape Section
      competitorsTitle: "Competitive Landscape",
      competitorsDesc: "Add or remove competitors from VC analysis",
      competitorFromVCLabel: "Imported from VC Analysis",
      addCompetitorLabel: "Add New Competitor",
      addCompetitorPlaceholder: "Competitor name",
      addCompetitorButton: "Add",
      removeCompetitor: "Remove",
      manageCompetitors: "Manage Competitors",
      
      // Actions
      saveProfile: "Save Company Profile",
      saving: "Saving...",
      backToMyProfile: "Back to My Profile",
      
      // Status
      unsavedChanges: "Unsaved changes",
      profileSaved: "Profile saved"
    }
  };

  const t = texts[language];

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanyProfileData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !formData.competitors.includes(newCompetitor.trim())) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }));
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="btn-hover-enhanced">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToProfile}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">{t.headerTitle}</h1>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground hidden sm:block">
              {t.breadcrumb}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Logo & Company Name */}
          <Card className="p-8 card-dark-enhanced">
            <h2 className="text-xl font-semibold mb-6">{t.logoNameTitle}</h2>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Logo Upload */}
              <div className="flex flex-col items-center">
                <Avatar className="w-40 h-40 mb-4 rounded-2xl">
                  <AvatarImage src={formData.logo} alt={formData.companyName} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary rounded-2xl">
                    {formData.companyName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="btn-hover-enhanced">
                  <Camera className="w-4 h-4 mr-2" />
                  {t.uploadLogo}
                </Button>
              </div>

              {/* Company Name */}
              <div className="flex-1 w-full">
                <Label htmlFor="company-name" className="text-base font-medium mb-2 block">
                  {t.companyNameLabel} *
                </Label>
                <Input
                  id="company-name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder={t.companyNamePlaceholder}
                  className="text-lg input-dark-enhanced"
                />
              </div>
            </div>
          </Card>

          {/* Company Details */}
          <Card className="p-8 card-dark-enhanced">
            <h2 className="text-xl font-semibold mb-6">{t.detailsTitle}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {t.addressTitle}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">{t.streetLabel}</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder={t.streetPlaceholder}
                      className="input-dark-enhanced"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">{t.zipCodeLabel}</Label>
                      <Input
                        id="zip"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        placeholder={t.zipCodePlaceholder}
                        className="input-dark-enhanced"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">{t.cityLabel}</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder={t.cityPlaceholder}
                        className="input-dark-enhanced"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {t.legalInfoTitle}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tax-id">{t.taxIdLabel}</Label>
                    <Input
                      id="tax-id"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder={t.taxIdPlaceholder}
                      className="input-dark-enhanced"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="vat-number">{t.vatNumberLabel}</Label>
                    <Input
                      id="vat-number"
                      value={formData.vatNumber}
                      onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                      placeholder={t.vatNumberPlaceholder}
                      className="input-dark-enhanced"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="legal-form">{t.legalFormLabel}</Label>
                    <Input
                      id="legal-form"
                      value={formData.legalForm}
                      onChange={(e) => handleInputChange('legalForm', e.target.value)}
                      placeholder={t.legalFormPlaceholder}
                      className="input-dark-enhanced"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Online Presence Section */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {t.onlinePresenceTitle}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="website">{t.websiteLabel}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder={t.websitePlaceholder}
                    className="input-dark-enhanced"
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">{t.socialMediaTitle}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-blue-500" />
                      <Input
                        value={formData.socialMedia.twitter}
                        onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                        placeholder={t.twitterPlaceholder}
                        className="input-dark-enhanced"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <Input
                        value={formData.socialMedia.facebook}
                        onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                        placeholder={t.facebookPlaceholder}
                        className="input-dark-enhanced"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <Input
                        value={formData.socialMedia.instagram}
                        onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                        placeholder={t.instagramPlaceholder}
                        className="input-dark-enhanced"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Competitive Landscape */}
          <Card className="p-8 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t.competitorsTitle}</h2>
                <p className="text-muted-foreground text-sm">{t.competitorsDesc}</p>
              </div>
            </div>
            
            {/* Current Competitors */}
            <div className="space-y-4 mb-6">
              {formData.competitors.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {t.competitorFromVCLabel}
                    </Badge>
                    <span className="font-medium">{competitor}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCompetitor(competitor)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Competitor */}
            <div className="flex gap-2">
              <Input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder={t.addCompetitorPlaceholder}
                className="input-dark-enhanced"
                onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
              />
              <Button 
                onClick={addCompetitor}
                disabled={!newCompetitor.trim()}
                className="btn-hover-enhanced"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.addCompetitorButton}
              </Button>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2 btn-hover-enhanced"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToMyProfile}
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="min-w-48 bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t.saveProfile}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}