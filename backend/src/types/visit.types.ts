export type VisitStatus = 'New Request' | 'Contacted' | 'Visit Scheduled' | 'Completed' | 'Cancelled';

export interface VisitRequestDTO {
  requestId: string;
  submittedAt: string; // ISO date string
  customerName: string;
  mobileNumber: string;
  email: string | null;
  propertyName: string;
  propertyUrl: string | null;
  locality: string | null;
  city: string;
  bhk: string | null;
  propertyPrice: string | null;
  assistantId: string;
  assistantName: string;
  conversationId: string | null;
  visitStatus: VisitStatus;
  customerNotes: string | null;
  preferredDate?: string | null;
}

export interface CreateVisitRequestInput {
  projectId?: string;
  sessionId?: string | null;
  customerName: string;
  mobileNumber: string;
  email?: string | null;
  propertyName?: string | null;
  propertyUrl?: string | null;
  locality?: string | null;
  city?: string | null;
  bhk?: string | null;
  propertyPrice?: string | null;
  assistantId?: string | null;
  assistantName?: string | null;
  customerNotes?: string | null;
  preferredDate?: string | null;
}

export interface VisitFilterQuery {
  projectId?: string;
  status?: string;
  search?: string;
  locality?: string;
  startDate?: string;
  endDate?: string;
}
