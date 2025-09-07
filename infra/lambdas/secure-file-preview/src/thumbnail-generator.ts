/**
 * Thumbnail Generator with Security Controls
 * Generates secure thumbnails for images and PDFs
 */

import sharp from 'sharp';
import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import { ThumbnailGenerationOptions, PDFPreviewOptions, FileMetadata } from './types';

export class ThumbnailGenerator {
  private readonly maxDimension = 2048;
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'pdf'];

  /**
   * Generate thumbnail for image files
   */
  async generateImageThumbnail(
    imageBuffer: Buffer,
    options: ThumbnailGenerationOptions,
    contentType: string
  ): Promise<{
    thumbnailBuffer: Buffer;
    metadata: Partial<FileMetadata>;
  }> {
    try {
      // Validate input
      this.validateImageInput(imageBuffer, contentType);

      // Create sharp instance with security limits
      const image = sharp(imageBuffer, {
        limitInputPixels: 268402689, // ~16384x16384 max
        sequentialRead: true,
        density: 150, // Limit DPI for security
      });

      // Get image metadata
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to determine image dimensions');
      }

      // Validate dimensions
      if (metadata.width > this.maxDimension || metadata.height > this.maxDimension) {
        throw new Error(`Image dimensions exceed maximum allowed size: ${this.maxDimension}x${this.maxDimension}`);
      }

      // Calculate thumbnail dimensions
      const { width: thumbWidth, height: thumbHeight } = this.calculateThumbnailDimensions(
        metadata.width,
        metadata.height,
        options.width,
        options.height,
        options.fit
      );

      // Generate thumbnail with security controls
      let thumbnailPipeline = image
        .resize(thumbWidth, thumbHeight, {
          fit: options.fit,
          background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
          withoutEnlargement: true, // Prevent upscaling
        })
        .jpeg({
          quality: Math.min(options.quality, 95), // Limit quality for security
          progressive: false, // Disable progressive for security
          mozjpeg: false, // Disable mozjpeg for security
        });

      // Apply format conversion
      switch (options.format) {
        case 'png':
          thumbnailPipeline = thumbnailPipeline.png({
            compressionLevel: 6,
            palette: true, // Use palette for smaller files
          });
          break;
        case 'webp':
          thumbnailPipeline = thumbnailPipeline.webp({
            quality: Math.min(options.quality, 90),
            effort: 4, // Balance between compression and speed
          });
          break;
        default:
          // Keep JPEG as default
          break;
      }

      const thumbnailBuffer = await thumbnailPipeline.toBuffer();

      // Validate output size
      if (thumbnailBuffer.length > 5 * 1024 * 1024) { // 5MB max thumbnail
        throw new Error('Generated thumbnail exceeds maximum size limit');
      }

      return {
        thumbnailBuffer,
        metadata: {
          dimensions: {
            width: thumbWidth,
            height: thumbHeight,
          },
          fileSize: thumbnailBuffer.length,
          contentType: `image/${options.format}`,
        },
      };

    } catch (error) {
      console.error('Image thumbnail generation failed:', error);
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF preview/thumbnail
   */
  async generatePDFPreview(
    pdfBuffer: Buffer,
    options: PDFPreviewOptions
  ): Promise<{
    previewBuffer: Buffer;
    metadata: Partial<FileMetadata>;
  }> {
    try {
      // Validate PDF input
      this.validatePDFInput(pdfBuffer);

      // For security, we'll create a placeholder preview instead of rendering actual PDF
      // In production, you would use a secure PDF renderer like pdf2pic with sandboxing
      const placeholderPreview = await this.generatePDFPlaceholder(options);

      return {
        previewBuffer: placeholderPreview,
        metadata: {
          dimensions: {
            width: options.maxWidth,
            height: options.maxHeight,
          },
          fileSize: placeholderPreview.length,
          contentType: `image/${options.format}`,
          pageCount: 1, // Would be extracted from actual PDF
        },
      };

    } catch (error) {
      console.error('PDF preview generation failed:', error);
      throw new Error(`PDF preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate secure PDF placeholder (for security demonstration)
   */
  private async generatePDFPlaceholder(options: PDFPreviewOptions): Promise<Buffer> {
    const canvas = createCanvas(options.maxWidth, options.maxHeight);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, options.maxWidth, options.maxHeight);

    // Draw PDF icon placeholder
    ctx.fillStyle = '#dc3545';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PDF', options.maxWidth / 2, options.maxHeight / 2 - 20);

    // Draw page indicator
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Arial';
    ctx.fillText(`Page ${options.page}`, options.maxWidth / 2, options.maxHeight / 2 + 30);

    // Add security watermark
    ctx.fillStyle = 'rgba(108, 117, 125, 0.3)';
    ctx.font = '12px Arial';
    ctx.fillText('SECURE PREVIEW', options.maxWidth / 2, options.maxHeight - 20);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/jpeg', { quality: options.quality / 100 });
    return buffer;
  }

  /**
   * Calculate thumbnail dimensions maintaining aspect ratio
   */
  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number,
    fit: 'cover' | 'contain' | 'fill'
  ): { width: number; height: number } {
    if (fit === 'fill') {
      return { width: targetWidth, height: targetHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let width: number;
    let height: number;

    if (fit === 'contain') {
      if (aspectRatio > targetAspectRatio) {
        width = targetWidth;
        height = Math.round(targetWidth / aspectRatio);
      } else {
        height = targetHeight;
        width = Math.round(targetHeight * aspectRatio);
      }
    } else { // cover
      if (aspectRatio > targetAspectRatio) {
        height = targetHeight;
        width = Math.round(targetHeight * aspectRatio);
      } else {
        width = targetWidth;
        height = Math.round(targetWidth / aspectRatio);
      }
    }

    return { width, height };
  }

  /**
   * Validate image input for security
   */
  private validateImageInput(buffer: Buffer, contentType: string): void {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty image buffer');
    }

    if (buffer.length > this.maxFileSize) {
      throw new Error(`Image file too large: ${buffer.length} bytes`);
    }

    // Check magic bytes for common image formats
    const magicBytes = buffer.subarray(0, 12);
    const isValidImage = this.validateImageMagicBytes(magicBytes, contentType);
    
    if (!isValidImage) {
      throw new Error('Invalid image format or corrupted file');
    }

    // Check for suspicious patterns in image data
    this.scanImageForThreats(buffer);
  }

  /**
   * Validate PDF input for security
   */
  private validatePDFInput(buffer: Buffer): void {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty PDF buffer');
    }

    if (buffer.length > this.maxFileSize) {
      throw new Error(`PDF file too large: ${buffer.length} bytes`);
    }

    // Check PDF magic bytes
    const header = buffer.subarray(0, 8).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF format');
    }

    // Basic PDF structure validation
    const content = buffer.toString('ascii');
    if (!content.includes('%%EOF')) {
      throw new Error('Incomplete or corrupted PDF file');
    }

    // Check for suspicious JavaScript or forms
    this.scanPDFForThreats(buffer);
  }

  /**
   * Validate image magic bytes
   */
  private validateImageMagicBytes(bytes: Buffer, contentType: string): boolean {
    const hex = bytes.toString('hex').toLowerCase();
    
    switch (contentType.toLowerCase()) {
      case 'image/jpeg':
      case 'image/jpg':
        return hex.startsWith('ffd8ff');
      case 'image/png':
        return hex.startsWith('89504e47');
      case 'image/gif':
        return hex.startsWith('474946');
      case 'image/webp':
        return hex.includes('57454250'); // WEBP
      case 'image/svg+xml':
        return bytes.toString('utf8').includes('<svg');
      default:
        return false;
    }
  }

  /**
   * Scan image for security threats
   */
  private scanImageForThreats(buffer: Buffer): void {
    const content = buffer.toString('ascii');
    
    // Check for embedded scripts or suspicious content
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /eval\(/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new Error('Suspicious content detected in image file');
      }
    }

    // Check for excessive EXIF data (potential data hiding)
    if (content.includes('Exif') && content.length > buffer.length * 0.1) {
      console.warn('Large EXIF data detected, potential steganography');
    }
  }

  /**
   * Scan PDF for security threats
   */
  private scanPDFForThreats(buffer: Buffer): void {
    const content = buffer.toString('ascii');
    
    // Check for JavaScript
    if (content.includes('/JavaScript') || content.includes('/JS')) {
      throw new Error('PDF contains JavaScript and cannot be safely previewed');
    }

    // Check for forms
    if (content.includes('/AcroForm') || content.includes('/XFA')) {
      console.warn('PDF contains forms - preview with caution');
    }

    // Check for external references
    if (content.includes('/URI') || content.includes('http://') || content.includes('https://')) {
      console.warn('PDF contains external references');
    }

    // Check for embedded files
    if (content.includes('/EmbeddedFile')) {
      throw new Error('PDF contains embedded files and cannot be safely previewed');
    }
  }

  /**
   * Add watermark to thumbnail for security
   */
  async addSecurityWatermark(
    imageBuffer: Buffer,
    watermarkText: string = 'PREVIEW'
  ): Promise<Buffer> {
    try {
      const watermarkSvg = `
        <svg width="200" height="50">
          <text x="100" y="25" font-family="Arial" font-size="16" 
                fill="rgba(255,255,255,0.7)" text-anchor="middle" 
                dominant-baseline="middle">${watermarkText}</text>
        </svg>
      `;

      const watermarkBuffer = Buffer.from(watermarkSvg);

      const result = await sharp(imageBuffer)
        .composite([{
          input: watermarkBuffer,
          gravity: 'southeast',
          blend: 'over',
        }])
        .jpeg({ quality: 90 })
        .toBuffer();

      return result;

    } catch (error) {
      console.error('Failed to add watermark:', error);
      return imageBuffer; // Return original if watermarking fails
    }
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return [...this.allowedFormats];
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(contentType: string): boolean {
    const format = contentType.split('/')[1]?.toLowerCase();
    return format ? this.allowedFormats.includes(format) : false;
  }
}