import { 
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  DetectModerationLabelsCommand
} from '@aws-sdk/client-rekognition';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { ImageData, ImageAnalysisResult, AnalysisError } from './types';
import sharp from 'sharp';

/**
 * Image Analysis Engine
 * 
 * Analyzes restaurant images using AWS Rekognition and custom algorithms:
 * - Content detection (food, interior, exterior, people)
 * - Quality assessment (brightness, contrast, composition)
 * - Emotion detection from customer faces
 * - Brand consistency analysis
 * - Visual appeal scoring
 */
export class ImageAnalysisEngine {
  private rekognitionClient: RekognitionClient;
  private s3Client: S3Client;
  private restaurantLabels: Map<string, string[]>;
  private qualityThresholds: {
    brightness: { min: number; max: number };
    contrast: { min: number; max: number };
    sharpness: number;
  };

  constructor() {
    this.rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1'
    });

    // Restaurant-specific label mappings
    this.restaurantLabels = new Map([
      ['food', ['Food', 'Meal', 'Dish', 'Pizza', 'Pasta', 'Salad', 'Soup', 'Dessert', 'Bread', 'Meat', 'Vegetable', 'Fruit', 'Beverage', 'Coffee', 'Wine', 'Beer']],
      ['interior', ['Restaurant', 'Dining Room', 'Table', 'Chair', 'Bar', 'Kitchen', 'Furniture', 'Lighting', 'Decoration', 'Interior Design']],
      ['exterior', ['Building', 'Architecture', 'Storefront', 'Sign', 'Outdoor Dining', 'Patio', 'Terrace', 'Street', 'Facade']],
      ['people', ['Person', 'People', 'Customer', 'Staff', 'Chef', 'Waiter', 'Group', 'Family', 'Couple']],
      ['menu', ['Menu', 'Text', 'Document', 'Paper', 'Board', 'Chalkboard', 'Sign']],
      ['ambiance', ['Candle', 'Fire', 'Flame', 'Lighting', 'Lamp', 'Chandelier', 'Atmosphere']]
    ]);

    this.qualityThresholds = {
      brightness: { min: 30, max: 200 },
      contrast: { min: 20, max: 80 },
      sharpness: 0.3
    };
  }

  /**
   * Analyze multiple images
   */
  async analyzeImages(images: ImageData[]): Promise<{
    results: Map<string, ImageAnalysisResult>;
    failedImages: number;
  }> {
    const results = new Map<string, ImageAnalysisResult>();
    let failedImages = 0;
    
    console.log(`Analyzing ${images.length} images`);

    // Process images in batches to manage resources
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchPromises = batch.map(image => this.analyzeImage(image));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        batch.forEach((image, index) => {
          if (batchResults[index]) {
            results.set(image.id, batchResults[index]);
          } else {
            failedImages++;
          }
        });
      } catch (error) {
        console.error(`Failed to analyze image batch ${i / batchSize + 1}:`, error);
        failedImages += batch.length;
        // Continue with next batch
      }

      // Add delay between batches
      if (i + batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Successfully analyzed ${results.size} out of ${images.length} images`);
    return { results, failedImages };
  }

  /**
   * Analyze individual image
   */
  private async analyzeImage(image: ImageData): Promise<ImageAnalysisResult | null> {
    try {
      // Download and process image
      const imageBuffer = await this.downloadImage(image.url);
      if (!imageBuffer) {
        console.warn(`Failed to download image ${image.id}`);
        return null;
      }

      // Run parallel analysis
      const [labelsResult, facesResult, qualityResult] = await Promise.all([
        this.detectLabels(imageBuffer),
        this.detectFaces(imageBuffer),
        this.assessImageQuality(imageBuffer)
      ]);

      // Categorize content
      const content = this.categorizeContent(labelsResult.labels);

      // Extract emotions from faces
      const emotions = facesResult.faces.length > 0 
        ? this.extractEmotions(facesResult.faces)
        : undefined;

      return {
        labels: labelsResult.labels,
        quality: qualityResult,
        content,
        emotions
      };

    } catch (error) {
      console.error(`Failed to analyze image ${image.id}:`, error);
      return null;
    }
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer | null> {
    try {
      // Handle S3 URLs
      if (url.includes('amazonaws.com') || url.includes('s3.')) {
        return await this.downloadFromS3(url);
      }

      // Handle external URLs
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      console.error(`Failed to download image from ${url}:`, error);
      return null;
    }
  }

  /**
   * Download image from S3
   */
  private async downloadFromS3(url: string): Promise<Buffer | null> {
    try {
      // Parse S3 URL to extract bucket and key
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('s3') || part.includes('amazonaws'));
      
      if (bucketIndex === -1) {
        throw new Error('Invalid S3 URL format');
      }

      const bucket = urlParts[bucketIndex + 1] || urlParts[bucketIndex].split('.')[0];
      const key = urlParts.slice(bucketIndex + 2).join('/');

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks);

    } catch (error) {
      console.error(`Failed to download from S3: ${url}`, error);
      return null;
    }
  }

  /**
   * Detect labels using AWS Rekognition
   */
  private async detectLabels(imageBuffer: Buffer): Promise<{
    labels: Array<{
      name: string;
      confidence: number;
      category: string;
    }>;
  }> {
    try {
      const command = new DetectLabelsCommand({
        Image: {
          Bytes: imageBuffer
        },
        MaxLabels: 50,
        MinConfidence: 60
      });

      const response = await this.rekognitionClient.send(command);
      
      if (!response.Labels) {
        return { labels: [] };
      }

      // Process and categorize labels
      const labels = response.Labels
        .filter(label => label.Confidence && label.Confidence >= 60)
        .map(label => ({
          name: label.Name || '',
          confidence: (label.Confidence || 0) / 100, // Convert to 0-1 scale
          category: this.categorizeLabel(label.Name || '')
        }))
        .filter(label => label.name.length > 0)
        .sort((a, b) => b.confidence - a.confidence);

      return { labels };

    } catch (error) {
      console.error('Label detection failed:', error);
      return { labels: [] };
    }
  }

  /**
   * Detect faces and emotions using AWS Rekognition
   */
  private async detectFaces(imageBuffer: Buffer): Promise<{
    faces: Array<{
      emotions: Array<{
        type: string;
        confidence: number;
      }>;
      ageRange?: {
        low: number;
        high: number;
      };
      gender?: string;
    }>;
  }> {
    try {
      const command = new DetectFacesCommand({
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ['ALL']
      });

      const response = await this.rekognitionClient.send(command);
      
      if (!response.FaceDetails) {
        return { faces: [] };
      }

      const faces = response.FaceDetails.map(face => ({
        emotions: (face.Emotions || [])
          .filter(emotion => emotion.Confidence && emotion.Confidence >= 50)
          .map(emotion => ({
            type: emotion.Type || '',
            confidence: (emotion.Confidence || 0) / 100
          }))
          .sort((a, b) => b.confidence - a.confidence),
        ageRange: face.AgeRange ? {
          low: face.AgeRange.Low || 0,
          high: face.AgeRange.High || 0
        } : undefined,
        gender: face.Gender?.Value || undefined
      }));

      return { faces };

    } catch (error) {
      console.error('Face detection failed:', error);
      return { faces: [] };
    }
  }

  /**
   * Assess image quality using Sharp
   */
  private async assessImageQuality(imageBuffer: Buffer): Promise<{
    brightness: number;
    contrast: number;
    sharpness: number;
    composition: number;
    overall: number;
  }> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      const stats = await image.stats();

      // Calculate brightness (0-100)
      const brightness = this.calculateBrightness(stats);

      // Calculate contrast (0-100)
      const contrast = this.calculateContrast(stats);

      // Calculate sharpness using Laplacian variance
      const sharpness = await this.calculateSharpness(image);

      // Calculate composition score based on dimensions and aspect ratio
      const composition = this.calculateComposition(metadata);

      // Calculate overall quality score
      const overall = (brightness + contrast + sharpness + composition) / 4;

      return {
        brightness: Math.round(brightness),
        contrast: Math.round(contrast),
        sharpness: Math.round(sharpness),
        composition: Math.round(composition),
        overall: Math.round(overall)
      };

    } catch (error) {
      console.error('Quality assessment failed:', error);
      return {
        brightness: 50,
        contrast: 50,
        sharpness: 50,
        composition: 50,
        overall: 50
      };
    }
  }

  /**
   * Calculate brightness score
   */
  private calculateBrightness(stats: sharp.Stats): number {
    const channels = stats.channels;
    if (!channels || channels.length === 0) return 50;

    // Average brightness across all channels
    const avgBrightness = channels.reduce((sum, channel) => sum + channel.mean, 0) / channels.length;
    
    // Normalize to 0-100 scale (optimal range: 80-180)
    if (avgBrightness < this.qualityThresholds.brightness.min) {
      return (avgBrightness / this.qualityThresholds.brightness.min) * 50;
    } else if (avgBrightness > this.qualityThresholds.brightness.max) {
      return 100 - ((avgBrightness - this.qualityThresholds.brightness.max) / 55) * 50;
    } else {
      return 50 + ((avgBrightness - this.qualityThresholds.brightness.min) / 
        (this.qualityThresholds.brightness.max - this.qualityThresholds.brightness.min)) * 50;
    }
  }

  /**
   * Calculate contrast score
   */
  private calculateContrast(stats: sharp.Stats): number {
    const channels = stats.channels;
    if (!channels || channels.length === 0) return 50;

    // Average standard deviation across channels as contrast measure
    const avgStdDev = channels.reduce((sum, channel) => sum + channel.stdev, 0) / channels.length;
    
    // Normalize to 0-100 scale (optimal range: 30-70)
    if (avgStdDev < this.qualityThresholds.contrast.min) {
      return (avgStdDev / this.qualityThresholds.contrast.min) * 50;
    } else if (avgStdDev > this.qualityThresholds.contrast.max) {
      return 100 - ((avgStdDev - this.qualityThresholds.contrast.max) / 30) * 50;
    } else {
      return 50 + ((avgStdDev - this.qualityThresholds.contrast.min) / 
        (this.qualityThresholds.contrast.max - this.qualityThresholds.contrast.min)) * 50;
    }
  }

  /**
   * Calculate sharpness using Laplacian variance
   */
  private async calculateSharpness(image: sharp.Sharp): Promise<number> {
    try {
      // Convert to grayscale and apply Laplacian filter
      const laplacian = await image
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0]
        })
        .raw()
        .toBuffer();

      // Calculate variance of Laplacian
      const pixels = new Uint8Array(laplacian);
      const mean = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
      const variance = pixels.reduce((sum, pixel) => sum + Math.pow(pixel - mean, 2), 0) / pixels.length;

      // Normalize variance to 0-100 scale
      const normalizedSharpness = Math.min(variance / 1000, 1) * 100;
      
      return normalizedSharpness;

    } catch (error) {
      console.error('Sharpness calculation failed:', error);
      return 50;
    }
  }

  /**
   * Calculate composition score based on image dimensions and aspect ratio
   */
  private calculateComposition(metadata: sharp.Metadata): number {
    if (!metadata.width || !metadata.height) return 50;

    const aspectRatio = metadata.width / metadata.height;
    let compositionScore = 50;

    // Prefer common aspect ratios for restaurant photos
    const idealRatios = [
      { ratio: 1.0, score: 85 },    // Square (Instagram)
      { ratio: 1.33, score: 90 },  // 4:3 (Standard)
      { ratio: 1.5, score: 85 },   // 3:2 (Photography)
      { ratio: 1.78, score: 80 }   // 16:9 (Widescreen)
    ];

    // Find closest ideal ratio
    let bestMatch = idealRatios[0];
    let smallestDifference = Math.abs(aspectRatio - bestMatch.ratio);

    for (const ideal of idealRatios) {
      const difference = Math.abs(aspectRatio - ideal.ratio);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        bestMatch = ideal;
      }
    }

    // Score based on how close to ideal ratio
    if (smallestDifference <= 0.1) {
      compositionScore = bestMatch.score;
    } else if (smallestDifference <= 0.3) {
      compositionScore = bestMatch.score - (smallestDifference * 30);
    } else {
      compositionScore = Math.max(30, bestMatch.score - (smallestDifference * 50));
    }

    // Bonus for high resolution
    const totalPixels = metadata.width * metadata.height;
    if (totalPixels >= 2000000) { // 2MP+
      compositionScore += 10;
    } else if (totalPixels >= 1000000) { // 1MP+
      compositionScore += 5;
    }

    return Math.min(100, compositionScore);
  }

  /**
   * Categorize detected label
   */
  private categorizeLabel(labelName: string): string {
    for (const [category, labels] of this.restaurantLabels) {
      if (labels.some(label => label.toLowerCase() === labelName.toLowerCase())) {
        return category;
      }
    }
    return 'other';
  }

  /**
   * Categorize image content based on detected labels
   */
  private categorizeContent(labels: Array<{ name: string; confidence: number; category: string }>): {
    hasFood: boolean;
    hasInterior: boolean;
    hasExterior: boolean;
    hasPeople: boolean;
    hasMenu: boolean;
  } {
    const categories = {
      hasFood: false,
      hasInterior: false,
      hasExterior: false,
      hasPeople: false,
      hasMenu: false
    };

    const confidenceThreshold = 0.7;

    for (const label of labels) {
      if (label.confidence >= confidenceThreshold) {
        switch (label.category) {
          case 'food':
            categories.hasFood = true;
            break;
          case 'interior':
            categories.hasInterior = true;
            break;
          case 'exterior':
            categories.hasExterior = true;
            break;
          case 'people':
            categories.hasPeople = true;
            break;
          case 'menu':
            categories.hasMenu = true;
            break;
        }
      }
    }

    return categories;
  }

  /**
   * Extract emotions from detected faces
   */
  private extractEmotions(faces: Array<{
    emotions: Array<{ type: string; confidence: number }>;
  }>): Array<{ emotion: string; confidence: number }> {
    const emotionAggregation = new Map<string, number[]>();

    // Aggregate emotions from all faces
    for (const face of faces) {
      for (const emotion of face.emotions) {
        if (!emotionAggregation.has(emotion.type)) {
          emotionAggregation.set(emotion.type, []);
        }
        emotionAggregation.get(emotion.type)!.push(emotion.confidence);
      }
    }

    // Calculate average confidence for each emotion
    const aggregatedEmotions = Array.from(emotionAggregation.entries())
      .map(([emotion, confidences]) => ({
        emotion,
        confidence: confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      }))
      .filter(emotion => emotion.confidence >= 0.3)
      .sort((a, b) => b.confidence - a.confidence);

    return aggregatedEmotions;
  }

  /**
   * Aggregate image analysis results for SWOT generation
   */
  aggregateResults(results: Map<string, ImageAnalysisResult>): {
    contentDistribution: { [key: string]: number };
    averageQuality: { brightness: number; contrast: number; sharpness: number; composition: number; overall: number };
    emotionalTone: { [key: string]: number };
    keyInsights: string[];
    qualityIssues: string[];
  } {
    const contentCounts = {
      hasFood: 0,
      hasInterior: 0,
      hasExterior: 0,
      hasPeople: 0,
      hasMenu: 0
    };

    const qualityScores = {
      brightness: [] as number[],
      contrast: [] as number[],
      sharpness: [] as number[],
      composition: [] as number[],
      overall: [] as number[]
    };

    const emotionCounts = new Map<string, number>();
    const totalImages = results.size;

    // Aggregate all results
    for (const result of results.values()) {
      // Count content types
      if (result.content.hasFood) contentCounts.hasFood++;
      if (result.content.hasInterior) contentCounts.hasInterior++;
      if (result.content.hasExterior) contentCounts.hasExterior++;
      if (result.content.hasPeople) contentCounts.hasPeople++;
      if (result.content.hasMenu) contentCounts.hasMenu++;

      // Collect quality scores
      qualityScores.brightness.push(result.quality.brightness);
      qualityScores.contrast.push(result.quality.contrast);
      qualityScores.sharpness.push(result.quality.sharpness);
      qualityScores.composition.push(result.quality.composition);
      qualityScores.overall.push(result.quality.overall);

      // Count emotions
      if (result.emotions) {
        for (const emotion of result.emotions) {
          emotionCounts.set(emotion.emotion, (emotionCounts.get(emotion.emotion) || 0) + emotion.confidence);
        }
      }
    }

    // Calculate percentages and averages
    const contentDistribution = Object.fromEntries(
      Object.entries(contentCounts).map(([key, count]) => [key, count / totalImages])
    );

    const averageQuality = {
      brightness: Math.round(qualityScores.brightness.reduce((sum, score) => sum + score, 0) / totalImages),
      contrast: Math.round(qualityScores.contrast.reduce((sum, score) => sum + score, 0) / totalImages),
      sharpness: Math.round(qualityScores.sharpness.reduce((sum, score) => sum + score, 0) / totalImages),
      composition: Math.round(qualityScores.composition.reduce((sum, score) => sum + score, 0) / totalImages),
      overall: Math.round(qualityScores.overall.reduce((sum, score) => sum + score, 0) / totalImages)
    };

    const emotionalTone = Object.fromEntries(
      Array.from(emotionCounts.entries()).map(([emotion, totalConfidence]) => [
        emotion,
        totalConfidence / totalImages
      ])
    );

    // Generate insights and identify issues
    const keyInsights = this.generateImageInsights(contentDistribution, averageQuality, emotionalTone, totalImages);
    const qualityIssues = this.identifyQualityIssues(averageQuality, contentDistribution);

    return {
      contentDistribution,
      averageQuality,
      emotionalTone,
      keyInsights,
      qualityIssues
    };
  }

  /**
   * Generate insights from image analysis
   */
  private generateImageInsights(
    content: { [key: string]: number },
    quality: { [key: string]: number },
    emotions: { [key: string]: number },
    totalImages: number
  ): string[] {
    const insights: string[] = [];

    // Content insights
    if (content.hasFood > 0.8) {
      insights.push('Strong focus on food photography showcasing menu items');
    } else if (content.hasFood < 0.3) {
      insights.push('Limited food photography - missing opportunity to showcase cuisine');
    }

    if (content.hasInterior > 0.6) {
      insights.push('Good interior photography highlighting restaurant atmosphere');
    }

    if (content.hasPeople > 0.4) {
      insights.push('Social proof through customer photos enhances authenticity');
    }

    // Quality insights
    if (quality.overall >= 80) {
      insights.push('High-quality professional photography enhances brand image');
    } else if (quality.overall <= 60) {
      insights.push('Image quality needs improvement to compete effectively');
    }

    // Emotional insights
    const positiveEmotions = ['HAPPY', 'SURPRISED', 'CALM'];
    const negativeEmotions = ['SAD', 'ANGRY', 'DISGUSTED', 'CONFUSED'];
    
    const positiveScore = positiveEmotions.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0);
    const negativeScore = negativeEmotions.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0);

    if (positiveScore > negativeScore * 2) {
      insights.push('Customer photos show predominantly positive emotions');
    } else if (negativeScore > positiveScore) {
      insights.push('Some customer photos show negative emotions - investigate service issues');
    }

    // Volume insights
    if (totalImages < 10) {
      insights.push('Limited visual content - increase photo uploads for better engagement');
    } else if (totalImages > 50) {
      insights.push('Extensive visual content library supports strong online presence');
    }

    return insights;
  }

  /**
   * Identify quality issues that need attention
   */
  private identifyQualityIssues(
    quality: { [key: string]: number },
    content: { [key: string]: number }
  ): string[] {
    const issues: string[] = [];

    if (quality.brightness < 40) {
      issues.push('Many images are too dark - improve lighting or post-processing');
    } else if (quality.brightness > 85) {
      issues.push('Some images are overexposed - adjust lighting or camera settings');
    }

    if (quality.contrast < 40) {
      issues.push('Low contrast images lack visual impact - enhance post-processing');
    }

    if (quality.sharpness < 50) {
      issues.push('Blurry images reduce professional appearance - use tripod or better focus');
    }

    if (quality.composition < 60) {
      issues.push('Improve photo composition and framing for better visual appeal');
    }

    if (content.hasFood < 0.5 && content.hasInterior < 0.3) {
      issues.push('Lack of food and interior photos - customers need to see what to expect');
    }

    return issues;
  }
}