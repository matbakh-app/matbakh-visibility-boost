import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSLOMonitoring } from '@/hooks/useSLOMonitoring';
import {
    Activity,
    Download,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface TrendData {
  timestamp: string;
  date: Date;
  overall: number;
  performance: number;
  availability: number;
  quality: number;
  cost: number;
  security: number;
}

interface CategoryStats {
  category: string;
  totalSLOs: number;
  healthySLOs: number;
  warningSLOs: number;
  criticalSLOs: number;
  averageCompliance: number;
  trend: 'up' | 'down' | 'stable';
}

export const SLOTrendsAnalytics: React.FC = () => {
  const { sloStatuses, sloDefinitions, generateReport } = useSLOMonitoring();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate mock trend data (in production, this would come from historical data)
  const trendData: TrendData[] = useMemo(() => {
    const now = new Date();
    const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : 
                     timeRange === '24h' ? 60 * 60 * 1000 : 
                     timeRange === '7d' ? 24 * 60 * 60 * 1000 : 
                     24 * 60 * 60 * 1000;

    return Array.from({ length: intervals }, (_, i) => {
      const timestamp = new Date(now.getTime() - (intervals - 1 - i) * intervalMs);
      const baseCompliance = 95 + Math.random() * 4; // 95-99%
      
      return {
        timestamp: timeRange === '1h' ? timestamp.toLocaleTimeString() :
                  timeRange === '24h' ? timestamp.getHours().toString().padStart(2, '0') + ':00' :
                  timeRange === '7d' ? timestamp.toLocaleDateString('en-US', { weekday: 'short' }) :
                  timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: timestamp,
        overall: baseCompliance + (Math.random() - 0.5) * 2,
        performance: baseCompliance - 1 + (Math.random() - 0.5) * 3,
        availability: Math.min(99.9, baseCompliance + 2 + (Math.random() - 0.5) * 1),
        quality: baseCompliance + (Math.random() - 0.5) * 2,
        cost: baseCompliance + 1 + (Math.random() - 0.5) * 2,
        security: baseCompliance + 0.5 + (Math.random() - 0.5) * 1
      };
    });
  }, [timeRange]);

  // Calculate category statistics
  const categoryStats: CategoryStats[] = useMemo(() => {
    const categories = ['performance', 'availability', 'quality', 'cost', 'security'];
    
    return categories.map(category => {
      const categorySLOs = sloStatuses.filter(status => {
        const definition = sloDefinitions.find(def => def.id === status.sloId);
        return definition?.category === category;
      });

      const healthySLOs = categorySLOs.filter(s => s.status === 'healthy').length;
      const warningSLOs = categorySLOs.filter(s => s.status === 'warning').length;
      const criticalSLOs = categorySLOs.filter(s => s.status === 'critical').length;
      const averageCompliance = categorySLOs.length > 0 
        ? categorySLOs.reduce((sum, s) => sum + s.compliance, 0) / categorySLOs.length
        : 0;

      // Mock trend calculation
      const trend: 'up' | 'down' | 'stable' = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down';

      return {
        category,
        totalSLOs: categorySLOs.length,
        healthySLOs,
        warningSLOs,
        criticalSLOs,
        averageCompliance,
        trend
      };
    }).filter(stat => stat.totalSLOs > 0);
  }, [sloStatuses, sloDefinitions]);

  // Filter data based on selected category
  const filteredTrendData = useMemo(() => {
    if (selectedCategory === 'all') return trendData;
    return trendData.map(data => ({
      ...data,
      [selectedCategory]: data[selectedCategory as keyof TrendData] as number
    }));
  }, [trendData, selectedCategory]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      performance: '#8884d8',
      availability: '#82ca9d',
      quality: '#ffc658',
      cost: '#ff7300',
      security: '#00ff00'
    };
    return colors[category] || '#8884d8';
  };

  const exportData = () => {
    const report = generateReport();
    const csvContent = [
      ['Timestamp', 'Overall', 'Performance', 'Availability', 'Quality', 'Cost', 'Security'].join(','),
      ...trendData.map(data => [
        data.date.toISOString(),
        data.overall.toFixed(2),
        data.performance.toFixed(2),
        data.availability.toFixed(2),
        data.quality.toFixed(2),
        data.cost.toFixed(2),
        data.security.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slo-trends-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SLO Trends & Analytics</h2>
          <p className="text-gray-600">Historical performance and trend analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Compliance Trends</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="distribution">SLO Distribution</TabsTrigger>
          <TabsTrigger value="heatmap">Performance Heatmap</TabsTrigger>
        </TabsList>

        {/* Compliance Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="availability">Availability</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SLO Compliance Over Time</CardTitle>
              <CardDescription>
                {selectedCategory === 'all' ? 'All categories' : `${selectedCategory} category`} - {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {selectedCategory === 'all' ? (
                  <LineChart data={filteredTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Compliance']} />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#8884d8" name="Overall" strokeWidth={2} />
                    <Line type="monotone" dataKey="performance" stroke="#82ca9d" name="Performance" />
                    <Line type="monotone" dataKey="availability" stroke="#ffc658" name="Availability" />
                    <Line type="monotone" dataKey="quality" stroke="#ff7300" name="Quality" />
                    <Line type="monotone" dataKey="cost" stroke="#00ff00" name="Cost" />
                  </LineChart>
                ) : (
                  <AreaChart data={filteredTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Compliance']} />
                    <Area 
                      type="monotone" 
                      dataKey={selectedCategory} 
                      stroke={getCategoryColor(selectedCategory)} 
                      fill={getCategoryColor(selectedCategory)}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {(trendData[trendData.length - 1]?.overall || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Current Overall</div>
                <div className="flex items-center mt-1">
                  {getTrendIcon('up')}
                  <span className="text-xs text-green-600 ml-1">+0.5% vs last period</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {Math.max(...trendData.map(d => d.overall)).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Peak Compliance</div>
                <div className="text-xs text-gray-500 mt-1">Highest in period</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {Math.min(...trendData.map(d => d.overall)).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Lowest Compliance</div>
                <div className="text-xs text-gray-500 mt-1">Needs attention</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {(trendData.reduce((sum, d) => sum + d.overall, 0) / trendData.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Average</div>
                <div className="text-xs text-gray-500 mt-1">Period average</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Category Analysis Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((stat) => (
              <Card key={stat.category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{stat.category}</CardTitle>
                    {getTrendIcon(stat.trend)}
                  </div>
                  <CardDescription>{stat.totalSLOs} SLOs in this category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold">{stat.averageCompliance.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Average Compliance</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{stat.healthySLOs}</div>
                        <div className="text-gray-500">Healthy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">{stat.warningSLOs}</div>
                        <div className="text-gray-500">Warning</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{stat.criticalSLOs}</div>
                        <div className="text-gray-500">Critical</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(stat.healthySLOs / stat.totalSLOs) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageCompliance" fill="#8884d8" name="Average Compliance %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLO Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>SLO Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Healthy', value: sloStatuses.filter(s => s.status === 'healthy').length, fill: '#10b981' },
                        { name: 'Warning', value: sloStatuses.filter(s => s.status === 'warning').length, fill: '#f59e0b' },
                        { name: 'Critical', value: sloStatuses.filter(s => s.status === 'critical').length, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryStats.map(stat => ({
                        name: stat.category,
                        value: stat.totalSLOs,
                        fill: getCategoryColor(stat.category)
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    />
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Distribution</CardTitle>
              <CardDescription>Number of SLOs by compliance percentage ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { range: '95-100%', count: sloStatuses.filter(s => s.compliance >= 95).length },
                  { range: '90-95%', count: sloStatuses.filter(s => s.compliance >= 90 && s.compliance < 95).length },
                  { range: '85-90%', count: sloStatuses.filter(s => s.compliance >= 85 && s.compliance < 90).length },
                  { range: '80-85%', count: sloStatuses.filter(s => s.compliance >= 80 && s.compliance < 85).length },
                  { range: '<80%', count: sloStatuses.filter(s => s.compliance < 80).length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SLO Performance Matrix</CardTitle>
              <CardDescription>Individual SLO performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sloStatuses.map((status) => {
                  const definition = sloDefinitions.find(def => def.id === status.sloId);
                  if (!definition) return null;

                  return (
                    <div key={status.sloId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{definition.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{definition.category}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            status.status === 'healthy' ? 'default' :
                            status.status === 'warning' ? 'destructive' : 'destructive'
                          } className={
                            status.status === 'healthy' ? 'bg-green-100 text-green-800' :
                            status.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''
                          }>
                            {status.status}
                          </Badge>
                          {getTrendIcon(status.trend)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{status.compliance.toFixed(1)}%</div>
                          <div className="text-gray-500">Compliance</div>
                        </div>
                        <div>
                          <div className="font-medium">{status.errorBudgetRemaining.toFixed(1)}%</div>
                          <div className="text-gray-500">Error Budget</div>
                        </div>
                        <div>
                          <div className="font-medium">{status.burnRate.short.toFixed(1)}x</div>
                          <div className="text-gray-500">Burn Rate</div>
                        </div>
                        <div>
                          <div className="font-medium">{status.violationCount24h}</div>
                          <div className="text-gray-500">Violations (24h)</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status.compliance >= 95 ? 'bg-green-500' :
                              status.compliance >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${status.compliance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};