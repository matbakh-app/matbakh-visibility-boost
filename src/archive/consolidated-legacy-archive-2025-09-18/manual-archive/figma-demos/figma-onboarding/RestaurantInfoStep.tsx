import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  ArrowLeft, 
  UtensilsCrossed,
  Globe,
  Tag,
  Euro,
  Crown,
  Gift,
  BarChart3
} from 'lucide-react';
import { RestaurantFormData, GuestCodeInfo } from '@/types/app';
import { useI18n } from '@/contexts/i18nContext';

interface RestaurantInfoStepProps {
  onNext: (data: RestaurantFormData) => void;
  onBack: () => void;
  skipEmailGate?: boolean;
  guestCodeInfo?: GuestCodeInfo | null;
}

export function RestaurantInfoStep({ 
  onNext, 
  onBack, 
  skipEmailGate = false, 
  guestCodeInfo = null 
}: RestaurantInfoStepProps) {
  const { language } = useI18n();
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantName: '',
    address: '',
    phoneNumber: '',
    website: '',
    mainCategory: '',
    priceRange: '',
    additionalServices: []
  });
  // Address fields (split for international support)
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [addressAddition, setAddressAddition] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');

  const texts = {
    de: {
      headerTitle: "Sichtbarkeitsanalyse starten",
      title: "Restaurant Information",
      back: "Zurück",
      step: "Schritt 1 von 2",
      headline: "Erzählen Sie uns von Ihrem Restaurant",
      subtitle: "Diese Informationen helfen uns, eine präzise Analyse zu erstellen",
      basicInfoTitle: "Grundinformationen",
      nameLabel: "Restaurant Name",
      namePlaceholder: "z.B. Ristorante Milano",
      addressLabel: "Adresse",
      addressPlaceholder: "Straße, PLZ Stadt",
      phoneLabel: "Telefon",
      phonePlaceholder: "+49 30 12345678",
      websiteLabel: "Website",
      websitePlaceholder: "www.restaurant.de",
      categoryPricingTitle: "Kategorie & Preisklasse",
      categoryLabel: "Hauptkategorie",
      categoryPlaceholder: "Wählen Sie eine Kategorie",
      priceLabel: "Preisklasse",
      pricePlaceholder: "Wählen Sie eine Preisklasse",
      servicesTitle: "Zusätzliche Services (optional)",
      backButton: "Zurück zur Startseite",
      nextButton: "Weiter",
      // Categories
      categoryItalian: "Italienisch",
      categoryGerman: "Deutsch", 
      categoryAsian: "Asiatisch",
      categoryFrench: "Französisch",
      categoryGreek: "Griechisch",
      categoryTurkish: "Türkisch",
      categoryPizza: "Pizza",
      categoryBurger: "Burger", 
      categorySushi: "Sushi",
      categoryCafe: "Café/Bistro",
      categoryFastfood: "Fast Food",
      categoryFinedining: "Fine Dining",
      categoryVegetarian: "Vegetarisch/Vegan",
      categoryOther: "Sonstiges",
      // Price ranges
      priceBudget: "€ - Günstig (bis 15€)",
      priceModerate: "€€ - Mittel (15-30€)",
      priceUpscale: "€€€ - Gehoben (30-50€)",
      priceLuxury: "€€€€ - Luxus (50€+)",
      // Services
      serviceDelivery: "Lieferservice",
      serviceCatering: "Catering",
      serviceTakeaway: "Take Away",
      serviceBreakfast: "Frühstück",
      serviceLunch: "Mittagstisch",
      serviceBar: "Bar/Cocktails",
      serviceTerrace: "Terrasse/Garten",
      serviceFamily: "Familienfreundlich",
      serviceBusiness: "Business Lunch",
      serviceEvents: "Events/Feiern"
    },
    en: {
      headerTitle: "Start Visibility Check",
      title: "Restaurant Information",
      back: "Back",
      step: "Step 1 of 2",
      headline: "Tell us about your restaurant",
      subtitle: "This information helps us create a precise analysis",
      basicInfoTitle: "Basic Information",
      nameLabel: "Restaurant Name",
      namePlaceholder: "e.g. Ristorante Milano",
      addressLabel: "Address",
      addressPlaceholder: "Street, ZIP City",
      phoneLabel: "Phone",
      phonePlaceholder: "+1 555 123-4567",
      websiteLabel: "Website",
      websitePlaceholder: "www.restaurant.com",
      categoryPricingTitle: "Category & Price Range",
      categoryLabel: "Main Category",
      categoryPlaceholder: "Select a category",
      priceLabel: "Price Range", 
      pricePlaceholder: "Select a price range",
      servicesTitle: "Additional Services (optional)",
      backButton: "Back to Homepage",
      nextButton: "Continue",
      // Categories
      categoryItalian: "Italian",
      categoryGerman: "German",
      categoryAsian: "Asian", 
      categoryFrench: "French",
      categoryGreek: "Greek",
      categoryTurkish: "Turkish",
      categoryPizza: "Pizza",
      categoryBurger: "Burger",
      categorySushi: "Sushi",
      categoryCafe: "Café/Bistro", 
      categoryFastfood: "Fast Food",
      categoryFinedining: "Fine Dining",
      categoryVegetarian: "Vegetarian/Vegan",
      categoryOther: "Other",
      // Price ranges
      priceBudget: "$ - Budget (up to $20)",
      priceModerate: "$$ - Moderate ($20-40)",
      priceUpscale: "$$$ - Upscale ($40-70)",
      priceLuxury: "$$$$ - Luxury ($70+)",
      // Services
      serviceDelivery: "Delivery",
      serviceCatering: "Catering",
      serviceTakeaway: "Take Away",
      serviceBreakfast: "Breakfast",
      serviceLunch: "Lunch Menu",
      serviceBar: "Bar/Cocktails",
      serviceTerrace: "Terrace/Garden",
      serviceFamily: "Family-Friendly",
      serviceBusiness: "Business Lunch",
      serviceEvents: "Events/Celebrations"
    }
  };

  const currentTexts = texts[language];
  const addressTexts = language === 'de' ? {
    section: 'Adresse',
    street: 'Straße',
    houseNumber: 'Hausnr.',
    addition: 'Zusatz (optional)',
    postalCode: 'PLZ',
    city: 'Stadt',
    country: 'Land',
    streetPh: 'z. B. Lindwurmstraße',
    houseNumberPh: 'z. B. 32',
    additionPh: 'z. B. Hinterhaus, 2. OG',
    postalCodePh: 'z. B. 80337',
    cityPh: 'z. B. München',
    countryPh: 'Deutschland'
  } : {
    section: 'Address',
    street: 'Street',
    houseNumber: 'No.',
    addition: 'Addition (optional)',
    postalCode: 'ZIP/Postal code',
    city: 'City',
    country: 'Country',
    streetPh: 'e.g. Market Street',
    houseNumberPh: 'e.g. 123',
    additionPh: 'e.g. Apt 2B',
    postalCodePh: 'e.g. 10115',
    cityPh: 'e.g. Berlin',
    countryPh: 'Germany'
  };

  const handleInputChange = (field: keyof RestaurantFormData, value: string | string[]) => {
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
           street.trim() &&
           houseNumber.trim() &&
           postalCode.trim() &&
           city.trim() &&
           country.trim() &&
           formData.mainCategory &&
           formData.priceRange;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    const additionPart = addressAddition ? ` ${addressAddition}` : '';
    const addressCombined = `${street} ${houseNumber}${additionPart}, ${postalCode} ${city}, ${country}`.trim();
    onNext({ ...formData, address: addressCombined });
  };

  // Categories for restaurant selection
  const categories = [
    { value: 'italian', label: currentTexts.categoryItalian },
    { value: 'german', label: currentTexts.categoryGerman },
    { value: 'asian', label: currentTexts.categoryAsian },
    { value: 'french', label: currentTexts.categoryFrench },
    { value: 'greek', label: currentTexts.categoryGreek },
    { value: 'turkish', label: currentTexts.categoryTurkish },
    { value: 'pizza', label: currentTexts.categoryPizza },
    { value: 'burger', label: currentTexts.categoryBurger },
    { value: 'sushi', label: currentTexts.categorySushi },
    { value: 'cafe', label: currentTexts.categoryCafe },
    { value: 'fastfood', label: currentTexts.categoryFastfood },
    { value: 'finedining', label: currentTexts.categoryFinedining },
    { value: 'vegetarian', label: currentTexts.categoryVegetarian },
    { value: 'other', label: currentTexts.categoryOther }
  ];

  // Price ranges
  const priceRanges = [
    { value: 'budget', label: currentTexts.priceBudget },
    { value: 'moderate', label: currentTexts.priceModerate },
    { value: 'upscale', label: currentTexts.priceUpscale },
    { value: 'luxury', label: currentTexts.priceLuxury }
  ];

  // Additional services
  const services = [
    { value: 'delivery', label: currentTexts.serviceDelivery },
    { value: 'catering', label: currentTexts.serviceCatering },
    { value: 'takeaway', label: currentTexts.serviceTakeaway },
    { value: 'breakfast', label: currentTexts.serviceBreakfast },
    { value: 'lunch', label: currentTexts.serviceLunch },
    { value: 'bar', label: currentTexts.serviceBar },
    { value: 'terrace', label: currentTexts.serviceTerrace },
    { value: 'family', label: currentTexts.serviceFamily },
    { value: 'business', label: currentTexts.serviceBusiness },
    { value: 'events', label: currentTexts.serviceEvents }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header with Language & Theme Switch */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="btn-hover-enhanced">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentTexts.back}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">{currentTexts.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {guestCodeInfo && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Gift className="w-3 h-3 mr-1" />
                  Premium-Code aktiv
                </Badge>
              )}
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Guest Code Info */}
        {guestCodeInfo && (
          <Card className="p-6 mb-8 border-success/20 bg-success/5 card-dark-enhanced">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-success" />
                <div>
                  <h3 className="font-semibold text-success">Premium-Analyse aktiviert</h3>
                  <p className="text-sm text-success/80">
                    Empfohlen von {guestCodeInfo.referrerName}
                  </p>
                </div>
              </div>
              <div className="text-success">
                <Gift className="w-6 h-6" />
              </div>
            </div>
          </Card>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{currentTexts.headline}</h2>
            <div className="text-sm text-muted-foreground">
              {currentTexts.step}
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            {currentTexts.subtitle}
          </p>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300 w-1/2" />
          </div>
        </div>

        {/* Restaurant Information Form */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card className="p-6 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{currentTexts.basicInfoTitle}</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">{currentTexts.nameLabel} *</Label>
                  <Input
                    id="restaurantName"
                    placeholder={currentTexts.namePlaceholder}
                    value={formData.restaurantName}
                    onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                    className="input-dark-enhanced"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{addressTexts.section} *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-4">
                      <Input
                        id="street"
                        placeholder={addressTexts.streetPh}
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="input-dark-enhanced"
                        required
                      />
                      <div className="text-xs text-muted-foreground mt-1">{addressTexts.street}</div>
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        id="houseNumber"
                        placeholder={addressTexts.houseNumberPh}
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="input-dark-enhanced"
                        required
                      />
                      <div className="text-xs text-muted-foreground mt-1">{addressTexts.houseNumber}</div>
                    </div>
                    <div className="md:col-span-6">
                      <Input
                        id="addressAddition"
                        placeholder={addressTexts.additionPh}
                        value={addressAddition}
                        onChange={(e) => setAddressAddition(e.target.value)}
                        className="input-dark-enhanced"
                      />
                      <div className="text-xs text-muted-foreground mt-1">{addressTexts.addition}</div>
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        id="postalCode"
                        placeholder={addressTexts.postalCodePh}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="input-dark-enhanced"
                        required
                      />
                      <div className="text-xs text-muted-foreground mt-1">{addressTexts.postalCode}</div>
                    </div>
                    <div className="md:col-span-4">
                      <Input
                        id="city"
                        placeholder={addressTexts.cityPh}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input-dark-enhanced"
                        required
                      />
                      <div className="text-xs text-muted-foreground mt-1">{addressTexts.city}</div>
                    </div>
                    <div className="md:col-span-6">
                      <Input
                        id="country"
                        placeholder={addressTexts.countryPh}
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="input-dark-enhanced"
                        required
                      />
                      <div className="text-xs text-muted-foreground mt-1">{addressTexts.country}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{currentTexts.websiteLabel}</Label>
                  <div className="relative">
                    <Input
                      id="website"
                      placeholder={currentTexts.websitePlaceholder}
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="pl-10 input-dark-enhanced"
                    />
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Category & Pricing Card */}
          <Card className="p-6 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold">{currentTexts.categoryPricingTitle}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{currentTexts.categoryLabel} *</Label>
                <Select value={formData.mainCategory} onValueChange={(value) => handleInputChange('mainCategory', value)}>
                  <SelectTrigger className="input-dark-enhanced">
                    <SelectValue placeholder={currentTexts.categoryPlaceholder} />
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
                <Label>{currentTexts.priceLabel} *</Label>
                <Select value={formData.priceRange} onValueChange={(value) => handleInputChange('priceRange', value)}>
                  <SelectTrigger className="input-dark-enhanced">
                    <SelectValue placeholder={currentTexts.pricePlaceholder} />
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
          </Card>

          {/* Additional Services Card */}
          <Card className="p-6 card-dark-enhanced">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold">{currentTexts.servicesTitle}</h3>
            </div>

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
          </Card>

          {/* Submit Button */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2 btn-hover-enhanced"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentTexts.backButton}
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid()}
              size="lg"
              className="min-w-32 bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
            >
              {currentTexts.nextButton}
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}