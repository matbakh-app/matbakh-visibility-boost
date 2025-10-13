// ForecastChart Component - Task 6.4.3.2
// Chart component for displaying forecasted visibility scores with confidence intervals
// Requirements: B.3

import type { ForecastResult } from '@/lib/forecast';
import type { ScorePoint } from '@/types/score-history';
import type { FC } from 'react';
import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type ForecastChartProps = {
  historicalData: ScorePoint[];
  forecast: ForecastResult;
  showConfidenceInterval?: boolean;
  showTrendLine?: boolean;
  height?: number;
  className?: string;
};

type ChartDataPoint = {
  date: string;
  historical_score?: number;
  predicted_score?: number;
  confidence_lower?: number;
  confidence_upper?: number;
  is_forecast: boolean;
};

export const ForecastChart: FC<ForecastChartProps> = ({
  historicalData,
  forecast,
  showConfidenceInterval = true,
  showTrendLine = true,
  height = 400,
  className = ''
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Combine historical and forecast data
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];

    // Add historical data
    historicalData.forEach(point => {
      data.push({
        date: point.date,
        historical_score: point.score_value,
        is_forecast: false
      });
    });

    // Add forecast data
    forecast.forecast_points.forEach(point => {
      data.push({
        date: point.date,
        predicted_score: point.predicted_score,
        confidence_lower: point.confidence_lower,
        confidence_upper: point.confidence_upper,
        is_forecast: true
      });
    });

    // Sort by date
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [historicalData, forecast]);

  // Find the split point between historical and forecast data
  const splitIndex = useMemo(() => {
    return chartData.findIndex(point => point.is_forecast);
  }, [chartData]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0].payload as ChartDataPoint;
    const isHistorical = !data.is_forecast;

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg max-w-sm">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          📅 {new Date(label).toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </div>

        {isHistorical ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tatsächlicher Score:</span>
              <span className="text-sm font-medium text-blue-600">
                {data.historical_score?.toFixed(1)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Vorhersage:</span>
              <span className="text-sm font-medium text-green-600">
                {data.predicted_score?.toFixed(1)}
              </span>
            </div>

            {showConfidenceInterval && data.confidence_lower && data.confidence_upper && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <div>Konfidenzintervall (95%):</div>
                <div className="flex justify-between mt-1">
                  <span>{data.confidence_lower.toFixed(1)}</span>
                  <span>-</span>
                  <span>{data.confidence_upper.toFixed(1)}</span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
              🔮 Prognose • Konfidenz: {(forecast.confidence_level * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get trend line data for visualization
  const getTrendLineData = () => {
    if (!showTrendLine) return [];

    const { trend_analysis } = forecast;
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    if (!firstPoint || !lastPoint) return [];

    const startDate = new Date(firstPoint.date).getTime();
    const endDate = new Date(lastPoint.date).getTime();
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    // Calculate trend line values
    const startValue = (firstPoint.historical_score || firstPoint.predicted_score || 0);
    const endValue = startValue + (trend_analysis.slope * daysDiff);

    return [
      { date: firstPoint.date, trend_value: startValue },
      { date: lastPoint.date, trend_value: endValue }
    ];
  };

  const trendLineData = getTrendLineData();

  return (
    <div className={`w-full ${className}`}>
      {/* Chart Header */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Sichtbarkeits-Prognose ({forecast.forecast_range_days} Tage)
            </h3>
            <p className="text-sm text-gray-600">
              {forecast.trend_analysis.direction === 'rising' && '📈 Aufwärtstrend'}
              {forecast.trend_analysis.direction === 'falling' && '📉 Abwärtstrend'}
              {forecast.trend_analysis.direction === 'stable' && '➡️ Stabiler Verlauf'}
              {' • '}
              Konfidenz: {(forecast.confidence_level * 100).toFixed(0)}%
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Historisch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Prognose</span>
            </div>
            {showConfidenceInterval && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                <span>Konfidenzbereich</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
              label={{
                value: 'Score',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip content={CustomTooltip} />

            {/* Confidence Interval Area */}
            {showConfidenceInterval && (
              <Area
                dataKey="confidence_upper"
                stroke="none"
                fill="#10b981"
                fillOpacity={0.1}
                connectNulls={false}
              />
            )}

            {/* Historical Data Line */}
            <Line
              type="monotone"
              dataKey="historical_score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
              connectNulls={false}
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="predicted_score"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
              connectNulls={false}
            />

            {/* Trend Line */}
            {showTrendLine && trendLineData.length > 0 && (
              <Line
                data={trendLineData}
                type="monotone"
                dataKey="trend_value"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Split line between historical and forecast */}
            {splitIndex > 0 && (
              <ReferenceLine
                x={chartData[splitIndex - 1]?.date}
                stroke="#6b7280"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Summary */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-800">Trend</div>
            <div className="text-blue-600">
              {forecast.trend_analysis.direction === 'rising' && 'Steigend'}
              {forecast.trend_analysis.direction === 'falling' && 'Fallend'}
              {forecast.trend_analysis.direction === 'stable' && 'Stabil'}
              {' '}({(forecast.trend_analysis.strength * 100).toFixed(0)}% Stärke)
            </div>
          </div>

          <div>
            <div className="font-medium text-blue-800">Änderung/Monat</div>
            <div className="text-blue-600">
              {forecast.trend_analysis.slope > 0 ? '+' : ''}
              {(forecast.trend_analysis.slope * 30).toFixed(1)} Punkte
            </div>
          </div>

          <div>
            <div className="font-medium text-blue-800">Volatilität</div>
            <div className="text-blue-600">
              ±{forecast.trend_analysis.volatility.toFixed(1)} Punkte
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;