import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
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
  ArrowLeft,
  ChevronRight,
  TrendingUp
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zu Mein Profil
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Firmenprofil</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                In Bearbeitung
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Grundinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Firmenname *</Label>
                    <Input
                      id="company-name"
                      placeholder="z.B. Bella Vista Restaurant"
                      value={formData.company_name}
                      onChange={(e) => updateFormData('company_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      placeholder="+49 89 12345678"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Musterstraße 123, 80331 München"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@bellavista.de"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://www.bellavista.de"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    placeholder="Beschreiben Sie Ihr Restaurant..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Kategorien & Spezialisierung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hauptkategorie</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie eine Kategorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="cafe">Café</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="bistro">Bistro</SelectItem>
                        <SelectItem value="pizzeria">Pizzeria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Küchenstil</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Italienisch', 'Deutsch', 'International', 'Vegetarisch', 'Vegan'].map((tag) => (
                        <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-primary/10">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-24 h-24 mb-4">
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {formData.company_name ? formData.company_name.charAt(0) : 'B'}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Logo hochladen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profil-Status</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Save Button */}
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
                  <Check className="w-4 h-4 mr-2" />
                  Firmenprofil speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};