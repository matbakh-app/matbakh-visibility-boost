/**
 * FileInput Component - General file upload with multiple file support and type filtering
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, FileText, Image, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useS3Upload, type UseS3UploadOptions } from '@/hooks/useS3Upload';
import { validateFile, generateFilePreview, formatFileSize, type BucketType } from '@/lib/s3-upload';

export interface FileInputProps {
  bucket: BucketType;
  folder?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  multiple?: boolean;
  maxFiles?: number;
  onUploadSuccess?: (fileUrl: string, result: any) => void;
  onUploadError?: (error: Error) => void;
  onFileSelect?: (files: File[]) => void;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  showFileList?: boolean;
  enableBulkActions?: boolean;
  autoUpload?: boolean; // Upload immediately after selection
}

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  selected: boolean;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <Image className="h-5 w-5" />;
  }
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) {
    return <FileText className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
};

const getFileTypeColor = (fileType: string) => {
  if (fileType.startsWith('image/')) return 'bg-green-100 text-green-800';
  if (fileType.includes('pdf')) return 'bg-red-100 text-red-800';
  if (fileType.includes('document')) return 'bg-blue-100 text-blue-800';
  if (fileType.includes('text')) return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-800';
};

export const FileInput: React.FC<FileInputProps> = ({
  bucket,
  folder,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  multiple = false,
  maxFiles = 10,
  onUploadSuccess,
  onUploadError,
  onFileSelect,
  onFilesChange,
  className = '',
  disabled = false,
  placeholder = 'Drag and drop files here, or click to select',
  showFileList = true,
  enableBulkActions = true,
  autoUpload = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // S3 upload hook
  const uploadOptions: UseS3UploadOptions = {
    bucket,
    folder,
    enableRetry: true,
    maxRetries: 3,
    onSuccess: (result) => {
      onUploadSuccess?.(result.fileUrl, result);
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  };

  const { upload, uploadMultiple, isUploading, progress, error } = useS3Upload(uploadOptions);

  // Generate unique ID for file items
  const generateId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Validate files
  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    // Check total file count
    const totalFiles = fileItems.length + files.length;
    if (multiple && totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed. You're trying to add ${files.length} files to ${fileItems.length} existing files.`);
      return { valid: [], errors };
    }

    files.forEach((file) => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported. Allowed types: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds ${formatFileSize(maxSize)} limit`);
        return;
      }

      // Additional validation
      const validation = validateFile(file, maxSize);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        return;
      }

      // Check for duplicates
      const isDuplicate = fileItems.some(item => 
        item.file.name === file.name && 
        item.file.size === file.size &&
        item.file.lastModified === file.lastModified
      );
      
      if (isDuplicate) {
        errors.push(`${file.name}: File already selected`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  }, [acceptedTypes, maxSize, fileItems, multiple, maxFiles]);

  // Generate previews for files
  const generatePreviews = useCallback(async (files: File[]): Promise<{ file: File; preview?: string }[]> => {
    const previews: { file: File; preview?: string }[] = [];

    for (const file of files) {
      try {
        const previewData = await generateFilePreview(file);
        previews.push({ 
          file, 
          preview: previewData.type === 'image' ? previewData.preview : undefined 
        });
      } catch (error) {
        console.warn('Failed to generate preview for', file.name, error);
        previews.push({ file });
      }
    }

    return previews;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: File[]) => {
    const { valid, errors } = validateFiles(files);
    
    setValidationErrors(errors);
    
    if (valid.length === 0) return;

    // Generate previews
    const previews = await generatePreviews(valid);

    // Create file items
    const newFileItems: FileItem[] = previews.map(({ file, preview }) => ({
      id: generateId(),
      file,
      preview,
      selected: false,
      status: 'pending',
      progress: 0,
    }));

    // Update file items
    if (multiple) {
      setFileItems(prev => [...prev, ...newFileItems]);
    } else {
      setFileItems(newFileItems);
    }

    // Notify parent components
    const allFiles = multiple ? [...fileItems.map(item => item.file), ...valid] : valid;
    onFileSelect?.(valid);
    onFilesChange?.(allFiles);

    // Auto upload if enabled
    if (autoUpload) {
      setTimeout(() => {
        if (valid.length === 1) {
          handleUploadFile(newFileItems[0].id);
        } else {
          handleUploadSelected(newFileItems.map(item => item.id));
        }
      }, 100);
    }
  }, [validateFiles, generatePreviews, generateId, multiple, fileItems, onFileSelect, onFilesChange, autoUpload]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  }, [handleFileSelect]);

  // Handle click to select files
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Remove file from selection
  const removeFile = useCallback((id: string) => {
    setFileItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      onFilesChange?.(newItems.map(item => item.file));
      return newItems;
    });
    setValidationErrors([]);
  }, [onFilesChange]);

  // Toggle file selection
  const toggleFileSelection = useCallback((id: string) => {
    setFileItems(prev => {
      const newItems = prev.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      );
      setSelectedCount(newItems.filter(item => item.selected).length);
      return newItems;
    });
  }, []);

  // Select all files
  const selectAll = useCallback(() => {
    setFileItems(prev => {
      const newItems = prev.map(item => ({ ...item, selected: true }));
      setSelectedCount(newItems.length);
      return newItems;
    });
  }, []);

  // Deselect all files
  const deselectAll = useCallback(() => {
    setFileItems(prev => {
      const newItems = prev.map(item => ({ ...item, selected: false }));
      setSelectedCount(0);
      return newItems;
    });
  }, []);

  // Remove selected files
  const removeSelected = useCallback(() => {
    setFileItems(prev => {
      const newItems = prev.filter(item => !item.selected);
      onFilesChange?.(newItems.map(item => item.file));
      setSelectedCount(0);
      return newItems;
    });
  }, [onFilesChange]);

  // Upload single file
  const handleUploadFile = useCallback(async (id: string) => {
    const fileItem = fileItems.find(item => item.id === id);
    if (!fileItem) return;

    // Update status to uploading
    setFileItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'uploading', progress: 0 } : item
    ));

    try {
      const result = await upload(fileItem.file, {
        onProgress: (progress) => {
          setFileItems(prev => prev.map(item => 
            item.id === id ? { ...item, progress } : item
          ));
        },
      });

      // Update status to completed
      setFileItems(prev => prev.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'completed', 
          progress: 100, 
          result 
        } : item
      ));

    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      
      // Update status to error
      setFileItems(prev => prev.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'error', 
          error: errorMessage 
        } : item
      ));
    }
  }, [fileItems, upload]);

  // Upload selected files
  const handleUploadSelected = useCallback(async (ids?: string[]) => {
    const targetIds = ids || fileItems.filter(item => item.selected).map(item => item.id);
    const targetFiles = fileItems.filter(item => targetIds.includes(item.id));
    
    if (targetFiles.length === 0) return;

    // Update status to uploading for all target files
    setFileItems(prev => prev.map(item => 
      targetIds.includes(item.id) ? { ...item, status: 'uploading', progress: 0 } : item
    ));

    try {
      if (targetFiles.length === 1) {
        await handleUploadFile(targetFiles[0].id);
      } else {
        // Upload multiple files
        const files = targetFiles.map(item => item.file);
        await uploadMultiple(files, {
          onProgress: (progress) => {
            // Update progress for all uploading files
            setFileItems(prev => prev.map(item => 
              targetIds.includes(item.id) ? { ...item, progress } : item
            ));
          },
        });

        // Mark all as completed
        setFileItems(prev => prev.map(item => 
          targetIds.includes(item.id) ? { 
            ...item, 
            status: 'completed', 
            progress: 100 
          } : item
        ));
      }

      // Deselect uploaded files
      setFileItems(prev => prev.map(item => 
        targetIds.includes(item.id) ? { ...item, selected: false } : item
      ));
      setSelectedCount(0);

    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      
      // Update status to error for all target files
      setFileItems(prev => prev.map(item => 
        targetIds.includes(item.id) ? { 
          ...item, 
          status: 'error', 
          error: errorMessage 
        } : item
      ));
    }
  }, [fileItems, handleUploadFile, uploadMultiple]);

  // Upload all files
  const handleUploadAll = useCallback(() => {
    const pendingIds = fileItems.filter(item => item.status === 'pending').map(item => item.id);
    handleUploadSelected(pendingIds);
  }, [fileItems, handleUploadSelected]);

  const pendingFiles = fileItems.filter(item => item.status === 'pending');
  const uploadingFiles = fileItems.filter(item => item.status === 'uploading');
  const completedFiles = fileItems.filter(item => item.status === 'completed');
  const errorFiles = fileItems.filter(item => item.status === 'error');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`
          relative cursor-pointer transition-all duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              {isUploading ? (
                <Upload className="w-full h-full animate-pulse" />
              ) : (
                <File className="w-full h-full" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading...' : placeholder}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {multiple ? `Select up to ${maxFiles} files` : 'Select a file'} up to {formatFileSize(maxSize)} each
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: {acceptedTypes.map(type => type.split('/')[1] ?? 'unknown').join(', ')}
              </p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {showFileList && fileItems.length > 0 && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          {enableBulkActions && multiple && fileItems.length > 1 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedCount === fileItems.length}
                    onCheckedChange={(checked) => {
                      if (checked) selectAll();
                      else deselectAll();
                    }}
                  />
                  <span className="text-sm text-gray-700">
                    {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                  </span>
                </div>

                {selectedCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadSelected()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeSelected}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Selected
                    </Button>
                  </div>
                )}
              </div>

              {pendingFiles.length > 0 && (
                <Button
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All ({pendingFiles.length})
                </Button>
              )}
            </div>
          )}

          {/* Status Summary */}
          {fileItems.length > 1 && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Total: {fileItems.length}</span>
              {pendingFiles.length > 0 && <Badge variant="secondary">Pending: {pendingFiles.length}</Badge>}
              {uploadingFiles.length > 0 && <Badge variant="default">Uploading: {uploadingFiles.length}</Badge>}
              {completedFiles.length > 0 && <Badge variant="default" className="bg-green-100 text-green-800">Completed: {completedFiles.length}</Badge>}
              {errorFiles.length > 0 && <Badge variant="destructive">Failed: {errorFiles.length}</Badge>}
            </div>
          )}

          {/* File Items */}
          <div className="space-y-2">
            {fileItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Selection checkbox */}
                  {enableBulkActions && multiple && (
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleFileSelection(item.id)}
                      disabled={isUploading}
                    />
                  )}

                  {/* File preview/icon */}
                  <div className="flex-shrink-0">
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        {getFileIcon(item.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.file.name}
                      </p>
                      <Badge className={getFileTypeColor(item.file.type)}>
                        {(item.file.type.split('/')[1] ?? 'BIN').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(item.file.size)}
                    </p>

                    {/* Progress bar */}
                    {item.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={item.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(item.progress)}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === 'error' && item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>

                  {/* Status and actions */}
                  <div className="flex items-center space-x-2">
                    {item.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadFile(item.id)}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}

                    {item.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    )}

                    {item.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadFile(item.id)}
                        disabled={isUploading}
                      >
                        Retry
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(item.id)}
                      disabled={isUploading && item.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileInput;