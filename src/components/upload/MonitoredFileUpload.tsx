/**
 * Monitored File Upload Component
 * 
 * React component that demonstrates integration with the monitored upload service.
 * All uploads are automatically tracked with performance monitoring.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Image, 
  User, 
  Building 
} from 'lucide-react';
import { uploadService, type UploadBucket, type UploadType } from '@/services/monitored-upload-service';
import { usePerformanceMonitoringContext } from '@/components/analytics/PerformanceMonitoringProvider';

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

interface MonitoredFileUploadProps {
  bucket: UploadBucket;
  uploadType: UploadType;
  accept?: string;
  maxSize?: number;
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export const MonitoredFileUpload: React.FC<MonitoredFileUploadProps> = ({
  bucket,
  uploadType,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUploadComplete,
  onUploadError,
  className = ""
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });
  
  const { recordMetric } = usePerformanceMonitoringContext();

  // Simulate getting presigned URL (replace with actual implementation)
  const getPresignedUrl = useCallback(async (file: File): Promise<string> => {
    // Record custom metric for presigned URL request
    const startTime = performance.now();
    
    try {
      // Simulate API call to get presigned URL
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const duration = performance.now() - startTime;
      await recordMetric('presigned_url_request', duration, 'good');
      
      return `https://example-bucket.s3.amazonaws.com/${file.name}?presigned=true`;
    } catch (error) {
      const duration = performance.now() - startTime;
      await recordMetric('presigned_url_request', duration, 'poor');
      throw error;
    }
  }, [recordMetric]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const error = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB > ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      setUploadState({ status: 'error', progress: 0, error });
      onUploadError?.(error);
      return;
    }

    setUploadState({ status: 'uploading', progress: 0 });

    try {
      // Get presigned URL
      setUploadState(prev => ({ ...prev, progress: 10 }));
      const presignedUrl = await getPresignedUrl(file);
      
      setUploadState(prev => ({ ...prev, progress: 20 }));

      // Perform monitored upload based on type
      let result;
      
      switch (uploadType) {
        case 'avatar':
          result = await uploadService.uploadAvatar(file, presignedUrl);
          break;
        case 'logo':
          result = await uploadService.uploadLogo(file, presignedUrl);
          break;
        case 'image':
          result = await uploadService.uploadImage(file, presignedUrl);
          break;
        case 'document':
          if (file.size > 50 * 1024 * 1024) { // Use multipart for large files
            result = await uploadService.uploadLargeFile(file, file.name);
          } else {
            result = await uploadService.uploadDocument(file, presignedUrl);
          }
          break;
        case 'report':
          result = await uploadService.uploadReportDirect(
            await file.arrayBuffer(), 
            file.name, 
            'reports-bucket'
          );
          break;
        default:
          result = await uploadService.uploadDocument(file, presignedUrl);
      }

      setUploadState({ 
        status: 'success', 
        progress: 100, 
        result 
      });
      
      onUploadComplete?.(result);

      // Record successful upload metric
      await recordMetric('upload_completed', 1, 'good');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: errorMessage 
      });
      
      onUploadError?.(errorMessage);

      // Record failed upload metric
      await recordMetric('upload_failed', 1, 'poor');
    }

    // Reset file input
    event.target.value = '';
  }, [bucket, uploadType, maxSize, getPresignedUrl, onUploadComplete, onUploadError, recordMetric]);

  const getUploadIcon = () => {
    switch (uploadType) {
      case 'avatar': return <User className="h-5 w-5" />;
      case 'logo': return <Building className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'document':
      case 'report':
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getUploadLabel = () => {
    switch (uploadType) {
      case 'avatar': return 'Upload Avatar';
      case 'logo': return 'Upload Logo';
      case 'image': return 'Upload Image';
      case 'document': return 'Upload Document';
      case 'report': return 'Upload Report';
      default: return 'Upload File';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getUploadIcon()}
          <span>{getUploadLabel()}</span>
          <Badge variant="outline">{bucket}</Badge>
        </CardTitle>
        <CardDescription>
          Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB • 
          Monitored upload with performance tracking
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {accept === "*/*" ? "Any file type" : accept}
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept={accept}
              onChange={handleFileSelect}
              disabled={uploadState.status === 'uploading'}
            />
          </label>
        </div>

        {/* Progress Bar */}
        {uploadState.status === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadState.progress}%</span>
            </div>
            <Progress value={uploadState.progress} className="w-full" />
          </div>
        )}

        {/* Success State */}
        {uploadState.status === 'success' && uploadState.result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Upload successful! File uploaded to: {uploadState.result.key}
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {uploadState.status === 'error' && uploadState.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {uploadState.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Bucket: {bucket} • Type: {uploadType}</div>
          <div>Performance monitoring: ✅ Enabled</div>
          <div>Metrics: Upload duration, file size, success/failure rates</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Specialized upload components
export const AvatarUpload: React.FC<Omit<MonitoredFileUploadProps, 'bucket' | 'uploadType'>> = (props) => (
  <MonitoredFileUpload 
    {...props} 
    bucket="profile" 
    uploadType="avatar" 
    accept="image/*"
    maxSize={5 * 1024 * 1024} // 5MB for avatars
  />
);

export const LogoUpload: React.FC<Omit<MonitoredFileUploadProps, 'bucket' | 'uploadType'>> = (props) => (
  <MonitoredFileUpload 
    {...props} 
    bucket="profile" 
    uploadType="logo" 
    accept="image/*"
    maxSize={2 * 1024 * 1024} // 2MB for logos
  />
);

export const DocumentUpload: React.FC<Omit<MonitoredFileUploadProps, 'bucket' | 'uploadType'>> = (props) => (
  <MonitoredFileUpload 
    {...props} 
    bucket="uploads" 
    uploadType="document" 
    accept=".pdf,.doc,.docx,.txt"
    maxSize={50 * 1024 * 1024} // 50MB for documents
  />
);

export const ImageUpload: React.FC<Omit<MonitoredFileUploadProps, 'bucket' | 'uploadType'>> = (props) => (
  <MonitoredFileUpload 
    {...props} 
    bucket="uploads" 
    uploadType="image" 
    accept="image/*"
    maxSize={10 * 1024 * 1024} // 10MB for images
  />
);

export const ReportUpload: React.FC<Omit<MonitoredFileUploadProps, 'bucket' | 'uploadType'>> = (props) => (
  <MonitoredFileUpload 
    {...props} 
    bucket="reports" 
    uploadType="report" 
    accept=".pdf,.xlsx,.csv"
    maxSize={25 * 1024 * 1024} // 25MB for reports
  />
);

export default MonitoredFileUpload;