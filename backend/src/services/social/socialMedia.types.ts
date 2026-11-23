// Social Media Module Type Definitions

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'other';

export type SocialProcessingStatus =
  | 'PENDING'
  | 'FETCHING'
  | 'EXTRACTING'
  | 'PROCESSING'
  | 'INDEXING'
  | 'INDEXED'
  | 'PARTIALLY_PROCESSED'
  | 'FAILED';

export interface SocialPostMetadata {
  platform: SocialPlatform;
  platformName: string;
  originalUrl: string;
  canonicalUrl: string;
  title?: string;
  caption?: string;
  description?: string;
  text: string;
  hashtags: string[];
  author?: string;
  authorUrl?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  mediaType?: 'post' | 'video' | 'reel' | 'short' | 'article' | 'tweet' | 'unknown';
  rawMetadata?: Record<string, any>;
}

export interface PlatformDetectionResult {
  platform: SocialPlatform;
  platformName: string;
  isSupported: boolean;
  canonicalUrl: string;
  normalizedUrl: string;
  error?: string;
}

export type SocialErrorCode =
  | 'INVALID_URL'
  | 'UNSUPPORTED_PLATFORM'
  | 'PRIVATE_OR_RESTRICTED'
  | 'CONTENT_UNAVAILABLE'
  | 'API_AUTH_FAILURE'
  | 'RATE_LIMITED'
  | 'NETWORK_TIMEOUT'
  | 'EXTRACTION_FAILED'
  | 'EMBEDDING_FAILED'
  | 'INDEXING_FAILED'
  | 'SSRF_BLOCKED'
  | 'DUPLICATE_URL';

export interface SocialExtractionResult {
  success: boolean;
  status: SocialProcessingStatus;
  data?: SocialPostMetadata;
  error?: {
    code: SocialErrorCode;
    message: string;
    details?: any;
    userActionRequired?: boolean;
  };
}

export interface SocialMediaSourceDTO {
  id: string;
  projectId: string;
  platform: SocialPlatform;
  platformName: string;
  url: string;
  canonicalUrl: string;
  title: string;
  author?: string;
  publishedAt?: string;
  status: SocialProcessingStatus;
  size?: string;
  lastCrawledAt?: Date | string | null;
  lastIndexedAt?: Date | string | null;
  contentHash?: string | null;
  errorMessage?: string | null;
  extractedSummary?: string | null;
  previewText?: string | null;
  hashtags?: string[];
  chunksCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
