# Upload Monitoring Integration Examples

Diese Beispiele zeigen, wie der bestehende `monitorUploadPerformance` Decorator aus `src/lib/monitoring.ts` für verschiedene Upload-Szenarien verwendet wird.

## A) Presigned-PUT via fetch

### Basis Upload-Funktion
```typescript
// deine eigentliche Upload-Funktion
async function uploadWithPresignedPut(file: File, url: string) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': file.type, 
      'Content-Length': String(file.size) 
    },
    body: file,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return { ok: true };
}
```

### Dekorierte Version mit Monitoring
```typescript
import { monitorUploadPerformance } from '@/lib/monitoring';

// dekorierte Version — Größe wird automatisch via File.size erkannt
export const uploadAvatar = monitorUploadPerformance(
  'profile',
  'avatar',
  uploadWithPresignedPut
);
```

### Verwendung
```typescript
// Verwendung:
try {
  await uploadAvatar(file, presignedUrl);
  console.log('Avatar upload successful');
} catch (error) {
  console.error('Avatar upload failed:', error);
}
```

## B) Direkt mit AWS SDK (PutObjectCommand)

### AWS SDK Upload-Funktion
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

async function putObject(body: Buffer | Uint8Array | Blob, key: string, bucketName: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: (body as any).type,
  }));
  return { key };
}
```

### Dekorierte Version
```typescript
import { monitorUploadPerformance } from '@/lib/monitoring';

// Buffer/Blob/Uint8Array → Größe wird automatisch erkannt (length/size/byteLength)
export const uploadDoc = monitorUploadPerformance('uploads', 'document', putObject);
```

### Verwendung
```typescript
// Verwendung:
const documentData = Buffer.from(pdfContent);
await uploadDoc(documentData, 'docs/report.pdf', 'my-documents-bucket');
```

## C) Multipart Upload (eigene Chunks)

### Multipart Upload-Funktion
```typescript
type Part = { chunk: Uint8Array; etag?: string };

async function multipartUpload(file: File, key: string) {
  // ... createMultipartUpload, uploadPart in Schleife ...
  // return Gesamtgröße explizit mit
  const total = file.size;
  return { key, uploadedSize: total };
}
```

### Dekorierte Version mit Custom Size Extractor
```typescript
import { monitorUploadPerformance } from '@/lib/monitoring';

// custom extractor: nehme size aus result oder aus File-Arg
export const uploadLarge = monitorUploadPerformance(
  'uploads',
  'document',
  multipartUpload,
  {
    sizeExtractor: (args, result) => {
      if (result?.uploadedSize) return result.uploadedSize;
      const f = args.find(a => a instanceof File) as File | undefined;
      return f?.size;
    }
  }
);
```

### Verwendung
```typescript
// Verwendung:
const largeVideoFile = new File([videoBlob], 'presentation.mp4');
await uploadLarge(largeVideoFile, 'videos/presentation.mp4');
```

## D) Manuelle Größe (Edge-Fälle)

### Upload mit bekannter Größe
```typescript
// Falls dein Call-Site die Größe ohnehin kennt, gib sie explizit mit
async function uploadUnknown(data: any, opts: { fileSizeBytes: number }) {
  // ... hochladen ...
  return { ok: true };
}

export const uploadOther = monitorUploadPerformance(
  'uploads',
  'other',
  uploadUnknown
);
```

### Verwendung
```typescript
// await uploadOther(stream, { fileSizeBytes: knownSize });
const streamData = new ReadableStream(/* ... */);
const knownSize = 1024 * 1024; // 1MB
await uploadOther(streamData, { fileSizeBytes: knownSize });
```

### Stream Upload mit bekannter Größe
```typescript
async function uploadStream(
  stream: ReadableStream<Uint8Array>, 
  key: string, 
  opts: { fileSizeBytes: number }
) {
  const reader = stream.getReader();
  let uploadedBytes = 0;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Upload chunk logic here...
      uploadedBytes += value.length;
    }
    
    return { key, uploadedBytes: opts.fileSizeBytes };
  } finally {
    reader.releaseLock();
  }
}

export const uploadStreamWithSize = monitorUploadPerformance(
  'uploads',
  'document',
  uploadStream,
  {
    sizeExtractor: (args) => {
      // Extract size from options parameter
      const opts = args[2] as { fileSizeBytes: number };
      return opts?.fileSizeBytes || 0;
    }
  }
);
```

## Erweiterte Beispiele

### D) Form Data Upload mit Progress Tracking

```typescript
async function uploadFormData(formData: FormData, endpoint: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  return await response.json();
}

// Monitoring für Form Data Uploads
export const uploadFormWithFiles = monitorUploadPerformance(
  'uploads',
  'document',
  uploadFormData,
  {
    sizeExtractor: (args) => {
      const formData = args[0] as FormData;
      let totalSize = 0;
      
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          totalSize += value.size;
        }
      }
      
      return totalSize;
    }
  }
);
```

### E) Base64 Upload mit Size Calculation

```typescript
async function uploadBase64(base64Data: string, filename: string, bucket: string) {
  // Convert base64 to binary for upload
  const binaryData = atob(base64Data.split(',')[1]);
  const bytes = new Uint8Array(binaryData.length);
  
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  
  // Upload logic here...
  return { filename, size: bytes.length };
}

