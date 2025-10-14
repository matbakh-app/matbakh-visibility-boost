import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, TrendingUp, ArrowUp, Calendar, Users } from 'lucide-react';

const ReviewsWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  // Sample reviews data
  const reviews = [
    {
      id: 1,
      platform: 'Google',
      author: 'Maria Schmidt',
      rating: 5,
      text: 'Fantastisches Essen und hervorragender Service! Das Personal war sehr freundlich und aufmerksam.',
      timeAgo: '2 Tagen',
      avatar: '/avatars/maria.jpg'
    },
    {
      id: 2,
      platform: 'TripAdvisor',
      author: 'John Wilson',
      rating: 4,
      text: 'Sehr gutes Restaurant mit authentischer Küche. Die Atmosphäre ist gemütlich.',
      timeAgo: '1 Tag',
      avatar: '/avatars/john.jpg'
    },
    {
      id: 3,
      platform: 'Google',
      author: 'Anna Müller',
      rating: 5,
      text: 'Immer wieder gerne! Das Essen ist konstant gut und das Team sehr herzlich.',
      timeAgo: '5 Std',
      avatar: '/avatars/anna.jpg'
    }
  ];

  const platformStats = [
    { name: 'Google', reviews: 847, rating: 4.6, color: 'text-blue-600' },
    { name: 'TripAdvisor', reviews: 234, rating: 4.4, color: 'text-green-600' },
    { name: 'Yelp', reviews: 156, rating: 4.3, color: 'text-red-600' }
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
    <Card className="h-full flex flex-col" data-widget="reviews">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t('reviewsFeedback', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('multiPlatformReviews', { ns: 'dashboard' })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {t('excellent', { ns: 'common' })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-bold text-foreground">4.5</span>
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('averageRating', { ns: 'dashboard' })}
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-foreground">1,237</div>
            <p className="text-xs text-muted-foreground">
              {t('totalReviews', { ns: 'dashboard' })}
            </p>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-green-600 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                +23%
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">47</div>
              <div className="text-xs text-muted-foreground">
                {t('newReviews', { ns: 'dashboard' })}
              </div>
            </div>
          </div>

          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-green-600">89%</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">2.4h</div>
              <div className="text-xs text-muted-foreground">
                {t('avgResponseTime', { ns: 'dashboard' })}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {t('platforms', { ns: 'dashboard' })}
          </h4>
          <div className="space-y-2">
            {platformStats.map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${platform.color.replace('text-', 'bg-')}`} />
                  <span className="text-sm text-foreground">{platform.name}</span>
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
            <h4 className="text-sm font-medium text-foreground">
              {t('recentReviews', { ns: 'dashboard' })}
            </h4>
            <Button variant="ghost" size="sm" className="text-xs">
              {t('viewAll', { ns: 'common' })}
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
                        {review.platform} • vor {review.timeAgo}
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
                  {t('respond', { ns: 'dashboard' })}
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