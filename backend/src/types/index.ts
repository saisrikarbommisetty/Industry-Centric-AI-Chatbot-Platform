// Domain and Backend Type Definitions

export type IndustryType = 'real-estate' | 'marketing' | 'education' | 'healthcare' | 'hospitality' | 'ecommerce' | 'legal';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  avatar?: string;
  plan?: string;
  createdAt: Date | string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  slug: string;
  industry: string;
  industryName: string;
  websiteUrl: string;
  description?: string;
  systemInstructions?: string;
  avatar?: string;
  primaryColor?: string;
  tone?: string;
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  leadCaptureEnabled: boolean;
  leadCaptureFields: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  sourcesCount?: number;
  totalConversations?: number;
  leadCount?: number;
}

export interface KnowledgeSourceDTO {
  id: string;
  projectId: string;
  type: 'url' | 'pdf' | 'document' | 'faq';
  url: string;
  title: string;
  status: 'pending' | 'crawling' | 'indexed' | 'failed' | 'synced';
  size?: string;
  lastCrawledAt?: Date | string | null;
  lastIndexedAt?: Date | string | null;
  contentHash?: string | null;
  errorMessage?: string | null;
  extractedSummary?: string | null;
  chunks?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface KnowledgeDocumentDTO {
  id: string;
  sourceId: string;
  projectId: string;
  title: string;
  url: string;
  content: string;
  metadata: Record<string, any>;
  contentHash: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface KnowledgeChunkDTO {
  id: string;
  documentId: string;
  projectId: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  chunkIndex: number;
  createdAt: Date | string;
  similarity?: number;
}

export interface ExtractedPropertyMetadata {
  projectName?: string;
  location?: string;
  city?: string;
  propertyType?: string; // e.g. 2BHK, 3BHK, 4BHK, Commercial
  bhk?: string;
  price?: string;
  priceNum?: number; // In Lakhs
  carpetArea?: string;
  developer?: string;
  propertyStatus?: string; // Ready to move, Under construction, Pre-launch
  reraNo?: string;
  possession?: string;
  amenities?: string[];
  highlights?: string[];
  description?: string;
  address?: string;
  brochureUrl?: string;
  sourceUrl?: string;
  documentType?: 'property_listing' | 'locality_overview' | 'agency_service' | 'general_faq';
  image?: string;
  images?: string[];
  properties?: ExtractedPropertyMetadata[];
}

export interface PropertyCardData {
  id?: string;
  title: string;
  propertyName?: string;
  tagline?: string;
  location: string;
  bhk: string;
  carpetArea?: string;
  priceRange: string;
  priceNum?: number;
  status?: string;
  reraNo?: string;
  image?: string;
  propertyImageUrl?: string;
  amenities: string[];
  brochureUrl?: string;
  description?: string;
  sourceUrl?: string;
  propertyDetailUrl?: string;
}

export interface ConversationDiscoveryState {
  location?: string;
  homeType?: string;
  bhk?: string;
  mustHave?: string;
  lifestyle?: string;
  budget?: string;
  budgetNum?: number;
  budgetMin?: number;
  budgetMax?: number;
  rentMonthly?: number;
  timeline?: string;
  brandStory?: string;
  servicesNeeded?: string[];
  nearbyPreference?: string;
  propertyStatusPreference?: string;
  preferredAmenities?: string[];
  possessionPreference?: string;
  additionalPreferences?: string[];
  searchRequested?: boolean;
  [key: string]: any;
}

export interface ConversationLeadState {
  deliveryMethod?: string;
  name?: string;
  phone?: string;
  email?: string;
  captured?: boolean;
  newLaunchOptIn?: boolean | null;
}

export interface ChatSessionMetadata {
  state: string;
  stepIndex: number;
  userName?: string;
  userLocation?: string;
  industryId?: string;
  intent?: string;
  discovery: ConversationDiscoveryState;
  lead: ConversationLeadState;
  engagement?: {
    funAnswer?: string;
    advisorConnected?: boolean;
  };
  inactivityFollowUpSent?: boolean;
  userCoordinates?: {
    latitude: number;
    longitude: number;
    city?: string;
    locality?: string;
  };
  locationDenied?: boolean;
  preferredContact?: string;
  displayedPropertyTitles?: string[];
  displayedProperties?: Array<PropertyCardData>;
  lastViewedProperty?: PropertyCardData | null;
  explicitSearchRequested?: boolean;
  lastSearchQuery?: string;
}

export interface ChatMessageDTO {
  id: string;
  sessionId: string;
  sender: 'user' | 'bot' | 'system';
  role?: 'USER' | 'ASSISTANT' | 'SYSTEM';
  text: string;
  time?: string;
  quickReplies?: string[];
  propertyCard?: PropertyCardData | null;
  propertyCards?: PropertyCardData[];
  sourceCitation?: string | null;
  sources?: Array<{
    title: string;
    url: string;
    relevance?: number;
    snippet?: string;
  }>;
  showLeadForm?: boolean;
  leadCaptured?: boolean;
  advisorConnected?: boolean;
  extractedLead?: any;
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

export interface ChatResponsePayload {
  sessionId: string;
  message: string;
  context: ChatSessionMetadata;
  sources: Array<{
    title: string;
    url: string;
    relevance?: number;
    snippet?: string;
  }>;
  suggestions: string[];
  quickReplies?: string[];
  propertyCard?: PropertyCardData | null;
  propertyCards?: PropertyCardData[];
  leadCaptureRequired?: boolean;
  advisorConnected?: boolean;
}

export interface LeadDTO {
  id: string;
  projectId: string;
  sessionId?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  intent?: string | null;
  preferences: Record<string, any>;
  source: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AnalyticsEventDTO {
  id: string;
  projectId: string;
  sessionId?: string | null;
  eventType: string;
  metadata: Record<string, any>;
  createdAt: Date | string;
}

export interface CrawledPage {
  url: string;
  title: string;
  rawHtml: string;
  extractedText: string;
  headings: string[];
  metaDescription?: string;
  metadata: ExtractedPropertyMetadata;
  contentHash: string;
}
