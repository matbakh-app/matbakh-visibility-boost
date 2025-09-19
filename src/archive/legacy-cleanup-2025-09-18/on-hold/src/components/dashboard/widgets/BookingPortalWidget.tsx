import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Star, Eye, TrendingUp } from 'lucide-react';

interface BookingPortalData {
  source: string;
  avg_score: number;
  views: number;
  ranking?: number;
  reviews_count?: number;
  trend?: number;
}

interface BookingPortalWidgetProps {
  data?: BookingPortalData[];
  isLoading?: boolean;
}

const BookingPortalWidget: React.FC<BookingPortalWidgetProps> = ({ 
  data = [
    { source: "TripAdvisor", avg_score: 4.2, views: 800, ranking: 15, reviews_count: 127, trend: 5 },
    { source: "TheFork", avg_score: 4.5, views: 450, ranking: 8, reviews_count: 89, trend: 12 },
    { source: "Booking.com", avg_score: 4.1, views: 320, ranking: 22, reviews_count: 65, trend: -2 }
  ], 
  isLoading = false 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const totalViews = data.reduce((sum, item) => sum + item.views, 0);
  const avgScore = data.reduce((sum, item) => sum + item.avg_score, 0) / data.length;

  const getRankingColor = (ranking: number) => {
    if (ranking <= 10) return 'text-green-600';
    if (ranking <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Buchungsportale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Buchungsportale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xl font-bold text-primary">{avgScore.toFixed(1)}</span>
              <div className="flex">{renderStars(avgScore)}</div>
            </div>
            <div className="text-xs text-gray-600">Ø Bewertung</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Gesamt Views</div>
          </div>
        </div>

        {/* Portal Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Nach Portal</h4>
          {data.map((portal, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm flex items-center gap-2">
                  {portal.source}
                  {portal.trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${
                      portal.trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${portal.trend < 0 ? 'rotate-180' : ''}`} />
                      {portal.trend > 0 ? '+' : ''}{portal.trend}%
                    </div>
                  )}
                </div>
                {portal.ranking && (
                  <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getRankingColor(portal.ranking)}`}>
                    #{portal.ranking}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="flex">{renderStars(portal.avg_score)}</div>
                  <span className="text-xs">{portal.avg_score.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">{portal.views}</span>
                </div>
                {portal.reviews_count && (
                  <div className="text-xs text-gray-600">
                    {portal.reviews_count} Reviews
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Daten der letzten 30 Tage
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingPortalWidget;