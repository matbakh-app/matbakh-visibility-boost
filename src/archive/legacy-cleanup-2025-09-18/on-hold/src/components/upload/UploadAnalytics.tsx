/**
 * Upload Analytics Component
 * Displays analytics and usage reporting for uploads
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Calendar,
  Download,
  FileText,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { useUploadAnalytics } from '@/hooks/useUploadAnalytics';

interface AnalyticsData {
  uploadTrends: Array<{
    date: string;
    uploads: number;
    successful: number;
    failed: number;
    totalSize: number;
  }>;
  fileTypeDistribution: Array<{
    type: string;
    count: number;
    size: number;
    color: string;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  performanceMetrics: {
    averageUploadTime: number;
    successRate: number;
    failureRate: number;
    retryRate: number;
    integrityCheckRate: number;
  };
  storageUsage: {
    totalUsed: number;
    totalQuota: number;
    byType: Array<{
      type: string;
      size: number;
      percentage: number;
    }>;
  };
  topErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

export const UploadAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'count' | 'size'>('count');
  
  const {
    analyticsData,
    loading,
    error,
    exportData,
    refreshAnalytics,
  } = useUploadAnalytics(timeRange);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await exportData(format, timeRange);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load analytics: {error}</p>
            <Button variant="outline" className="mt-4" onClick={refreshAnalytics}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>No analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upload Analytics</h2>
          <p className="text-muted-foreground">
            Insights and trends for your file uploads
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.performanceMetrics.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.performanceMetrics.successRate > 95 ? (
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Excellent
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Needs attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Upload Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analyticsData.performanceMetrics.averageUploadTime / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(analyticsData.storageUsage.totalUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((analyticsData.storageUsage.totalUsed / analyticsData.storageUsage.totalQuota) * 100).toFixed(1)}% of quota
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrity Checks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.performanceMetrics.integrityCheckRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Files verified successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Upload Trends</TabsTrigger>
          <TabsTrigger value="distribution">File Distribution</TabsTrigger>
          <TabsTrigger value="status">Status Analysis</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Trends Over Time</CardTitle>
              <CardDescription>
                Track upload volume and success rates over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant={selectedMetric === 'count' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric('count')}
                  >
                    Upload Count
                  </Button>
                  <Button
                    variant={selectedMetric === 'size' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMetric('size')}
                  >
                    Total Size
                  </Button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.uploadTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      selectedMetric === 'size' ? formatFileSize(value as number) : value,
                      name
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric === 'count' ? 'uploads' : 'totalSize'}
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric === 'count' ? 'successful' : 'totalSize'}
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>File Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of uploads by file type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.fileTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.fileTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage by Type</CardTitle>
                <CardDescription>
                  Storage usage breakdown by file type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.storageUsage.byType.map((item, index) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {item.type}
                        </span>
                        <span>{formatFileSize(item.size)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown of upload statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.statusDistribution.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={status.status === 'completed' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {status.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{status.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {status.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Upload Errors</CardTitle>
              <CardDescription>
                Most common errors and their frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.topErrors.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.topErrors.map((error, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{error.error}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{error.count}</div>
                          <div className="text-xs text-muted-foreground">
                            {error.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${error.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No errors found in the selected time period</p>
                  <p className="text-sm">Your uploads are performing well!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};