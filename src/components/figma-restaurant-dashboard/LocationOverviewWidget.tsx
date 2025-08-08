import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, Users, Star, Wifi, Car, CreditCard, Utensils, ArrowUp, ArrowDown, ExternalLink, Edit, Phone, Globe } from 'lucide-react';

// Simple utilities and hooks
type Language = 'de' | 'en';
const useLanguage = () => {
  const [language, setLanguage] = React.useState<Language>('de');
  return { language, setLanguage };
};

const formatBusinessHours = (open: string, close: string, language: Language) => `${open} - ${close}`;
const formatNumber = (num: number, language: Language) => num.toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
const formatPercentage = (num: number, language: Language) => `${num}%`;

const LocationOverviewWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Standort-Übersicht',
      en: 'Location Overview'
    },
    subtitle: {
      de: 'Restaurant-Informationen & Status',
      en: 'Restaurant Information & Status'
    },
    currentLocation: {
      de: 'Aktueller Standort',
      en: 'Current Location'
    },
    businessHours: {
      de: 'Öffnungszeiten',
      en: 'Business Hours'
    },
    capacityToday: {
      de: 'Auslastung heute',
      en: 'Capacity Today'
    },
    averageRating: {
      de: 'Durchschnittsbewertung',
      en: 'Average Rating'
    },
    totalReviews: {
      de: 'Bewertungen gesamt',
      en: 'Total Reviews'
    },
    currentOccupancy: {
      de: 'Aktuelle Belegung',
      en: 'Current Occupancy'
    },
    maxCapacity: {
      de: 'Maximale Kapazität',
      en: 'Max Capacity'
    },
    features: {
      de: 'Ausstattung',
      en: 'Features'
    },
    amenities: {
      de: 'Annehmlichkeiten',
      en: 'Amenities'
    },
    contact: {
      de: 'Kontakt',
      en: 'Contact'
    },
    address: {
      de: 'Adresse',
      en: 'Address'
    },
    phone: {
      de: 'Telefon',
      en: 'Phone'
    },
    website: {
      de: 'Website',
      en: 'Website'
    },
    editLocation: {
      de: 'Standort bearbeiten',
      en: 'Edit Location'
    },
    viewOnMap: {
      de: 'Auf Karte anzeigen',
      en: 'View on Map'
    },
    open: {
      de: 'Geöffnet',
      en: 'Open'
    },
    closed: {
      de: 'Geschlossen',
      en: 'Closed'
    },
    openingSoon: {
      de: 'Öffnet bald',
      en: 'Opening Soon'
    },
    closingSoon: {
      de: 'Schließt bald',
      en: 'Closing Soon'
    },
    monday: {
      de: 'Montag',
      en: 'Monday'
    },
    tuesday: {
      de: 'Dienstag',
      en: 'Tuesday'
    },
    wednesday: {
      de: 'Mittwoch',
      en: 'Wednesday'
    },
    thursday: {
      de: 'Donnerstag',
      en: 'Thursday'
    },
    friday: {
      de: 'Freitag',
      en: 'Friday'
    },
    saturday: {
      de: 'Samstag',
      en: 'Saturday'
    },
    sunday: {
      de: 'Sonntag',
      en: 'Sunday'
    },
    wifi: {
      de: 'WLAN',
      en: 'WiFi'
    },
    parking: {
      de: 'Parkplatz',
      en: 'Parking'
    },
    cardPayment: {
      de: 'Kartenzahlung',
      en: 'Card Payment'
    },
    outdoorSeating: {
      de: 'Außenbereich',
      en: 'Outdoor Seating'
    },
    delivery: {
      de: 'Lieferung',
      en: 'Delivery'
    },
    takeaway: {
      de: 'Abholung',
      en: 'Takeaway'
    },
    wheelchairAccessible: {
      de: 'Rollstuhlgerecht',
      en: 'Wheelchair Accessible'
    },
    petFriendly: {
      de: 'Haustierfreundlich',
      en: 'Pet Friendly'
    },
    airConditioning: {
      de: 'Klimaanlage',
      en: 'Air Conditioning'
    },
    liveMusic: {
      de: 'Live-Musik',
      en: 'Live Music'
    },
    privateEvents: {
      de: 'Private Events',
      en: 'Private Events'
    },
    cocktailBar: {
      de: 'Cocktail-Bar',
      en: 'Cocktail Bar'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    },
    good: {
      de: 'Gut',
      en: 'Good'
    },
    busy: {
      de: 'Ausgebucht',
      en: 'Busy'
    },
    quiet: {
      de: 'Ruhig',
      en: 'Quiet'
    },
    moderate: {
      de: 'Mittel',
      en: 'Moderate'
    },
    guests: {
      de: 'Gäste',
      en: 'Guests'
    },
    tables: {
      de: 'Tische',
      en: 'Tables'
    },
    available: {
      de: 'verfügbar',
      en: 'available'
    },
    occupied: {
      de: 'belegt',
      en: 'occupied'
    },
    peakHours: {
      de: 'Stoßzeiten',
      en: 'Peak Hours'
    },
    todaysPeakTime: {
      de: 'Heutige Stoßzeit',
      en: 'Today\'s Peak Time'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample location data
  const locationData = {
    name: 'matbakh München Hauptbahnhof',
    address: language === 'de' 
      ? 'Bayerstraße 10a, 80335 München'
      : 'Bayerstraße 10a, 80335 Munich',
    phone: '+49 89 12345678',
    website: 'www.matbakh.app',
    coordinates: { lat: 48.1351, lng: 11.5820 },
    rating: 4.6,
    reviewCount: 1247,
    capacity: {
      max: 120,
      current: 87,
      tables: {
        total: 35,
        occupied: 28,
        available: 7
      }
    },
    businessHours: {
      monday: { open: '11:00', close: '23:00' },
      tuesday: { open: '11:00', close: '23:00' },
      wednesday: { open: '11:00', close: '23:00' },
      thursday: { open: '11:00', close: '23:00' },
      friday: { open: '11:00', close: '24:00' },
      saturday: { open: '10:00', close: '24:00' },
      sunday: { open: '10:00', close: '22:00' }
    },
    currentStatus: 'open' as const,
    features: [
      'wifi',
      'parking',
      'cardPayment',
      'outdoorSeating',
      'delivery',
      'takeaway',
      'wheelchairAccessible',
      'airConditioning',
      'cocktailBar'
    ],
    peakHours: ['12:00-14:00', '19:00-21:00']
  };

  const dayNames = {
    monday: getText('monday'),
    tuesday: getText('tuesday'),
    wednesday: getText('wednesday'),
    thursday: getText('thursday'),
    friday: getText('friday'),
    saturday: getText('saturday'),
    sunday: getText('sunday')
  };

  const featureIcons = {
    wifi: Wifi,
    parking: Car,
    cardPayment: CreditCard,
    outdoorSeating: Utensils,
    delivery: MapPin,
    takeaway: MapPin,
    wheelchairAccessible: Users,
    petFriendly: Users,
    airConditioning: Clock,
    liveMusic: Users,
    privateEvents: Users,
    cocktailBar: Utensils
  };

  const getStatusBadge = () => {
    const statusConfig = {
      open: {
        label: getText('open'),
        color: 'text-success',
        bgColor: 'bg-success-light'
      },
      closed: {
        label: getText('closed'),
        color: 'text-error',
        bgColor: 'bg-error-light'
      },
      openingSoon: {
        label: getText('openingSoon'),
        color: 'text-warning',
        bgColor: 'bg-warning-light'
      },
      closingSoon: {
        label: getText('closingSoon'),
        color: 'text-warning',
        bgColor: 'bg-warning-light'
      }
    };

    const config = statusConfig[locationData.currentStatus];
    return (
      <Badge variant="secondary" className={`${config.bgColor} ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const getOccupancyStatus = () => {
    const percentage = (locationData.capacity.current / locationData.capacity.max) * 100;
    
    if (percentage >= 90) return { label: getText('busy'), color: 'text-error' };
    if (percentage >= 70) return { label: getText('moderate'), color: 'text-warning' };
    return { label: getText('quiet'), color: 'text-success' };
  };

  const occupancyStatus = getOccupancyStatus();
  const occupancyPercentage = Math.round((locationData.capacity.current / locationData.capacity.max) * 100);

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="location-overview">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <MapPin className="icon-md text-primary" />
              {getText('title')}
            </CardTitle>
            <p className="caption text-muted-foreground">
              {getText('subtitle')}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Location Basic Info */}
        <div className="space-y-3">
          <div>
            <h4 className="body-md font-medium text-foreground mb-1">
              {locationData.name}
            </h4>
            <p className="text-sm text-muted-foreground">{locationData.address}</p>
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-foreground">
                {locationData.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatNumber(locationData.reviewCount, language)} {getText('totalReviews').toLowerCase()})
              </span>
            </div>
          </div>
        </div>

        {/* Current Capacity Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('currentOccupancy')}
            </h4>
            <Badge variant="outline" className={occupancyStatus.color}>
              {occupancyStatus.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{getText('guests')}</span>
              <span className="text-foreground font-medium">
                {formatNumber(locationData.capacity.current, language)} / {formatNumber(locationData.capacity.max, language)}
              </span>
            </div>
            <Progress value={occupancyPercentage} className="w-full" />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatNumber(locationData.capacity.tables.available, language)} {getText('tables')} {getText('available')}
              </span>
              <span>{occupancyPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('businessHours')}
          </h4>
          
          <div className="space-y-1">
            {Object.entries(locationData.businessHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {dayNames[day as keyof typeof dayNames]}
                </span>
                <span className="text-foreground font-mono">
                  {formatBusinessHours(hours.open, hours.close, language)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="space-y-2 p-3 bg-accent/20 rounded-lg">
          <h4 className="body-md font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {getText('todaysPeakTime')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {locationData.peakHours.map((time, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {time}
              </Badge>
            ))}
          </div>
        </div>

        {/* Features and Amenities */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('features')}
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            {locationData.features.map((feature) => {
              const Icon = featureIcons[feature as keyof typeof featureIcons] || Users;
              return (
                <div key={feature} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center line-clamp-1">
                    {getText(feature as keyof typeof translations)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">{getText('averageRating')}</span>
            </div>
            <div className="metric-md text-foreground">{locationData.rating}</div>
          </div>
          
          <div className="bg-accent/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">{getText('totalReviews')}</span>
            </div>
            <div className="metric-md text-foreground">{formatNumber(locationData.reviewCount, language)}</div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 p-3 border border-border rounded-lg">
          <h4 className="body-md font-medium text-foreground">
            {getText('contact')}
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground font-mono">{locationData.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span className="text-primary">{locationData.website}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <MapPin className="w-4 h-4 mr-2" />
            {getText('viewOnMap')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            <Edit className="w-4 h-4 mr-2" />
            {getText('editLocation')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationOverviewWidget;