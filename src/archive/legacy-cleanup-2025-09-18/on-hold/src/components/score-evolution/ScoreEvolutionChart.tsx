/**
 * Score Evolution Chart Component
 * Task 6.4.2 - Visibility Trend Chart Component
 */

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Scatter,
  ReferenceDot
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ScoreEvolutionData,
  ChartDataPoint,
  ChartConfig,
  ScoreType,
  EventType,
  DEFAULT_CHART_CONFIG,
  SCORE_TYPE_LABELS,
  EVENT_TYPE_LABELS
} from '../../types/score-evolution';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Target,
  Calendar,
  Filter,
  Download,
  Maximize2
} from 'lucide-react';

interface ScoreEvolutionChartProps {
  data: ScoreEvolutionData[];
  config?: Partial<ChartConfig>;
  selectedScoreTypes?: ScoreType[];
  showForecast?: boolean;
  showBenchmarks?: boolean;
  showEvents?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  onScoreTypeToggle?: (scoreType: ScoreType) => void;
  onEventClick?: (eventId: string) => void;
  className?: string;
}

export function ScoreEvolutionChart({
  data,
  config = {},
  selectedScoreTypes = ['overall_visibility'],
  showForecast = true,
  showBenchmarks = true,
  showEvents = true,
  dateRange,
  onScoreTypeToggle,
  onEventClick,
  className = ''
}: ScoreEvolutionChartProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'insights' | 'events'>('chart');
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...config };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const allDataPoints: ChartDataPoint[] = [];
    
    data.forEach(scoreData => {
      if (!selectedScoreTypes.includes(scoreData.score_type)) return;
      
      // Add historical data
      scoreData.historical_data.forEach(point => {
        allDataPoints.push({
          date: point.calculated_at,
          value: point.score_value,
          type: 'historical',
          scoreType: scoreData.score_type
        });
      });
      
      // Add forecast data if enabled
      if (showForecast && scoreData.forecast_data) {
        scoreData.forecast_data.forEach(point => {
          allDataPoints.push({
            date: point.date,
            value: point.predicted_value,
            type: 'forecast',
            confidence: point.confidence_level,
            scoreType: scoreData.score_type,
            confidenceLower: point.confidence_lower,
            confidenceUpper: point.confidence_upper
          });
        });
      }
    });
    
    // Group by date and merge score types
    const groupedData = allDataPoints.reduce((acc, point) => {
      const dateKey = format(parseISO(point.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          timestamp: point.date
        };
      }
      
      const key = point.type === 'forecast' ? `${point.scoreType}_forecast` : point.scoreType;
      acc[dateKey][key] = point.value;
      
      if (point.confidence !== undefined) {
        acc[dateKey][`${point.scoreType}_confidence`] = point.confidence;
        acc[dateKey][`${point.scoreType}_lower`] = point.confidenceLower;
        acc[dateKey][`${point.scoreType}_upper`] = point.confidenceUpper;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groupedData).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [data, selectedScoreTypes, showForecast]);
  
  // Prepare events for display
  const chartEvents = useMemo(() => {
    if (!showEvents) return [];
    
    return data.flatMap(scoreData => 
      scoreData.events.map(event => ({
        ...event,
        scoreType: scoreData.score_type,
        x: format(parseISO(event.triggered_at), 'yyyy-MM-dd'),
        y: event.score_after || scoreData.current_score
      }))
    );
  }, [data, showEvents]);
  
  // Get benchmark lines
  const benchmarkLines = useMemo(() => {
    if (!showBenchmarks) return [];
    
    return data
      .filter(scoreData => scoreData.benchmark && selectedScoreTypes.includes(scoreData.score_type))
      .map(scoreData => ({
        scoreType: scoreData.score_type,
        value: scoreData.benchmark!.benchmark_value,
        label: `${SCORE_TYPE_LABELS[scoreData.score_type]} Benchmark`
      }));
  }, [data, showBenchmarks, selectedScoreTypes]);
  
  // Calculate insights
  const insights = useMemo(() => {
    return data.flatMap(scoreData => {
      const insights = [];
      const trend = scoreData.trend_analysis;
      
      // Trend insight
      if (trend.overall_trend !== 'neutral') {
        insights.push({
          type: 'trend' as const,
          scoreType: scoreData.score_type,
          title: `${SCORE_TYPE_LABELS[scoreData.score_type]}: ${trend.overall_trend === 'up' ? 'Aufwärtstrend' : 'Abwärtstrend'}`,
          description: `Durchschnittliche Änderung: ${trend.average_change_per_week.toFixed(1)}% pro Woche`,
          impact: trend.trend_strength > 0.7 ? 'high' : trend.trend_strength > 0.4 ? 'medium' : 'low',
          icon: trend.overall_trend === 'up' ? TrendingUp : TrendingDown,
          color: trend.overall_trend === 'up' ? 'text-green-600' : 'text-red-600'
        });
      }
      
      // Stagnation insight
      if (trend.days_since_last_change > 14) {
        insights.push({
          type: 'stagnation' as const,
          scoreType: scoreData.score_type,
          title: `${SCORE_TYPE_LABELS[scoreData.score_type]}: Stagnation`,
          description: `Keine signifikante Änderung seit ${trend.days_since_last_change} Tagen`,
          impact: 'medium' as const,
          icon: Minus,
          color: 'text-yellow-600'
        });
      }
      
      // Volatility insight
      if (trend.volatility > 0.7) {
        insights.push({
          type: 'volatility' as const,
          scoreType: scoreData.score_type,
          title: `${SCORE_TYPE_LABELS[scoreData.score_type]}: Hohe Volatilität`,
          description: `Unregelmäßige Schwankungen detected`,
          impact: 'medium' as const,
          icon: AlertTriangle,
          color: 'text-orange-600'
        });
      }
      
      return insights;
    });
  }, [data]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const date = parseISO(payload[0]?.payload?.timestamp || label);
    
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-2">
          {format(date, 'dd. MMM yyyy', { locale: de })}
        </p>
        {payload.map((entry: any, index: number) => {
          const scoreType = entry.dataKey.replace('_forecast', '') as ScoreType;
          const isForecast = entry.dataKey.includes('_forecast');
          
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className={isForecast ? 'italic' : ''}>
                {SCORE_TYPE_LABELS[scoreType]}: {entry.value?.toFixed(1)}%
                {isForecast && ' (Prognose)'}
              </span>
            </div>
          );
        })}
        
        {/* Show events for this date */}
        {chartEvents
          .filter(event => event.x === label)
          .map(event => (
            <div key={event.id} className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="font-medium">{EVENT_TYPE_LABELS[event.event_type]}</span>
              </div>
              <p className="text-gray-600 mt-1">{event.event_description}</p>
            </div>
          ))
        }
      </div>
    );
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'volatile': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Evolution
              </CardTitle>
              <CardDescription>
                Entwicklung der Sichtbarkeits-Scores über Zeit
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4 mr-1" />
                Vollbild
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Score type selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {data.map(scoreData => (
              <Badge
                key={scoreData.score_type}
                variant={selectedScoreTypes.includes(scoreData.score_type) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onScoreTypeToggle?.(scoreData.score_type)}
              >
                {getTrendIcon(scoreData.trend_analysis.overall_trend)}
                <span className="ml-1">{SCORE_TYPE_LABELS[scoreData.score_type]}</span>
                <span className="ml-2 font-mono">{scoreData.current_score.toFixed(1)}%</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="insights">Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({chartEvents.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={chartConfig.height}>
                <ComposedChart data={chartData} margin={chartConfig.margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => format(parseISO(value), 'dd.MM', { locale: de })}
                    stroke="#64748b"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke="#64748b"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Benchmark reference lines */}
                  {benchmarkLines.map(benchmark => (
                    <ReferenceLine
                      key={benchmark.scoreType}
                      y={benchmark.value}
                      stroke={chartConfig.colors.benchmark}
                      strokeDasharray="5 5"
                      label={benchmark.label}
                    />
                  ))}
                  
                  {/* Score lines */}
                  {selectedScoreTypes.map((scoreType, index) => (
                    <React.Fragment key={scoreType}>
                      {/* Historical data */}
                      <Line
                        type="monotone"
                        dataKey={scoreType}
                        stroke={chartConfig.colors.line}
                        strokeWidth={2}
                        dot={{ fill: chartConfig.colors.line, strokeWidth: 2, r: 3 }}
                        connectNulls={false}
                        name={SCORE_TYPE_LABELS[scoreType]}
                      />
                      
                      {/* Forecast data */}
                      {showForecast && (
                        <Line
                          type="monotone"
                          dataKey={`${scoreType}_forecast`}
                          stroke={chartConfig.colors.forecast}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: chartConfig.colors.forecast, strokeWidth: 2, r: 2 }}
                          connectNulls={false}
                          name={`${SCORE_TYPE_LABELS[scoreType]} (Prognose)`}
                        />
                      )}
                      
                      {/* Confidence interval */}
                      {showForecast && chartConfig.show_confidence_interval && (
                        <Area
                          type="monotone"
                          dataKey={`${scoreType}_upper`}
                          stackId={`confidence_${scoreType}`}
                          stroke="none"
                          fill={chartConfig.colors.confidence}
                          fillOpacity={0.3}
                        />
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Event markers */}
                  {showEvents && chartEvents.map(event => (
                    <ReferenceDot
                      key={event.id}
                      x={event.x}
                      y={event.y}
                      r={4}
                      fill={chartConfig.colors.events[event.event_type]}
                      stroke="white"
                      strokeWidth={2}
                      onClick={() => onEventClick?.(event.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="mt-6">
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <insight.icon className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      <Badge 
                        variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                        className="mt-2"
                      >
                        {insight.impact === 'high' ? 'Hohe Priorität' : insight.impact === 'medium' ? 'Mittlere Priorität' : 'Niedrige Priorität'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {insights.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine besonderen Insights für den gewählten Zeitraum gefunden.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {chartEvents.map(event => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onEventClick?.(event.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-3 h-3 rounded-full mt-2"
                      style={{ backgroundColor: chartConfig.colors.events[event.event_type] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{EVENT_TYPE_LABELS[event.event_type]}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(event.triggered_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{event.event_description}</p>
                      
                      {event.score_before && event.score_after && (
                        <div className="flex items-center gap-4 text-sm">
                          <span>Vorher: {event.score_before.toFixed(1)}%</span>
                          <span>Nachher: {event.score_after.toFixed(1)}%</span>
                          {event.change_percentage && (
                            <Badge variant={event.change_percentage > 0 ? 'default' : 'destructive'}>
                              {event.change_percentage > 0 ? '+' : ''}{event.change_percentage.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {chartEvents.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Events für den gewählten Zeitraum gefunden.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ScoreEvolutionChart;