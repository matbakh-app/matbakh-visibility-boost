import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar, Clock, Users, Phone, MessageSquare, CheckCircle, XCircle, AlertCircle, Plus, Filter } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { formatDate, formatTime, formatNumber } from '../utils/formatters';

const ReservationsWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Reservierungen',
      en: 'Reservations'
    },
    subtitle: {
      de: 'Tischreservierungen & Gästemanagement',
      en: 'Table Reservations & Guest Management'
    },
    todayReservations: {
      de: 'Reservierungen heute',
      en: 'Today\'s Reservations'
    },
    weeklyTotal: {
      de: 'Woche gesamt',
      en: 'Weekly Total'
    },
    averagePartySize: {
      de: 'Ø Gruppengröße',
      en: 'Avg Party Size'
    },
    occupancyRate: {
      de: 'Auslastung',
      en: 'Occupancy Rate'
    },
    pendingReservations: {
      de: 'Wartende Reservierungen',
      en: 'Pending Reservations'
    },
    confirmedReservations: {
      de: 'Bestätigte Reservierungen',
      en: 'Confirmed Reservations'
    },
    cancelledReservations: {
      de: 'Stornierte Reservierungen',
      en: 'Cancelled Reservations'
    },
    upcomingReservations: {
      de: 'Anstehende Reservierungen',
      en: 'Upcoming Reservations'
    },
    viewAll: {
      de: 'Alle anzeigen',
      en: 'View All'
    },
    addReservation: {
      de: 'Neue Reservierung',
      en: 'Add Reservation'
    },
    confirm: {
      de: 'Bestätigen',
      en: 'Confirm'
    },
    cancel: {
      de: 'Stornieren',
      en: 'Cancel'
    },
    contact: {
      de: 'Kontakt',
      en: 'Contact'
    },
    guests: {
      de: 'Gäste',
      en: 'Guests'
    },
    guest: {
      de: 'Gast',
      en: 'Guest'
    },
    table: {
      de: 'Tisch',
      en: 'Table'
    },
    confirmed: {
      de: 'Bestätigt',
      en: 'Confirmed'
    },
    pending: {
      de: 'Wartend',
      en: 'Pending'
    },
    cancelled: {
      de: 'Storniert',
      en: 'Cancelled'
    },
    seated: {
      de: 'Gesetzt',
      en: 'Seated'
    },
    noShow: {
      de: 'Nicht erschienen',
      en: 'No Show'
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
    peakTime: {
      de: 'Stoßzeit',
      en: 'Peak Time'
    },
    walkIn: {
      de: 'Walk-in',
      en: 'Walk-in'
    },
    vip: {
      de: 'VIP',
      en: 'VIP'
    },
    birthday: {
      de: 'Geburtstag',
      en: 'Birthday'
    },
    anniversary: {
      de: 'Jubiläum',
      en: 'Anniversary'
    },
    specialOccasion: {
      de: 'Besonderer Anlass',
      en: 'Special Occasion'
    },
    businessMeeting: {
      de: 'Geschäftstermin',
      en: 'Business Meeting'
    },
    notes: {
      de: 'Notizen',
      en: 'Notes'
    },
    specialRequests: {
      de: 'Sonderwünsche',
      en: 'Special Requests'
    },
    dietaryRestrictions: {
      de: 'Diätwünsche',
      en: 'Dietary Restrictions'
    },
    filterReservations: {
      de: 'Reservierungen filtern',
      en: 'Filter Reservations'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample reservation data
  const today = new Date();
  const reservations = [
    {
      id: 1,
      guestName: 'Maria Schmidt',
      email: 'maria.schmidt@email.com',
      phone: '+49 30 12345678',
      date: today,
      time: '19:00',
      partySize: 4,
      table: 12,
      status: 'confirmed' as const,
      occasion: 'birthday',
      specialRequests: language === 'de' 
        ? 'Glutenfrei, Tisch am Fenster bevorzugt'
        : 'Gluten-free, window table preferred',
      avatar: '/avatars/maria.jpg'
    },
    {
      id: 2,
      guestName: 'John Wilson',
      email: 'john.wilson@email.com',
      phone: '+49 30 87654321',
      date: today,
      time: '20:30',
      partySize: 2,
      table: 7,
      status: 'pending' as const,
      occasion: 'anniversary',
      specialRequests: language === 'de'
        ? 'Vegetarisch, ruhiger Bereich'
        : 'Vegetarian, quiet area',
      avatar: '/avatars/john.jpg'
    },
    {
      id: 3,
      guestName: 'Anna Müller',
      email: 'anna.mueller@email.com',
      phone: '+49 30 11111111',
      date: today,
      time: '18:15',
      partySize: 6,
      table: 15,
      status: 'confirmed' as const,
      occasion: 'businessMeeting',
      specialRequests: language === 'de'
        ? 'Geschäftsessen, separater Bereich'
        : 'Business dinner, separate area',
      avatar: '/avatars/anna.jpg'
    },
    {
      id: 4,
      guestName: 'David Chen',
      email: 'david.chen@email.com',
      phone: '+49 30 22222222',
      date: today,
      time: '21:00',
      partySize: 3,
      table: 5,
      status: 'pending' as const,
      occasion: 'walkIn',
      specialRequests: '',
      avatar: '/avatars/david.jpg'
    }
  ];

  const metrics = [
    {
      icon: Calendar,
      label: getText('todayReservations'),
      value: formatNumber(42, language),
      change: '+12%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Users,
      label: getText('averagePartySize'),
      value: '3.2',
      change: '+0.3',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: CheckCircle,
      label: getText('occupancyRate'),
      value: '87%',
      change: '+5%',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: getText('peakTime'),
      value: '19:30',
      change: '20:00',
      positive: true,
      color: 'text-orange-600'
    }
  ];

  const statusConfig = {
    confirmed: {
      label: getText('confirmed'),
      color: 'text-success',
      bgColor: 'bg-success-light',
      icon: CheckCircle
    },
    pending: {
      label: getText('pending'),
      color: 'text-warning',
      bgColor: 'bg-warning-light',
      icon: AlertCircle
    },
    cancelled: {
      label: getText('cancelled'),
      color: 'text-error',
      bgColor: 'bg-error-light',
      icon: XCircle
    },
    seated: {
      label: getText('seated'),
      color: 'text-success',
      bgColor: 'bg-success-light',
      icon: Users
    },
    noShow: {
      label: getText('noShow'),
      color: 'text-error',
      bgColor: 'bg-error-light',
      icon: XCircle
    }
  };

  const occasionConfig = {
    birthday: getText('birthday'),
    anniversary: getText('anniversary'),
    specialOccasion: getText('specialOccasion'),
    businessMeeting: getText('businessMeeting'),
    walkIn: getText('walkIn'),
    vip: getText('vip')
  };

  const getStatusBadge = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={`${config.bgColor} ${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPartyLabel = (size: number) => {
    return size === 1 ? getText('guest') : getText('guests');
  };

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="reservations">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <Calendar className="icon-md text-primary" />
              {getText('title')}
            </CardTitle>
            <p className="caption text-muted-foreground">
              {getText('subtitle')}
            </p>
          </div>
          <Badge variant="secondary" className="bg-success-light text-success">
            {getText('excellent')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                <span className="text-xs text-success">
                  {metric.change}
                </span>
              </div>
              <div>
                <div className="metric-md text-foreground">{metric.value}</div>
                <div className="caption text-muted-foreground line-clamp-1">
                  {metric.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-success-light">
            <div className="metric-md text-success">{formatNumber(28, language)}</div>
            <div className="caption text-muted-foreground">{getText('confirmedReservations')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-warning-light">
            <div className="metric-md text-warning">{formatNumber(8, language)}</div>
            <div className="caption text-muted-foreground">{getText('pendingReservations')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-error-light">
            <div className="metric-md text-error">{formatNumber(2, language)}</div>
            <div className="caption text-muted-foreground">{getText('cancelledReservations')}</div>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('upcomingReservations')}
            </h4>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                {getText('filterReservations')}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                {getText('viewAll')}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="border rounded-lg p-3 space-y-3 hover:bg-accent/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={reservation.avatar} />
                      <AvatarFallback className="text-xs">
                        {reservation.guestName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {reservation.guestName}
                        </p>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(new Date(`2024-01-01 ${reservation.time}`), language)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {reservation.partySize} {getPartyLabel(reservation.partySize)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getText('table')} {reservation.table}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Occasion and Special Requests */}
                {(reservation.occasion || reservation.specialRequests) && (
                  <div className="space-y-1">
                    {reservation.occasion && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {occasionConfig[reservation.occasion as keyof typeof occasionConfig]}
                        </Badge>
                      </div>
                    )}
                    {reservation.specialRequests && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        <span className="font-medium">{getText('specialRequests')}:</span> {reservation.specialRequests}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {reservation.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {getText('confirm')}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                        <XCircle className="w-3 h-3 mr-1" />
                        {getText('cancel')}
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="flex-1 text-xs h-7">
                    <Phone className="w-3 h-3 mr-1" />
                    {getText('contact')}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-xs h-7">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {getText('notes')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <Calendar className="w-4 h-4 mr-2" />
            {getText('viewAll')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            <Plus className="w-4 h-4 mr-2" />
            {getText('addReservation')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationsWidget;