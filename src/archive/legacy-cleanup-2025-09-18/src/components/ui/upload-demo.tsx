/**
 * Upload Demo Component - Comprehensive example of all S3 upload components
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ImageUpload, 
  FileInput, 
  UploadHistory, 
  BulkUploadManager,
  FilePreviewModal,
  type UploadHistoryItem,
  type BulkUploadItem,
  type FilePreviewItem
} from '@/components/ui/upload';
import { type BucketType } from '@/lib/s3-upload';

export const UploadDemo: React.FC = () => {
  // State for different upload scenarios
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUploadItem[]>([]);
  const [previewFiles, setPreviewFiles] = useState<FilePreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Handle successful uploads
  const handleUploadSuccess = useCallback((fileUrl: string, result: any, fileName: string, fileSize: number, fileType: string) => {
    const newHistoryItem: UploadHistoryItem = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName,
      fileSize,
      fileType,
      fileUrl,
      uploadDate: new Date(),
      status: 'completed',
      bucket: 'matbakh-files-uploads',
    };

    setUploadHistory(prev => [newHistoryItem, ...prev]);

    // Add to preview files if it's a previewable type
    if (fileType.startsWith('image/') || fileType.includes('pdf') || fileType.startsWith('text/')) {
      const previewItem: FilePreviewItem = {
        id: newHistoryItem.id,
        name: fileName,
        size: fileSize,
        type: fileType,
        url: fileUrl,
        uploadDate: new Date(),
      };
      setPreviewFiles(prev => [previewItem, ...prev]);
    }
  }, []);

  // Handle upload errors
  const handleUploadError = useCallback((error: Error, fileName?: string) => {
    console.error('Upload failed:', error);
    
    if (fileName) {
      const errorHistoryItem: UploadHistoryItem = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        fileSize: 0,
        fileType: 'unknown',
        fileUrl: '',
        uploadDate: new Date(),
        status: 'error',
        bucket: 'matbakh-files-uploads',
        error: error.message,
      };
      setUploadHistory(prev => [errorHistoryItem, ...prev]);
    }
  }, []);

  // Handle file preview
  const handleFileView = useCallback((item: UploadHistoryItem) => {
    const previewItem: FilePreviewItem = {
      id: item.id,
      name: item.fileName,
      size: item.fileSize,
      type: item.fileType,
      url: item.fileUrl,
      uploadDate: item.uploadDate,
    };

    const existingIndex = previewFiles.findIndex(f => f.id === item.id);
    if (existingIndex >= 0) {
      setPreviewIndex(existingIndex);
    } else {
      setPreviewFiles(prev => [previewItem, ...prev]);
      setPreviewIndex(0);
    }
    setShowPreview(true);
  }, [previewFiles]);

  // Handle file download
  const handleFileDownload = useCallback((item: UploadHistoryItem) => {
    const link = document.createElement('a');
    link.href = item.fileUrl;
    link.download = item.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Handle file deletion
  const handleFileDelete = useCallback((item: UploadHistoryItem) => {
    setUploadHistory(prev => prev.filter(h => h.id !== item.id));
    setPreviewFiles(prev => prev.filter(f => f.id !== item.id));
  }, []);

  // Generate sample data for demo
  const generateSampleHistory = useCallback(() => {
    const sampleItems: UploadHistoryItem[] = [
      {
        id: 'sample_1',
        fileName: 'restaurant-photo.jpg',
        fileSize: 2048576, // 2MB
        fileType: 'image/jpeg',
        fileUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        uploadDate: new Date(Date.now() - 86400000), // 1 day ago
        status: 'completed',
        bucket: 'matbakh-files-profile',
      },
      {
        id: 'sample_2',
        fileName: 'menu.pdf',
        fileSize: 1024000, // 1MB
        fileType: 'application/pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadDate: new Date(Date.now() - 172800000), // 2 days ago
        status: 'completed',
        bucket: 'matbakh-files-uploads',
      },
      {
        id: 'sample_3',
        fileName: 'failed-upload.jpg',
        fileSize: 5242880, // 5MB
        fileType: 'image/jpeg',
        fileUrl: '',
        uploadDate: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'error',
        bucket: 'matbakh-files-uploads',
        error: 'File size exceeds limit',
      },
    ];

    setUploadHistory(prev => [...sampleItems, ...prev]);
    
    // Add previewable items to preview files
    const previewableItems = sampleItems
      .filter(item => item.status === 'completed' && (
        item.fileType.startsWith('image/') || 
        item.fileType.includes('pdf') || 
        item.fileType.startsWith('text/')
      ))
      .map(item => ({
        id: item.id,
        name: item.fileName,
        size: item.fileSize,
        type: item.fileType,
        url: item.fileUrl,
        uploadDate: item.uploadDate,
      }));

    setPreviewFiles(prev => [...previewableItems, ...prev]);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">S3 Upload Components Demo</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive demonstration of all S3 upload components and features
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {uploadHistory.length} uploads
          </Badge>
          <Button onClick={generateSampleHistory} variant="outline">
            Add Sample Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="image-upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="image-upload">Image Upload</TabsTrigger>
          <TabsTrigger value="file-upload">File Upload</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="upload-history">Upload History</TabsTrigger>
          <TabsTrigger value="file-preview">File Preview</TabsTrigger>
        </TabsList>

        {/* Image Upload Demo */}
        <TabsContent value="image-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Upload with Cropping</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="matbakh-files-profile"
                folder="demo/images"
                enableCropping={true}
                cropAspectRatio={1} // Square crop
                enableCompression={true}
                multiple={false}
                onUploadSuccess={(fileUrl, result) => {
                  handleUploadSuccess(fileUrl, result, 'uploaded-image.jpg', 1024000, 'image/jpeg');
                }}
                onUploadError={handleUploadError}
                placeholder="Upload restaurant photos, logos, or profile images"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multiple Image Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="matbakh-files-uploads"
                folder="demo/gallery"
                multiple={true}
                enableCropping={false}
                enableCompression={true}
                onUploadSuccess={(fileUrl, result) => {
                  handleUploadSuccess(fileUrl, result, 'gallery-image.jpg', 2048000, 'image/jpeg');
                }}
                onUploadError={handleUploadError}
                placeholder="Upload multiple images for your gallery"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload Demo */}
        <TabsContent value="file-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General File Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <FileInput
                bucket="matbakh-files-uploads"
                folder="demo/documents"
                multiple={true}
                maxFiles={5}
                acceptedTypes={[
                  'application/pdf',
                  'text/plain',
                  'text/csv',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]}
                onUploadSuccess={(fileUrl, result) => {
                  handleUploadSuccess(fileUrl, result, 'document.pdf', 1024000, 'application/pdf');
                }}
                onUploadError={handleUploadError}
                placeholder="Upload documents, PDFs, or text files"
                showFileList={true}
                enableBulkActions={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Upload File Input</CardTitle>
            </CardHeader>
            <CardContent>
              <FileInput
                bucket="matbakh-files-uploads"
                folder="demo/auto"
                multiple={false}
                autoUpload={true}
                onUploadSuccess={(fileUrl, result) => {
                  handleUploadSuccess(fileUrl, result, 'auto-uploaded.txt', 512000, 'text/plain');
                }}
                onUploadError={handleUploadError}
                placeholder="Files will upload automatically after selection"
                showFileList={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Demo */}
        <TabsContent value="bulk-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Manager</CardTitle>
            </CardHeader>
            <CardContent>
              {bulkUploads.length > 0 ? (
                <BulkUploadManager
                  uploads={bulkUploads}
                  onCancelUpload={(id) => {
                    setBulkUploads(prev => prev.map(upload => 
                      upload.id === id ? { ...upload, status: 'cancelled' } : upload
                    ));
                  }}
                  onRetryUpload={(id) => {
                    setBulkUploads(prev => prev.map(upload => 
                      upload.id === id ? { ...upload, status: 'pending', progress: 0 } : upload
                    ));
                  }}
                  onRemoveUpload={(id) => {
                    setBulkUploads(prev => prev.filter(upload => upload.id !== id));
                  }}
                  onCancelAll={() => {
                    setBulkUploads(prev => prev.map(upload => 
                      upload.status === 'uploading' || upload.status === 'pending'
                        ? { ...upload, status: 'cancelled' }
                        : upload
                    ));
                  }}
                  onClearCompleted={() => {
                    setBulkUploads(prev => prev.filter(upload => upload.status !== 'completed'));
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No bulk uploads in progress</p>
                  <p className="text-sm mt-2">Use the file upload components above to start bulk uploads</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload History Demo */}
        <TabsContent value="upload-history" className="space-y-4">
          <UploadHistory
            uploads={uploadHistory}
            onView={handleFileView}
            onDownload={handleFileDownload}
            onDelete={handleFileDelete}
            showFilters={true}
            maxItems={20}
          />
        </TabsContent>

        {/* File Preview Demo */}
        <TabsContent value="file-preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Preview Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {previewFiles.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewFiles.slice(0, 12).map((file, index) => (
                    <Card 
                      key={file.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setPreviewIndex(index);
                        setShowPreview(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={file.url} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400">
                              {file.type.includes('pdf') ? '📄' : '📁'}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.type.split('/')[1]?.toUpperCase()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No files available for preview</p>
                  <p className="text-sm mt-2">Upload some images or documents to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Preview Modal */}
      <FilePreviewModal
        files={previewFiles}
        currentIndex={previewIndex}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onNavigate={setPreviewIndex}
        onDownload={(file) => {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      />
    </div>
  );
};

export default UploadDemo;