/**
 * File Preview Modal - Advanced file preview for different file types
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Copy,
  FileText, Image as ImageIcon, File, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { formatFileSize } from '@/lib/s3-upload';

export interface FilePreviewItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate?: Date;
}

export interface FilePreviewModalProps {
  files: FilePreviewItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (file: FilePreviewItem) => void;
  onDelete?: (file: FilePreviewItem) => void;
  onNavigate?: (index: number) => void;
}

const ImagePreview: React.FC<{
  src: string;
  alt: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, onLoad, onError }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  return (
    <div 
      className="relative w-full h-full bg-gray-900 overflow-hidden" 
      aria-label="Image viewer"
      aria-busy={isDragging || scale !== 1}
    >
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="bg-black bg-opacity-50 rounded-lg p-2 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(prev => Math.max(0.1, prev - 0.2))}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="w-24">
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={0.1}
              max={5}
              step={0.1}
              className="text-white"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(prev => Math.min(5, prev + 0.2))}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation(prev => prev + 90)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            Reset
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Image */}
      <div 
        className={`flex items-center justify-center w-full h-full ${scale > 1 ? 'cursor-move' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          onLoad={onLoad}
          onError={onError}
          draggable={false}
        />
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

const PDFPreview: React.FC<{
  src: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, onLoad, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Cannot preview PDF</p>
        <p className="text-sm">Click download to view the file</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading PDF...</span>
        </div>
      )}
      
      <iframe
        src={`${src}#toolbar=1&navpanes=1&scrollbar=1`}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        title="PDF Preview"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};

const TextPreview: React.FC<{
  src: string;
  fileName: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, fileName, onLoad, onError }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const response = await fetch(src);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const text = await response.text();
        setContent(text);
        onLoad?.();
      } catch (error) {
        setHasError(true);
        onError?.();
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [src, onLoad, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="sr-only">Loading file content...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Cannot preview file</p>
        <p className="text-sm">Click download to view the file</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 bg-white overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 pb-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{fileName}</h3>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
};

const UnsupportedPreview: React.FC<{
  file: FilePreviewItem;
}> = ({ file }) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-16 w-16" />;
    if (file.type.includes('pdf')) return <FileText className="h-16 w-16" />;
    return <File className="h-16 w-16" />;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      {getFileIcon()}
      <p className="text-lg font-medium mt-4">Preview not available</p>
      <p className="text-sm">File type: {file.type}</p>
      <p className="text-sm">Size: {formatFileSize(file.size)}</p>
      <p className="text-sm mt-2">Click download to view the file</p>
    </div>
  );
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  files,
  currentIndex,
  isOpen,
  onClose,
  onDownload,
  onDelete,
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const currentFile = files[currentIndex];

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate?.(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < files.length - 1) {
      onNavigate?.(currentIndex + 1);
    }
  }, [currentIndex, files.length, onNavigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [isOpen, handlePrevious, handleNext, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const copyUrl = useCallback(async () => {
    if (currentFile) {
      // For private files, generate secure URL if available
      // TODO: Integrate with useS3FileAccess for secure URLs
      try {
        await navigator.clipboard.writeText(currentFile.url);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  }, [currentFile]);

  const openInNewTab = useCallback(() => {
    if (currentFile) {
      // For private files, use secure URL if available
      // TODO: Integrate with useS3FileAccess for secure URLs
      window.open(currentFile.url, '_blank', 'noopener,noreferrer');
    }
  }, [currentFile]);

  if (!currentFile) return null;

  const isImage = currentFile.type.startsWith('image/');
  const isPDF = currentFile.type.includes('pdf');
  const isText = currentFile.type.startsWith('text/') || 
                 currentFile.type.includes('json') || 
                 currentFile.type.includes('xml');

  const renderPreview = () => {
    if (isImage) {
      return (
        <ImagePreview
          src={currentFile.url}
          alt={currentFile.name}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      );
    }

    if (isPDF) {
      return (
        <PDFPreview
          src={currentFile.url}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      );
    }

    if (isText) {
      return (
        <TextPreview
          src={currentFile.url}
          fileName={currentFile.name}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      );
    }

    return <UnsupportedPreview file={currentFile} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DialogTitle className="text-lg font-medium truncate">
                {currentFile.name}
              </DialogTitle>
              <Badge variant="secondary">
                {(currentFile.type.split('/')[1] ?? 'BIN').toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatFileSize(currentFile.size)}
              </span>
              {currentFile.uploadDate && (
                <span className="text-sm text-gray-500">
                  {currentFile.uploadDate.toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {files.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-500">
                    {currentIndex + 1} of {files.length}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === files.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={copyUrl} aria-label="Copy file URL">
                <Copy className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={openInNewTab} aria-label="Open in new tab">
                <ExternalLink className="h-4 w-4" />
              </Button>

              {onDownload && (
                <Button variant="ghost" size="sm" onClick={() => onDownload(currentFile)} aria-label="Download file">
                  <Download className="h-4 w-4" />
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;