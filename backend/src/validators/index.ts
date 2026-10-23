import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organization: z.string().optional(),
});

export const chatMessageSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sessionId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  visitorId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export const createSessionSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  visitorId: z.string().optional(),
  userName: z.string().optional(),
  location: z.string().optional(),
});

export const leadCaptureSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sessionId: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  intent: z.string().optional().nullable(),
  preferences: z.record(z.any()).optional().default({}),
  source: z.string().optional().default('chatbot'),
});

export const addKnowledgeSourceSchema = z.object({
  url: z.string().url('A valid URL is required'),
  title: z.string().optional(),
  type: z.enum(['url', 'pdf', 'document', 'faq']).optional().default('url'),
});

export const analyticsEventSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  sessionId: z.string().optional().nullable(),
  eventType: z.string().min(1, 'Event type is required'),
  metadata: z.record(z.any()).optional().default({}),
});
