/**
 * Upload Monitoring Demo Page
 * 
 * Demonstrates all upload monitoring integrations with live performance tracking.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  Activity, 
  BarChart3, 
  FileText, 
  Image, 
  User, 
  Building,
  Zap,
  CheckCircle
} from 'lucide-react';
import { 
  MonitoredFileUpload,
  AvatarUpload,
  LogoUpload,
  DocumentUpload,
  ImageUpload,
  ReportUpload
} from '@/components/upload/MonitoredFileUpload';
import { PerformanceWidget } from '@/components/analytics/PerformanceWidget';
import { usePerformanceMonitoringContext } from '@/components/analytics/PerformanceMonitoringProvider';

interface UploadResult {
  type: string;
  result: any;
  timestamp: number;
}

const UploadMonitoringDemo: React.FC = () => {
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const { metrics, recordMetric } = usePerformanceMonitoringContext();

  const handleUploadComplete = (type: string) => (result: any) => {
    setUploadResults(prev => [...prev, {
      type,
      result,
      timestamp: Date.now()
    }]);
    
    // Record demo metric
    recordMetric(`demo_upload_${type}`, 1, 'good');
  };

  const handleUploadError = (type: string) => (error: string) => {
    console.error(`${type} upload failed:`, error);
    recordMetric(`demo_upload_${type}_error`, 1, 'poor');
  };

  // Get recent upload metrics
  const recentUploadMetrics = metrics
    .filter(m => m.name === 'CUSTOM' && new Date(m.timestamp).getTime() > Date.now() - 300000) // Last 5 minutes
    .slice(-10);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Monitoring Demo</h1>
          <p className="text-muted-foreground">
            Live demonstration of monitored file uploads with performance tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Monitoring Active
          </Badge>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Monitoring</span>
              </CardTitle>
              <CardDescription>
                Real-time performance metrics for all upload operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceWidget showDetails={true} />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Uploads</span>
                  <Badge variant="secondary">{uploadResults.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recent Metrics</span>
                  <Badge variant="secondary">{recentUploadMetrics.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monitoring</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {uploadResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadResults.slice(-5).reverse().map((upload, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{upload.type}</span>
                      <span className="text-muted-foreground">
                        {new Date(upload.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Examples */}
      <Tabs defaultValue="specialized" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specialized">Specialized Uploads</TabsTrigger>
          <TabsTrigger value="generic">Generic Upload</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Examples</TabsTrigger>
        </TabsList>

        {/* Specialized Upload Components */}
        <TabsContent value="specialized" className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Specialized Upload Components</AlertTitle>
            <AlertDescription>
              Pre-configured upload components for common use cases with automatic monitoring.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AvatarUpload 
              onUploadComplete={handleUploadComplete('Avatar')}
              onUploadError={handleUploadError('Avatar')}
            />
            
            <LogoUpload 
              onUploadComplete={handleUploadComplete('Logo')}
              onUploadError={handleUploadError('Logo')}
            />
            
            <ImageUpload 
              onUploadComplete={handleUploadComplete('Image')}
              onUploadError={handleUploadError('Image')}
            />
            
            <DocumentUpload 
              onUploadComplete={handleUploadComplete('Document')}
              onUploadError={handleUploadError('Document')}
            />
            
            <ReportUpload 
              onUploadComplete={handleUploadComplete('Report')}
              onUploadError={handleUploadError('Report')}
            />
          </div>
        </TabsContent>

        {/* Generic Upload Component */}
        <TabsContent value="generic" className="space-y-6">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertTitle>Generic Upload Component</AlertTitle>
            <AlertDescription>
              Configurable upload component that can be customized for any bucket and upload type.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MonitoredFileUpload
              bucket="uploads"
              uploadType="other"
              accept="*/*"
              maxSize={100 * 1024 * 1024} // 100MB
              onUploadComplete={handleUploadComplete('Generic File')}
              onUploadError={handleUploadError('Generic File')}
            />
            
            <MonitoredFileUpload
              bucket="profile"
              uploadType="image"
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              onUploadComplete={handleUploadComplete('Profile Image')}
              onUploadError={handleUploadError('Profile Image')}
            />
          </div>
        </TabsContent>

        {/* Advanced Examples */}
        <TabsContent value="advanced" className="space-y-6">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Advanced Integration Examples</AlertTitle>
            <AlertDescription>
              Code examples showing different upload patterns and monitoring integration.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Example 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">A) Presigned PUT Upload</CardTitle>
                <CardDescription>Standard presigned URL upload with fetch</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`// Monitored presigned PUT upload
export const uploadAvatar = monitorUploadPerformance(
  'profile',
  'avatar',
  uploadWithPresignedPut
);

// Usage
await uploadAvatar(file, presignedUrl);`}
                </pre>
                <div className="mt-3 text-xs text-muted-foreground">
                  ✅ Automatic size detection from File object<br/>
                  ✅ Duration tracking<br/>
                  ✅ Error categorization
                </div>
              </CardContent>
            </Card>

            {/* Code Example 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">B) AWS SDK Direct Upload</CardTitle>
                <CardDescription>Direct S3 upload using AWS SDK</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`// Monitored AWS SDK upload
export const uploadDoc = monitorUploadPerformance(
  'uploads', 
  'document', 
  putObjectDirect
);

// Usage
await uploadDoc(buffer, 'docs/file.pdf', 'bucket');`}
                </pre>
                <div className="mt-3 text-xs text-muted-foreground">
                  ✅ Buffer/Blob size detection<br/>
                  ✅ CloudWatch metrics<br/>
                  ✅ Performance tracking
                </div>
              </CardContent>
            </Card>

            {/* Code Example 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">C) Multipart Upload</CardTitle>
                <CardDescription>Large file upload with custom size extractor</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`// Monitored multipart upload
export const uploadLarge = monitorUploadPerformance(
  'uploads',
  'document',
  multipartUpload,
  {
    sizeExtractor: (args, result) => {
      return result?.uploadedSize || 
             args.find(a => a instanceof File)?.size;
    }
  }
);`}
                </pre>
                <div className="mt-3 text-xs text-muted-foreground">
                  ✅ Custom size extraction<br/>
                  ✅ Multipart progress tracking<br/>
                  ✅ Large file optimization
                </div>
              </CardContent>
            </Card>

            {/* Code Example 4 - Edge Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">D) Manual Size (Edge Cases)</CardTitle>
                <CardDescription>Upload with known size for streams/unknown data</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`// Upload with manual size specification
export const uploadOther = monitorUploadPerformance(
  'uploads',
  'other',
  uploadUnknown
);

// Usage with known size
await uploadOther(stream, { fileSizeBytes: knownSize });`}
                </pre>
                <div className="mt-3 text-xs text-muted-foreground">
                  ✅ Manual size specification<br/>
                  ✅ Stream upload support<br/>
                  ✅ Attempted size tracking
                </div>
              </CardContent>
            </Card>

            {/* Metrics Example */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CloudWatch Metrics</CardTitle>
                <CardDescription>Automatically published metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>UPLOAD_SUCCESS</span>
                    <Badge variant="outline">Count</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>UPLOAD_FAILURE</span>
                    <Badge variant="outline">Count</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>UPLOAD_DURATION</span>
                    <Badge variant="outline">Milliseconds</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>UPLOAD_SIZE</span>
                    <Badge variant="outline">Bytes</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>UploadAttemptSize</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">Bytes</Badge>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Namespace: Matbakh/S3Upload<br/>
                  Dimensions: Bucket, UploadType, ErrorType<br/>
                  <span className="text-blue-600">New: UploadAttemptSize tracks intended size even on failures</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
          <CardDescription>
            How to integrate monitored uploads into your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">1. Import the Service</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`import { uploadService } from '@/services/monitored-upload-service';`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Use Monitored Methods</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`await uploadService.uploadAvatar(file, url);`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. View Metrics</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`// CloudWatch Namespace: Matbakh/S3Upload
// Automatic performance tracking`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Custom Integration</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
{`const myUpload = monitorUploadPerformance(
  'bucket', 'type', uploadFunction
);`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadMonitoringDemo;