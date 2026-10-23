import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/industry_chatbot?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'brim-super-secret-jwt-key-2026-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // AI Provider (OpenAI)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || '768', 10),
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'auto', // 'openai' | 'gemini' | 'auto'

  // Legacy Gemini configuration (optional transition fallback)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-004',
  
  // App URLs & CORS
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(','),
  
  // Defaults & Crawler
  DEFAULT_PROJECT_URL: process.env.DEFAULT_PROJECT_URL || 'https://prycoons.com/',
  CRAWLER_USER_AGENT: process.env.CRAWLER_USER_AGENT || 'BRIM-AI-KnowledgeBot/1.0 (+https://brimai.com/bot)',
  MAX_CRAWL_PAGES: parseInt(process.env.MAX_CRAWL_PAGES || '50', 10),
  
  // RAG & Chunking
  RAG_TOP_K: parseInt(process.env.RAG_TOP_K || '6', 10),
  RAG_SIMILARITY_THRESHOLD: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.45'),
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '500', 10), // characters / semantic tokens
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '80', 10),
};

export function validateEnvironment(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!ENV.OPENAI_API_KEY || ENV.OPENAI_API_KEY.trim() === '') {
    warnings.push('OPENAI_API_KEY is not configured. Running with grounded rule-based AI fallback.');
  }
  return {
    valid: true,
    warnings,
  };
}
