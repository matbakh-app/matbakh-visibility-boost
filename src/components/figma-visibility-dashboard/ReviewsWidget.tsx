import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, TrendingUp, ArrowUp, Calendar, Users, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const ReviewsWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Bewertungen & Feedback',
      en: 'Reviews & Feedback'
    },
    subtitle: {
      de: 'Multi-Platform Bewertungsübersicht',
      en: 'Multi-Platform Review Overview'
    },
    averageRating: {
      de: 'Durchschnittsbewertung',
      en: 'Average Rating'
    },
    totalReviews: {
      de: 'Bewertungen gesamt',
      en: 'Total Reviews'
    },
    thisMonth: {
      de: 'Diesen Monat',
      en: 'This Month'
    },
    newReviews: {
      de: 'Neue Bewertungen',
      en: 'New Reviews'
    },
    responseRate: {
      de: 'Antwortrate',
      en: 'Response Rate'
    },
    avgResponseTime: {
      de: 'Ø Antwortzeit',
      en: 'Avg Response Time'
    },
    hours: {
      de: 'Std',
      en: 'hrs'
    },
    recentReviews: {
      de: 'Aktuelle Bewertungen',
      en: 'Recent Reviews'
    },
    viewAll: {
      de: 'Alle anzeigen',
      en: 'View All'
    },
    respond: {
      de: 'Antworten',
      en: 'Respond'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    },
    good: {
      de: 'Gut',
      en: 'Good'
    },
    platforms: {
      de: 'Plattformen',
      en: 'Platforms'
    },
    google: {
      de: 'Google',
      en: 'Google'
    },
    tripadvisor: {
      de: 'TripAdvisor',
      en: 'TripAdvisor'
    },
    yelp: {
      de: 'Yelp',
      en: 'Yelp'
    },
    ago: {
      de: 'vor',
      en: 'ago'
    },
    days: {
      de: 'Tagen',
      en: 'days'
    },
    day: {
      de: 'Tag',
      en: 'day'
    },
    hours_short: {
      de: 'Std',
      en: 'h'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample reviews data with translations
  const reviews = [
    {
      id: 1,
      platform: 'Google',
      author: 'Maria Schmidt',
      rating: 5,
      text: language === 'de' 
        ? 'Fantastisches Essen und hervorragender Service! Das Personal war sehr freundlich und aufmerksam. Definitiv eine Empfehlung wert.'
        : 'Fantastic food and excellent service! The staff was very friendly and attentive. Definitely worth recommending.',
      timeAgo: language === 'de' ? '2 Tagen' : '2 days',
      avatar: '/avatars/maria.jpg'
    },
    {
      id: 2,
      platform: 'TripAdvisor',
      author: 'John Wilson',
      rating: 4,
      text: language === 'de'
        ? 'Sehr gutes Restaurant mit authentischer Küche. Die Atmosphäre ist gemütlich und das Preis-Leistungs-Verhältnis stimmt.'
        : 'Very good restaurant with authentic cuisine. The atmosphere is cozy and the price-performance ratio is right.',
      timeAgo: language === 'de' ? '1 Tag' : '1 day',
      avatar: '/avatars/john.jpg'
    },
    {
      id: 3,
      platform: 'Google',
      author: 'Anna Müller',
      rating: 5,
      text: language === 'de'
        ? 'Immer wieder gerne! Das Essen ist konstant gut und das Team sehr herzlich. Besonders die Vorspeisen sind zu empfehlen.'
        : 'Always happy to come back! The food is consistently good and the team is very warm. The appetizers are especially recommended.',
      timeAgo: language === 'de' ? '5 Std' : '5h',
      avatar: '/avatars/anna.jpg'
    }
  ];

  const platformStats = [
    { name: getText('google'), reviews: 847, rating: 4.6, color: 'text-blue-600' },
    { name: getText('tripadvisor'), reviews: 234, rating: 4.4, color: 'text-green-600' },
    { name: getText('yelp'), reviews: 156, rating: 4.3, color: 'text-red-600' }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="reviews">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <MessageSquare className="icon-md text-primary" />
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
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <span className="metric-lg text-foreground">4.5</span>
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="caption text-muted-foreground">
              {getText('averageRating')}
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="metric-lg text-foreground">1,237</div>
            <p className="caption text-muted-foreground">
              {getText('totalReviews')}
            </p>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-success flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                +23%
              </span>
            </div>
            <div>
              <div className="metric-md text-foreground">47</div>
              <div className="caption text-muted-foreground">
                {getText('newReviews')}
              </div>
            </div>
          </div>

          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-success">89%</span>
            </div>
            <div>
              <div className="metric-md text-foreground">2.4{getText('hours')}</div>
              <div className="caption text-muted-foreground">
                {getText('avgResponseTime')}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('platforms')}
          </h4>
          <div className="space-y-2">
            {platformStats.map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${platform.color.replace('text-', 'bg-')}`} />
                  <span className="body-md text-foreground">{platform.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{platform.rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {platform.reviews}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('recentReviews')}
            </h4>
            <Button variant="ghost" size="sm" className="text-xs">
              {getText('viewAll')}
            </Button>
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-3 space-y-2 hover:bg-accent/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={review.avatar} />
                      <AvatarFallback className="text-xs">
                        {review.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {review.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.platform} • {getText('ago')} {review.timeAgo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {review.text}
                </p>
                
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                  {getText('respond')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsWidget;