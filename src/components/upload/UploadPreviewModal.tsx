/**
 * Upload Preview Modal
 * Modal component for previewing uploaded files
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  File,
  RefreshCw,
  Shield,
  Clock,
  Hash,
} from 'lucide-react';
import { formatFileSize, formatDistanceToNow } from '@/lib/utils';
import { UploadRecord } from './UploadManagementDashboard';

interface UploadPreviewModalProps {
  upload: UploadRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadPreviewModal: React.FC<UploadPreviewModalProps> = ({
  upload,
  open,
  onOpenChange,
}) => {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load preview when modal opens
  useEffect(() => {
    if (open && upload.metadata?.previewUrl) {
      setPreviewUrl(upload.metadata.previewUrl);
    } else if (open && upload.contentType.startsWith('image/')) {
      // For images without cached preview, try to generate one
      generatePreview();
    }
  }, [open, upload]);

  const generatePreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // Call secure preview service
      const response = await fetch('/api/preview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          fileUrl: upload.s3Url,
          userId: 'current-user', // Would come from auth context
          previewType: 'preview',
          options: {
            width: 800,
            height: 600,
            quality: 85,
            watermark: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Preview generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPreviewUrl(result.previewUrl);
      } else {
        setPreviewError(result.error || 'Preview generation failed');
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = upload.s3Url;
    link.download = upload.originalFilename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = () => {
    if (upload.contentType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    } else if (upload.contentType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusIcon = () => {
    switch (upload.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'corrupted':
      case 'quarantined':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      case 'uploading':
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating secure preview...</p>
          </div>
        </div>
      );
    }

    if (previewError) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview unavailable: {previewError}
          </AlertDescription>
        </Alert>
      );
    }

    if (previewUrl) {
      return (
        <div className="relative">
          <img
            src={previewUrl}
            alt={upload.filename}
            className="w-full h-auto max-h-96 object-contain rounded-lg border"
            onError={() => setPreviewError('Failed to load preview image')}
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              SECURE PREVIEW
            </Badge>
          </div>
        </div>
      );
    }

    if (upload.contentType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Image preview not available</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={generatePreview}
            >
              Generate Preview
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          {getFileIcon()}
          <p className="text-sm text-muted-foreground mt-2">
            Preview not available for this file type
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getFileIcon()}
            <span className="truncate">{upload.filename}</span>
          </DialogTitle>
          <DialogDescription>
            File details and secure preview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium">Status:</span>
              <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(upload.s3Url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          </div>

          {/* Error Details */}
          {upload.metadata?.errorDetails && upload.metadata.errorDetails.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {upload.metadata.errorDetails.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            {renderPreview()}
          </div>

          {/* File Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">File Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Name:</span>
                  <span className="font-mono text-right">{upload.originalFilename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size:</span>
                  <span>{formatFileSize(upload.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content Type:</span>
                  <span className="font-mono">{upload.contentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload Type:</span>
                  <Badge variant="outline">{upload.uploadType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span>{formatDistanceToNow(new Date(upload.uploadedAt))} ago</span>
                </div>
                {upload.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDistanceToNow(new Date(upload.expiresAt))}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Security & Integrity</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Integrity Verified:</span>
                  <div className="flex items-center space-x-1">
                    {upload.metadata?.integrityVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                
                {upload.metadata?.checksum && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Checksum:</span>
                    <div className="flex items-center space-x-1">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono text-xs">
                        {upload.metadata.checksum.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Public Access:</span>
                  <Badge variant={upload.isPublic ? 'default' : 'secondary'}>
                    {upload.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage Location:</span>
                  <span className="font-mono text-xs">{upload.s3Bucket}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This file has been scanned for security threats and stored securely. 
              All previews are generated in a sandboxed environment with watermarks for security.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};