export const uploadBase64Image = monitorUploadPerformance(
  'profile',
  'image',
  uploadBase64,
  {
    sizeExtractor: (args, result) => {
      // Use result size if available, otherwise calculate from base64
      if (result?.size) return result.size;
      
      const base64 = args[0] as string;
      const base64Length = base64.split(',')[1]?.length || 0;
      return Math.floor(base64Length * 0.75); // Base64 to binary size approximation
    }
  }
);
```

### F) Streaming Upload mit Chunks

```typescript
async function streamUpload(
  stream: ReadableStream<Uint8Array>, 
  key: string, 
  totalSize: number
) {
  const reader = stream.getReader();
  let uploadedBytes = 0;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Upload chunk logic here...
      uploadedBytes += value.length;
    }
    
    return { key, uploadedBytes };
  } finally {
    reader.releaseLock();
  }
}

export const uploadStream = monitorUploadPerformance(
  'uploads',
  'document',
  streamUpload,
  {
    sizeExtractor: (args, result) => {
      // Use actual uploaded bytes if available
      if (result?.uploadedBytes) return result.uploadedBytes;
      
      // Fallback to expected total size from args
      return args[2] as number;
    }
  }
);
```

## Integration in bestehende Services

### Beispiel: S3 Upload Service Integration

```typescript
// src/services/s3-upload.ts
import { monitorUploadPerformance } from '@/lib/monitoring';

class S3UploadService {
  private async rawUpload(file: File, key: string): Promise<{ url: string }> {
    // Existing upload logic...
    return { url: `https://bucket.s3.amazonaws.com/${key}` };
  }
  
  // Monitored version
  public uploadFile = monitorUploadPerformance(
    'uploads',
    'document',
    this.rawUpload.bind(this)
  );
  
  public uploadAvatar = monitorUploadPerformance(
    'profile',
    'avatar',
    this.rawUpload.bind(this)
  );
  
  public uploadReport = monitorUploadPerformance(
    'reports',
    'report',
    this.rawUpload.bind(this)
  );
}

export const s3Service = new S3UploadService();
```

### Verwendung im Component

```typescript
// src/components/FileUpload.tsx
import { s3Service } from '@/services/s3-upload';

export const FileUpload: React.FC = () => {
  const handleUpload = async (file: File) => {
    try {
      const result = await s3Service.uploadFile(file, `uploads/${file.name}`);
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
    />
  );
};
```

## Monitoring Dashboard Integration

Die Upload-Metriken erscheinen automatisch im Performance Monitoring Dashboard:

```typescript
// Metriken werden automatisch erfasst:
// - UPLOAD_SUCCESS / UPLOAD_FAILURE
// - UPLOAD_DURATION (ms)
// - UPLOAD_SIZE (bytes)
// - FILE_VALIDATION_ERROR
// - QUOTA_EXCEEDED

// Dimensionen:
// - Bucket: 'profile' | 'uploads' | 'reports'
// - UploadType: 'avatar' | 'document' | 'image' | 'report' | 'logo' | 'other'
// - ErrorType: 'validation_error' | 'network_error' | 'permission_error' | etc.
```

## Best Practices

### 1. **Bucket & Type Kategorisierung**
```typescript
// Verwende aussagekräftige Bucket/Type Kombinationen
const UPLOAD_CONFIGS = {
  userAvatar: { bucket: 'profile', type: 'avatar' },
  companyLogo: { bucket: 'profile', type: 'logo' },
  document: { bucket: 'uploads', type: 'document' },
  report: { bucket: 'reports', type: 'report' },
  image: { bucket: 'uploads', type: 'image' }
} as const;
```

### 2. **Error Handling**
```typescript
// Spezifische Error-Behandlung für bessere Metriken
try {
  await uploadAvatar(file, url);
} catch (error) {
  if (error.message.includes('413')) {
    // File too large - wird als 'quota_error' kategorisiert
  } else if (error.message.includes('403')) {
    // Permission denied - wird als 'permission_error' kategorisiert
  }
  throw error; // Re-throw für normale Error-Behandlung
}
```

### 3. **Size Validation**
```typescript
const MAX_SIZES = {
  avatar: 5 * 1024 * 1024,    // 5MB
  document: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024     // 10MB
};

function validateFileSize(file: File, type: keyof typeof MAX_SIZES) {
  if (file.size > MAX_SIZES[type]) {
    throw new Error(`File too large: ${file.size} > ${MAX_SIZES[type]}`);
  }
}
```

---

**Alle Upload-Funktionen werden automatisch überwacht und die Metriken erscheinen in CloudWatch unter dem Namespace `Matbakh/S3Upload`.**