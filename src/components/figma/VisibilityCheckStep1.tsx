import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Building, MapPin, Phone, Globe, Tag, Euro } from 'lucide-react';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  restaurantName: string;
  address: string;
  phoneNumber: string;
  website: string;
  mainCategory: string;
  priceRange: string;
  additionalServices: string[];
}

export const VisibilityCheckStep1: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setVCData, getVCData } = useUserJourney();
  
  // Prefill from existing VC data
  const existingData = getVCData();
  
  const [formData, setFormData] = useState<FormData>({
    restaurantName: existingData?.businessName || '',
    address: existingData?.location || '',
    phoneNumber: '',
    website: existingData?.website || '',
    mainCategory: existingData?.mainCategory || '',
    priceRange: existingData?.subCategory || '',
    additionalServices: []
  });

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(service)
        ? prev.additionalServices.filter(s => s !== service)
        : [...prev.additionalServices, service]
    }));
  };

  const isFormValid = () => {
    return formData.restaurantName.trim() && 
           formData.address.trim() && 
           formData.mainCategory && 
           formData.priceRange;
  };

  const handleNext = () => {
    if (!isFormValid()) return;
    
    // Store data in UserJourneyManager
    setVCData({
      businessName: formData.restaurantName,
      location: formData.address,
      mainCategory: formData.mainCategory,
      subCategory: formData.priceRange,
      website: formData.website,
    });
    
    navigate('/visibilitycheck/onboarding/step2');
  };

  const handleBack = () => {
    navigate('/');
  };

  const categories = [
    { value: 'italian', label: 'Italienisch' },
    { value: 'german', label: 'Deutsch' },
    { value: 'asian', label: 'Asiatisch' },
    { value: 'french', label: 'Französisch' },
    { value: 'greek', label: 'Griechisch' },
    { value: 'turkish', label: 'Türkisch' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'cafe', label: 'Café/Bistro' },
    { value: 'fastfood', label: 'Fast Food' },
    { value: 'finedining', label: 'Fine Dining' },
    { value: 'vegetarian', label: 'Vegetarisch/Vegan' },
    { value: 'other', label: 'Sonstiges' }
  ];

  const priceRanges = [
    { value: 'budget', label: '€ - Günstig (bis 15€)' },
    { value: 'moderate', label: '€€ - Mittel (15-30€)' },
    { value: 'upscale', label: '€€€ - Gehoben (30-50€)' },
    { value: 'luxury', label: '€€€€ - Luxus (50€+)' }
  ];

  const services = [
    { value: 'delivery', label: 'Lieferservice' },
    { value: 'catering', label: 'Catering' },
    { value: 'takeaway', label: 'Take Away' },
    { value: 'breakfast', label: 'Frühstück' },
    { value: 'lunch', label: 'Mittagstisch' },
    { value: 'bar', label: 'Bar/Cocktails' },
    { value: 'terrace', label: 'Terrasse/Garten' },
    { value: 'family', label: 'Familienfreundlich' },
    { value: 'business', label: 'Business Lunch' },
    { value: 'events', label: 'Events/Feiern' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <span className="text-sm text-muted-foreground">Schritt 1 von 2</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Restaurant Information</h1>
          <p className="text-muted-foreground mb-4">
            Diese Informationen helfen uns, eine präzise Analyse zu erstellen
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full w-1/2" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                Grundinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name *</Label>
                <Input
                  id="restaurantName"
                  placeholder="z. B. Ristorante Milano"
                  value={formData.restaurantName}
                  onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <div className="relative">
                  <Input
                    id="address"
                    placeholder="Straße, PLZ Stadt"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="pl-10"
                    required
                  />
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefon</Label>
                  <div className="relative">
                    <Input
                      id="phoneNumber"
                      placeholder="+49 30 12345678"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="pl-10"
                    />
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Input
                      id="website"
                      placeholder="www.restaurant.de"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="pl-10"
                    />
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-green-600" />
                </div>
                Kategorie & Preisklasse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hauptkategorie *</Label>
                  <Select value={formData.mainCategory} onValueChange={(value) => handleInputChange('mainCategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie eine Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preisklasse *</Label>
                  <Select value={formData.priceRange} onValueChange={(value) => handleInputChange('priceRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie eine Preisklasse" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-orange-600" />
                </div>
                Zusätzliche Services (optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.value}
                      checked={formData.additionalServices.includes(service.value)}
                      onCheckedChange={() => handleServiceToggle(service.value)}
                    />
                    <Label
                      htmlFor={service.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Zurück zur Startseite
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isFormValid()}
              className="min-w-32"
            >
              Weiter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};