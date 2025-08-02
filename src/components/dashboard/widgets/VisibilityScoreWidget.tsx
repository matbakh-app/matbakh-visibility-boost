import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface VisibilityScoreData {
  date: string;
  score: number;
  trend?: number;
  previousScore?: number;
}

interface VisibilityScoreWidgetProps {
  data?: VisibilityScoreData;
  isLoading?: boolean;
}

const VisibilityScoreWidget: React.FC<VisibilityScoreWidgetProps> = ({ 
  data = { date: "2025-08-01", score: 87, trend: 5, previousScore: 82 }, 
  isLoading = false 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Sichtbarkeits-Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sichtbarkeits-Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge Display */}
        <div className="flex items-center justify-center">
          <div className={`relative w-24 h-24 rounded-full ${getScoreBackground(data.score)} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                {data.score}
              </div>
              <div className="text-xs text-gray-600">/ 100</div>
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        {data.trend !== undefined && (
          <div className="flex items-center justify-center space-x-2">
            {data.trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm ${data.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.trend > 0 ? '+' : ''}{data.trend} Punkte
            </span>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Letzte Aktualisierung: {new Date(data.date).toLocaleDateString('de-DE')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisibilityScoreWidget;