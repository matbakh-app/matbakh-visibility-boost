import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Phone, Globe, Star, Users, Car, Wifi } from 'lucide-react';

const LocationOverviewWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  const locations = [
    {
      name: 'München Hauptbahnhof',
      address: 'Bayerstraße 10A, 80335 München',
      phone: '+49 89 123456789',
      hours: 'Mo-So: 11:00-23:00',
      rating: 4.6,
      reviews: 847,
      features: ['Wifi', 'Parkplatz', 'Terrasse', 'Lieferung'],
      status: 'open',
      nextEvent: 'Happy Hour in 2h'
    },
    {
      name: 'Berlin Mitte',
      address: 'Unter den Linden 15, 10117 Berlin',
      phone: '+49 30 987654321',
      hours: 'Mo-So: 12:00-22:00',
      rating: 4.4,
      reviews: 623,
      features: ['Wifi', 'Terrasse', 'Reservierung'],
      status: 'open',
      nextEvent: 'Live Musik um 20:00'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800">Geöffnet</Badge>;
      case 'closed':
        return <Badge variant="secondary">Geschlossen</Badge>;
      case 'busy':
        return <Badge className="bg-orange-100 text-orange-800">Sehr voll</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-3 h-3" />;
      case 'parkplatz':
        return <Car className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  return (
    <Card className="h-full flex flex-col" data-widget="location-overview">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('locationOverview', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('allLocations', { ns: 'dashboard' })}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <MapPin className="h-4 w-4" />
            {t('addLocation', { ns: 'dashboard' })}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Locations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {locations.map((location, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 hover:bg-accent/10 transition-colors">
              {/* Location Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{location.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {location.address}
                  </p>
                </div>
                {getStatusBadge(location.status)}
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {location.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {location.hours}
                </div>
              </div>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{location.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({location.reviews} Bewertungen)
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {location.features.map((feature, featureIndex) => (
                  <Badge key={featureIndex} variant="outline" className="text-xs gap-1">
                    {getFeatureIcon(feature)}
                    {feature}
                  </Badge>
                ))}
              </div>

              {/* Next Event */}
              {location.nextEvent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-800 font-medium">
                    📅 {location.nextEvent}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Globe className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Button size="sm" className="flex-1">
                  Bearbeiten
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-accent/20 rounded-lg">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-foreground">5</div>
            <p className="text-xs text-muted-foreground">Standorte</p>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600">4.5</div>
            <p className="text-xs text-muted-foreground">Ø Bewertung</p>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-blue-600">2,847</div>
            <p className="text-xs text-muted-foreground">Gesamt Reviews</p>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">Geöffnet</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationOverviewWidget;