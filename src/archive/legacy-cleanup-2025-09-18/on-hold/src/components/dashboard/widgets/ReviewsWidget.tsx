import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageCircle } from 'lucide-react';

interface ReviewData {
  author: string;
  rating: number;
  text: string;
  date?: string;
  platform?: string;
}

interface ReviewsWidgetData {
  count: number;
  avg_rating: number;
  latest: ReviewData;
  total_reviews?: number;
}

interface ReviewsWidgetProps {
  data?: ReviewsWidgetData;
  isLoading?: boolean;
}

const ReviewsWidget: React.FC<ReviewsWidgetProps> = ({ 
  data = { 
    count: 42, 
    avg_rating: 4.3, 
    latest: { author: "Max M.", rating: 5, text: "Fantastisches Essen und super Service!", date: "2025-08-01", platform: "Google" }
  }, 
  isLoading = false 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Bewertungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Bewertungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.count}</div>
            <div className="text-xs text-gray-600">Neue Reviews</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-primary">{data.avg_rating.toFixed(1)}</span>
              <div className="flex">
                {renderStars(data.avg_rating)}
              </div>
            </div>
            <div className="text-xs text-gray-600">Durchschnitt</div>
          </div>
        </div>

        {/* Latest Review */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Neueste Bewertung</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{data.latest.author}</span>
              <div className="flex items-center gap-1">
                {renderStars(data.latest.rating)}
                {data.latest.platform && (
                  <span className="text-xs text-gray-500 ml-1">• {data.latest.platform}</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{data.latest.text}</p>
            {data.latest.date && (
              <p className="text-xs text-gray-500 mt-1">
                {new Date(data.latest.date).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsWidget;