import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { LanguageSwitch } from './LanguageSwitch';
import { 
  ArrowLeft, 
  UtensilsCrossed,
  MapPin,
  Phone,
  Globe,
  Tag,
  Euro,
  Crown,
  Gift,
  BarChart3,
  Home
} from 'lucide-react';
import { RestaurantFormData, GuestCodeInfo } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

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

  // Real text values based on language - CORRECTED: Direct text values instead of i18n keys
  const texts = {
    de: {
      headerTitle: "Visibility Check",
      title: "Restaurant Information",
      breadcrumbHome: "Home",
      breadcrumbCurrent: "Restaurant Information",
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
      backButton: "Zurück zur VC-Startseite",
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
      headerTitle: "Visibility Check",
      title: "Restaurant Information",
      breadcrumbHome: "Home", 
      breadcrumbCurrent: "Restaurant Information",
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
      backButton: "Back to VC Homepage",
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

  const t = texts[language];

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
           formData.address.trim() && 
           formData.mainCategory && 
           formData.priceRange;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onNext(formData);
  };

  // Categories for restaurant selection
  const categories = [
    { value: 'italian', label: t.categoryItalian },
    { value: 'german', label: t.categoryGerman },
    { value: 'asian', label: t.categoryAsian },
    { value: 'french', label: t.categoryFrench },
    { value: 'greek', label: t.categoryGreek },
    { value: 'turkish', label: t.categoryTurkish },
    { value: 'pizza', label: t.categoryPizza },
    { value: 'burger', label: t.categoryBurger },
    { value: 'sushi', label: t.categorySushi },
    { value: 'cafe', label: t.categoryCafe },
    { value: 'fastfood', label: t.categoryFastfood },
    { value: 'finedining', label: t.categoryFinedining },
    { value: 'vegetarian', label: t.categoryVegetarian },
    { value: 'other', label: t.categoryOther }
  ];

  // Price ranges
  const priceRanges = [
    { value: 'budget', label: t.priceBudget },
    { value: 'moderate', label: t.priceModerate },
    { value: 'upscale', label: t.priceUpscale },
    { value: 'luxury', label: t.priceLuxury }
  ];

  // Additional services
  const services = [
    { value: 'delivery', label: t.serviceDelivery },
    { value: 'catering', label: t.serviceCatering },
    { value: 'takeaway', label: t.serviceTakeaway },
    { value: 'breakfast', label: t.serviceBreakfast },
    { value: 'lunch', label: t.serviceLunch },
    { value: 'bar', label: t.serviceBar },
    { value: 'terrace', label: t.serviceTerrace },
    { value: 'family', label: t.serviceFamily },
    { value: 'business', label: t.serviceBusiness },
    { value: 'events', label: t.serviceEvents }
  ];

  // Navigation handler - CORRECTED: Always go to /vc
  const handleBackToVCLanding = () => {
    // In a real router implementation, we'd use router.push('/vc')
    window.location.href = '/vc';
  };

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: t.breadcrumbHome,
      icon: <Home className="w-4 h-4" />,
      onClick: handleBackToVCLanding
    },
    {
      label: t.breadcrumbCurrent,
      isActive: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header with Language Switch - uses global LanguageSwitch */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackToVCLanding}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.back}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">{t.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {guestCodeInfo && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Gift className="w-3 h-3 mr-1" />
                  Premium-Code aktiv
                </Badge>
              )}
              <LanguageSwitch variant="compact" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="mx-2">›</span>
                )}
                <button
                  onClick={item.onClick}
                  className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                    item.isActive ? 'text-foreground font-medium' : ''
                  }`}
                  disabled={item.isActive}
                >
                  {item.icon}
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Guest Code Info */}
        {guestCodeInfo && (
          <Card className="p-6 mb-8 border-success/20 bg-success/5">
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
            <h2 className="text-2xl font-bold">{t.headline}</h2>
            <div className="text-sm text-muted-foreground">
              {t.step}
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            {t.subtitle}
          </p>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300 w-1/2" />
          </div>
        </div>

        {/* Restaurant Information Form */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t.basicInfoTitle}</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">{t.nameLabel} *</Label>
                  <Input
                    id="restaurantName"
                    placeholder={t.namePlaceholder}
                    value={formData.restaurantName}
                    onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t.addressLabel} *</Label>
                  <div className="relative">
                    <Input
                      id="address"
                      placeholder={t.addressPlaceholder}
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
                    <Label htmlFor="phoneNumber">{t.phoneLabel}</Label>
                    <div className="relative">
                      <Input
                        id="phoneNumber"
                        placeholder={t.phonePlaceholder}
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="pl-10"
                      />
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">{t.websiteLabel}</Label>
                    <div className="relative">
                      <Input
                        id="website"
                        placeholder={t.websitePlaceholder}
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="pl-10"
                      />
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Category & Pricing Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold">{t.categoryPricingTitle}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t.categoryLabel} *</Label>
                <Select value={formData.mainCategory} onValueChange={(value) => handleInputChange('mainCategory', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.categoryPlaceholder} />
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
                <Label>{t.priceLabel} *</Label>
                <Select value={formData.priceRange} onValueChange={(value) => handleInputChange('priceRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.pricePlaceholder} />
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
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold">{t.servicesTitle}</h3>
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
              onClick={handleBackToVCLanding}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backButton}
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid()}
              size="lg"
              className="min-w-32 bg-primary hover:bg-primary/90 text-white"
            >
              {t.nextButton}
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>

          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="p-4 bg-muted/50 border-dashed">
              <div className="text-xs text-muted-foreground mb-2">
                🌐 <strong>Echte Texte implementiert:</strong> Keine i18n-Keys mehr • DE/EN Sprachwechsel • skipEmailGate: {skipEmailGate.toString()}
              </div>
              <div className="text-sm">
                <strong>Form Validation:</strong> {isFormValid() ? '✅ Valid' : '❌ Invalid'}<br />
                <strong>Guest Code:</strong> {guestCodeInfo ? `✅ ${guestCodeInfo.code}` : '❌ None'}<br />
                <strong>Aktuelle Sprache:</strong> {language === 'de' ? 'Deutsch 🇩🇪' : 'English 🇺🇸'}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}