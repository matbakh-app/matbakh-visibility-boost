/**
 * Preview Cache Manager
 * Manages caching of generated previews and thumbnails
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'crypto';
import { PreviewCache, FileMetadata } from './types';

export class PreviewCacheManager {
  private s3Client: S3Client;
  private dynamoClient: DynamoDBDocumentClient;
  private cacheBucket: string;
  private cacheTableName: string;
  private defaultTTL: number;

  constructor(
    region: string = 'eu-central-1',
    cacheBucket: string = 'matbakh-preview-cache',
    cacheTableName: string = 'preview-cache-metadata',
    defaultTTL: number = 24 * 60 * 60 // 24 hours in seconds
  ) {
    this.s3Client = new S3Client({ region });
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.cacheBucket = cacheBucket;
    this.cacheTableName = cacheTableName;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key for a file
   */
  generateCacheKey(
    fileUrl: string,
    userId: string,
    previewType: string,
    options: Record<string, any> = {}
  ): string {
    const keyData = {
      fileUrl,
      userId,
      previewType,
      options: JSON.stringify(options),
    };
    
    const hash = createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    return `${previewType}/${hash.substring(0, 8)}/${hash}`;
  }

  /**
   * Check if preview exists in cache
   */
  async getCachedPreview(cacheKey: string): Promise<PreviewCache | null> {
    try {
      const command = new GetCommand({
        TableName: this.cacheTableName,
        Key: { cacheKey },
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Item) {
        return null;
      }

      const cacheEntry = response.Item as PreviewCache;
      
      // Check if cache entry has expired
      const now = new Date();
      const expiresAt = new Date(cacheEntry.expiresAt);
      
      if (now > expiresAt) {
        // Cache expired, clean it up
        await this.deleteCachedPreview(cacheKey);
        return null;
      }

      // Update access count and last accessed time
      await this.updateCacheAccess(cacheKey);
      
      return cacheEntry;

    } catch (error) {
      console.error(`Failed to get cached preview for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Store preview in cache
   */
  async storeCachedPreview(
    cacheKey: string,
    previewBuffer: Buffer,
    thumbnailBuffer: Buffer | null,
    metadata: FileMetadata,
    ttlSeconds: number = this.defaultTTL
  ): Promise<{
    previewUrl: string;
    thumbnailUrl?: string;
  }> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
      
      // Store preview in S3
      const previewKey = `${cacheKey}/preview`;
      const previewUrl = await this.uploadToS3(previewKey, previewBuffer, metadata.contentType);
      
      let thumbnailUrl: string | undefined;
      if (thumbnailBuffer) {
        const thumbnailKey = `${cacheKey}/thumbnail`;
        thumbnailUrl = await this.uploadToS3(thumbnailKey, thumbnailBuffer, metadata.contentType);
      }

      // Store metadata in DynamoDB
      const cacheEntry: PreviewCache = {
        key: cacheKey,
        previewUrl,
        thumbnailUrl,
        metadata,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        accessCount: 1,
        lastAccessed: now.toISOString(),
      };

      const command = new PutCommand({
        TableName: this.cacheTableName,
        Item: {
          ...cacheEntry,
          TTL: Math.floor(expiresAt.getTime() / 1000), // DynamoDB TTL
        },
      });

      await this.dynamoClient.send(command);

      console.log(`Preview cached successfully: ${cacheKey}`);
      
      return {
        previewUrl,
        thumbnailUrl,
      };

    } catch (error) {
      console.error(`Failed to store cached preview for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Upload file to S3 cache bucket
   */
  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.cacheBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=86400', // 24 hours
        ServerSideEncryption: 'AES256',
        Metadata: {
          'generated-at': new Date().toISOString(),
          'cache-type': 'preview',
        },
      });

      await this.s3Client.send(command);
      
      // Return CloudFront URL if available, otherwise S3 URL
      const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
      if (cloudFrontDomain) {
        return `https://${cloudFrontDomain}/${key}`;
      } else {
        return `https://${this.cacheBucket}.s3.amazonaws.com/${key}`;
      }

    } catch (error) {
      console.error(`Failed to upload to S3: ${key}`, error);
      throw error;
    }
  }

  /**
   * Update cache access statistics
   */
  private async updateCacheAccess(cacheKey: string): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: this.cacheTableName,
        Key: { cacheKey },
        UpdateExpression: 'ADD accessCount :inc SET lastAccessed = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':now': new Date().toISOString(),
        },
      });

      await this.dynamoClient.send(command);

    } catch (error) {
      console.error(`Failed to update cache access for key ${cacheKey}:`, error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Delete cached preview
   */
  async deleteCachedPreview(cacheKey: string): Promise<void> {
    try {
      // Get cache entry to find S3 keys
      const cacheEntry = await this.getCachedPreview(cacheKey);
      
      if (cacheEntry) {
        // Delete from S3
        const previewKey = `${cacheKey}/preview`;
        await this.deleteFromS3(previewKey);
        
        if (cacheEntry.thumbnailUrl) {
          const thumbnailKey = `${cacheKey}/thumbnail`;
          await this.deleteFromS3(thumbnailKey);
        }
      }

      // Delete from DynamoDB
      const command = new DeleteCommand({
        TableName: this.cacheTableName,
        Key: { cacheKey },
      });

      await this.dynamoClient.send(command);
      
      console.log(`Cached preview deleted: ${cacheKey}`);

    } catch (error) {
      console.error(`Failed to delete cached preview for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.cacheBucket,
        Key: key,
      });

      await this.s3Client.send(command);

    } catch (error) {
      console.error(`Failed to delete from S3: ${key}`, error);
      // Don't throw - continue with cleanup
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<{
    deletedEntries: number;
    errors: string[];
  }> {
    let deletedEntries = 0;
    const errors: string[] = [];

    try {
      // Query expired entries (this is simplified - in production you'd use GSI)
      const command = new QueryCommand({
        TableName: this.cacheTableName,
        FilterExpression: 'expiresAt < :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
        },
      });

      const response = await this.dynamoClient.send(command);
      
      if (response.Items && response.Items.length > 0) {
        // Delete expired entries in batches
        for (const item of response.Items) {
          try {
            await this.deleteCachedPreview(item.cacheKey as string);
            deletedEntries++;
          } catch (error) {
            const errorMessage = `Failed to delete expired cache entry ${item.cacheKey}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMessage);
            console.error(errorMessage);
          }
        }
      }

      console.log(`Cache cleanup completed: ${deletedEntries} entries deleted, ${errors.length} errors`);
      
      return { deletedEntries, errors };

    } catch (error) {
      const errorMessage = `Cache cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(errorMessage);
      
      return { deletedEntries, errors };
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(): Promise<{
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    mostAccessed: Array<{ key: string; accessCount: number }>;
  }> {
    try {
      // This is a simplified version - in production you'd use proper aggregation
      const command = new QueryCommand({
        TableName: this.cacheTableName,
        Select: 'ALL_ATTRIBUTES',
      });

      const response = await this.dynamoClient.send(command);
      const items = response.Items || [];

      const totalEntries = items.length;
      let totalSize = 0;
      let totalAccess = 0;
      
      const accessCounts = items.map(item => ({
        key: item.cacheKey as string,
        accessCount: (item.accessCount as number) || 0,
      }));

      // Calculate total access for hit rate (simplified)
      totalAccess = accessCounts.reduce((sum, item) => sum + item.accessCount, 0);
      
      // Sort by access count for most accessed
      const mostAccessed = accessCounts
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10);

      // Hit rate calculation would need additional metrics
      const hitRate = totalAccess > 0 ? (totalEntries / totalAccess) * 100 : 0;

      return {
        totalEntries,
        totalSize, // Would need to calculate from S3 objects
        hitRate,
        mostAccessed,
      };

    } catch (error) {
      console.error('Failed to get cache statistics:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific file
   */
  async invalidateFileCache(fileUrl: string): Promise<number> {
    let deletedCount = 0;

    try {
      // Find all cache entries for this file (simplified query)
      const command = new QueryCommand({
        TableName: this.cacheTableName,
        FilterExpression: 'contains(#key, :fileUrl)',
        ExpressionAttributeNames: {
          '#key': 'key',
        },
        ExpressionAttributeValues: {
          ':fileUrl': fileUrl,
        },
      });

      const response = await this.dynamoClient.send(command);
      
      if (response.Items && response.Items.length > 0) {
        for (const item of response.Items) {
          try {
            await this.deleteCachedPreview(item.cacheKey as string);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete cache entry ${item.cacheKey}:`, error);
          }
        }
      }

      console.log(`Invalidated ${deletedCount} cache entries for file: ${fileUrl}`);
      return deletedCount;

    } catch (error) {
      console.error(`Failed to invalidate cache for file ${fileUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get cache entry by key
   */
  async getCacheEntry(cacheKey: string): Promise<PreviewCache | null> {
    return this.getCachedPreview(cacheKey);
  }

  /**
   * Check if cache bucket exists and is accessible
   */
  async validateCacheBucket(): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.cacheBucket,
        Key: 'health-check',
      });

      await this.s3Client.send(command);
      return true;

    } catch (error) {
      console.error(`Cache bucket validation failed: ${this.cacheBucket}`, error);
      return false;
    }
  }
}