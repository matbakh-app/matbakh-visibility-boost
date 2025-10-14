# S3 Upload Components

A comprehensive set of React components for handling file uploads to AWS S3 with advanced features like drag-and-drop, image cropping, progress tracking, and file management.

## Components Overview

### Core Upload Components

#### `ImageUpload`
Advanced image upload component with cropping, compression, and preview capabilities.

```tsx
import { ImageUpload } from '@/components/ui/upload';

<ImageUpload
  bucket="matbakh-files-profile"
  folder="avatars"
  enableCropping={true}
  cropAspectRatio={1} // Square crop
  enableCompression={true}
  onUploadSuccess={(fileUrl, result) => {
    console.log('Image uploaded:', fileUrl);
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error);
  }}
/>
```

**Features:**
- Drag-and-drop interface
- Image cropping with aspect ratio control
- Automatic image compression
- Real-time preview
- Progress tracking
- Validation (file type, size)

#### `FileInput`
General-purpose file upload component with support for multiple files and bulk operations.

```tsx
import { FileInput } from '@/components/ui/upload';

<FileInput
  bucket="matbakh-files-uploads"
  folder="documents"
  multiple={true}
  maxFiles={10}
  acceptedTypes={['application/pdf', 'text/plain', 'image/jpeg']}
  enableBulkActions={true}
  onUploadSuccess={(fileUrl, result) => {
    console.log('File uploaded:', fileUrl);
  }}
/>
```

**Features:**
- Multiple file selection
- File type filtering
- Bulk upload operations
- Upload queue management
- Progress tracking per file
- Auto-upload option

### Upload Management Components

#### `UploadHistory`
Display and manage previously uploaded files with filtering and search capabilities.

```tsx
import { UploadHistory } from '@/components/ui/upload';

<UploadHistory
  uploads={uploadHistoryItems}
  onView={(item) => openFilePreview(item)}
  onDownload={(item) => downloadFile(item)}
  onDelete={(item) => deleteFile(item)}
  showFilters={true}
  maxItems={50}
/>
```

#### `BulkUploadManager`
Advanced interface for managing multiple concurrent uploads.

```tsx
import { BulkUploadManager } from '@/components/ui/upload';

<BulkUploadManager
  uploads={bulkUploadItems}
  onCancelUpload={(id) => cancelUpload(id)}
  onRetryUpload={(id) => retryUpload(id)}
  onCancelAll={() => cancelAllUploads()}
  onClearCompleted={() => clearCompletedUploads()}
/>
```

#### `FilePreviewModal`
Full-screen file preview with support for images, PDFs, and text files.

```tsx
import { FilePreviewModal } from '@/components/ui/upload';

<FilePreviewModal
  files={previewableFiles}
  currentIndex={currentFileIndex}
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  onNavigate={setCurrentFileIndex}
  onDownload={(file) => downloadFile(file)}
/>
```

**Supported file types:**
- Images: JPEG, PNG, GIF, WebP, SVG
- Documents: PDF (with embedded viewer)
- Text files: TXT, JSON, XML, CSV
- Fallback for unsupported types

### Progress Components

#### `EnhancedUploadProgress`
Advanced upload progress indicator with pause/resume functionality.

```tsx
import { EnhancedUploadProgress } from '@/components/ui/upload';

<EnhancedUploadProgress
  fileName="document.pdf"
  fileSize={1024000}
  progress={75}
  status="uploading"
  onCancel={() => cancelUpload()}
  onPause={() => pauseUpload()}
  onResume={() => resumeUpload()}
  estimatedTimeRemaining={30}
  uploadSpeed={1024000} // bytes per second
/>
```

## Hooks

### `useS3Upload`
Main hook for handling S3 uploads with state management.

```tsx
import { useS3Upload } from '@/components/ui/upload';

const {
  upload,
  uploadMultiple,
  isUploading,
  progress,
  error,
  queue,
  addToQueue,
  processQueue,
  cancelUpload,
} = useS3Upload({
  bucket: 'matbakh-files-uploads',
  folder: 'documents',
  enableRetry: true,
  maxRetries: 3,
});
```

### `useAvatar`
Specialized hook for avatar/profile image management.

```tsx
import { useAvatar } from '@/components/ui/upload';

const {
  avatarUrl,
  uploadAvatar,
  deleteAvatar,
  isLoading,
} = useAvatar('user-123');
```

## Utilities

### File Validation
```tsx
import { validateFile } from '@/components/ui/upload';

const validation = validateFile(file, maxSize);
if (!validation.valid) {
  console.error(validation.error);
}
```

### Image Compression
```tsx
import { compressImage } from '@/components/ui/upload';

const compressedFile = await compressImage(imageFile, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
});
```

### File Preview Generation
```tsx
import { generateFilePreview } from '@/components/ui/upload';

const preview = await generateFilePreview(file);
if (preview.type === 'image' && preview.preview) {
  // Display image preview
  setImagePreview(preview.preview);
}
```

## Configuration

### Bucket Types
```tsx
type BucketType = 'matbakh-files-uploads' | 'matbakh-files-profile' | 'matbakh-files-reports';
```

### Default Settings
- **Max file size**: 10MB
- **Allowed image types**: JPEG, PNG, GIF, WebP, SVG, AVIF
- **Allowed document types**: PDF, TXT, CSV, DOCX, XLSX
- **Upload timeout**: 30 minutes
- **Retry attempts**: 3
- **Image compression quality**: 80%

## Error Handling

All components include comprehensive error handling with user-friendly messages:

- Network connectivity issues
- File size/type validation errors
- Upload timeouts
- Authentication errors
- Server errors

## Accessibility

Components are built with accessibility in mind:

- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and descriptions
- Focus management
- High contrast support

## Examples

See `upload-demo.tsx` for a comprehensive example showing all components in action.

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- Custom S3 upload library (`@/lib/s3-upload`)
- Custom hooks (`@/hooks/useS3Upload`, etc.)