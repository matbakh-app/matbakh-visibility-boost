/**
 * ImageUpload Component - Drag-and-drop image upload with preview and cropping
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, RotateCw, ZoomIn, ZoomOut, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useS3Upload, type UseS3UploadOptions } from '@/hooks/useS3Upload';
import { validateFile, generateFilePreview, formatFileSize, type BucketType } from '@/lib/s3-upload';

export interface ImageUploadProps {
  bucket: BucketType;
  folder?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  enableCropping?: boolean;
  enableCompression?: boolean;
  cropAspectRatio?: number; // width/height ratio, e.g., 1 for square, 16/9 for widescreen
  maxWidth?: number;
  maxHeight?: number;
  onUploadSuccess?: (fileUrl: string, result: any) => void;
  onUploadError?: (error: Error) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  originalFile: File;
}

// Image Cropper Component
const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  aspectRatio,
  onCropComplete,
  onCancel,
  originalFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      const containerWidth = img.clientWidth;
      const containerHeight = img.clientHeight;
      
      let cropWidth = Math.min(containerWidth * 0.8, 300);
      let cropHeight = cropWidth;
      
      if (aspectRatio) {
        cropHeight = cropWidth / aspectRatio;
      }
      
      setCropArea({
        x: (containerWidth - cropWidth) / 2,
        y: (containerHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [aspectRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, rect.width - cropArea.width));
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, rect.height - cropArea.height));

    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, cropArea.width, cropArea.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Set canvas size to crop area
    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw cropped image
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], originalFile.name, {
          type: originalFile.type,
          lastModified: Date.now(),
        });
        onCropComplete(croppedFile);
      }
    }, originalFile.type, 0.9);
  }, [cropArea, rotation, scale, originalFile, onCropComplete]);

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          className="max-w-full max-h-96 object-contain"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Crop overlay */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Crop handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize" />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation(prev => prev + 90)}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rotate
          </Button>
          
          <div className="flex items-center space-x-2">
            <ZoomOut className="h-4 w-4" />
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={0.5}
              max={3}
              step={0.1}
              className="w-24"
            />
            <ZoomIn className="h-4 w-4" />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  bucket,
  folder,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  enableCropping = false,
  enableCompression = true,
  cropAspectRatio,
  maxWidth,
  maxHeight,
  onUploadSuccess,
  onUploadError,
  onFileSelect,
  className = '',
  disabled = false,
  multiple = false,
  placeholder = 'Drag and drop images here, or click to select',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [currentCropFile, setCurrentCropFile] = useState<{ file: File; preview: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
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

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(({ preview }) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previews]);

  // Validate files
  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported. Allowed types: ${acceptedTypes.join(', ')}`);
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

      valid.push(file);
    });

    return { valid, errors };
  }, [acceptedTypes, maxSize]);

  // Generate previews for selected files
  const generatePreviews = useCallback(async (files: File[]) => {
    // Clean up existing previews to prevent memory leaks
    previews.forEach(({ preview }) => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });

    const newPreviews: { file: File; preview: string }[] = [];

    for (const file of files) {
      try {
        const previewData = await generateFilePreview(file);
        if (previewData.preview) {
          newPreviews.push({ file, preview: previewData.preview });
        }
      } catch (error) {
        console.warn('Failed to generate preview for', file.name, error);
      }
    }

    setPreviews(newPreviews);
  }, [previews]);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: File[]) => {
    const { valid, errors } = validateFiles(files);
    
    setValidationErrors(errors);
    
    if (valid.length === 0) return;

    setSelectedFiles(valid);
    await generatePreviews(valid);

    // Notify parent component
    valid.forEach(file => onFileSelect?.(file));

    // If cropping is enabled and we have a single image, show cropper
    if (enableCropping && valid.length === 1) {
      const previewData = await generateFilePreview(valid[0]);
      if (previewData.preview) {
        setCurrentCropFile({ file: valid[0], preview: previewData.preview });
        setShowCropper(true);
      }
    }
  }, [validateFiles, generatePreviews, onFileSelect, enableCropping]);

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
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setValidationErrors([]);
  }, []);

  // Handle crop completion
  const handleCropComplete = useCallback((croppedFile: File) => {
    setSelectedFiles([croppedFile]);
    generatePreviews([croppedFile]);
    setShowCropper(false);
    setCurrentCropFile(null);
  }, [generatePreviews]);

  // Handle crop cancellation
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setCurrentCropFile(null);
  }, []);

  // Start upload
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      if (multiple && selectedFiles.length > 1) {
        await uploadMultiple(selectedFiles);
      } else {
        await upload(selectedFiles[0]);
      }
      
      // Clear selection after successful upload
      setSelectedFiles([]);
      setPreviews([]);
      setValidationErrors([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (uploadError) {
      console.error('Upload failed:', uploadError);
    }
  }, [selectedFiles, multiple, upload, uploadMultiple]);

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
                <ImageIcon className="w-full h-full" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading...' : placeholder}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {multiple ? 'Select multiple images' : 'Select an image'} up to {formatFileSize(maxSize)}
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

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Selected Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((item, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* File info */}
                <div className="mt-2 text-xs text-gray-600">
                  <p className="truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p>{formatFileSize(item.file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="min-w-24"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Images` : 'Image'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Image Cropper Dialog */}
      {showCropper && currentCropFile && (
        <Dialog open={showCropper} onOpenChange={setShowCropper}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            
            <ImageCropper
              imageSrc={currentCropFile.preview}
              aspectRatio={cropAspectRatio}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              originalFile={currentCropFile.file}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ImageUpload;