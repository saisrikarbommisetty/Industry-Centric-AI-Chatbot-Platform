# 🏢 Industry-Centric AI Chatbot Platform — Backend

A production-ready Express + TypeScript backend powering real domain-grounded Retrieval-Augmented Generation (RAG) with OpenAI, PostgreSQL + pgvector, automated website crawling, conversation memory, structured property matching, anti-hallucination rules, and lead capturing.

---

## 🌟 Architecture Overview

```
Frontend (React + Vite)
    │
    ▼ (HTTP / REST + JSON)
Express Server (`backend/src/server.ts`)
    │
    ├── Security & Middleware (Helmet, CORS, Rate Limiting, Request Logger, Error Handler)
    ├── Auth & JWT Verification (`/api/auth`)
    ├── Chatbot RAG Pipeline (`/api/chat/message`)
    │     │
    │     ├── 1. Context & Memory Manager (`backend/src/services/chatbot/conversation.service.ts`)
    │     │      ├── Session memory tracking (Name, location, BHK, budget, amenities, stage)
    │     │      └── Deduplication (does not re-ask already provided user details)
    │     │
    │     ├── 2. Hybrid RAG Retrieval (`backend/src/services/rag/retrieval.service.ts`)
    │     │      ├── Vector cosine similarity (768-dim embeddings)
    │     │      ├── Keyword frequency & token overlap
    │     │      └── Metadata filtering (location, project, property type)
    │     │
    │     ├── 3. Structured Property Matcher (`backend/src/services/rag/propertyMatcher.service.ts`)
    │     │      └── Extracts verified property cards (title, price, area, location, status, url)
    │     │
    │     ├── 4. Grounded AI Generation (`backend/src/services/ai/openai.service.ts`)
    │     │      ├── Strict anti-hallucination prompts (`backend/src/prompts/index.ts`)
    │     │      └── Zero-drift factual answering from retrieved website sources
    │     │
    │     └── 5. Lead Capturing (`backend/src/services/leads/lead.service.ts`)
    │            └── Automated contact / phone extraction + instant CRM lead record
    │
    ├── Knowledge Ingestion Pipeline (`/api/projects/:id/knowledge`)
    │     ├── Web Crawler (`backend/src/services/crawler/crawler.service.ts`)
    │     │     ├── Auto-discovers XML sitemaps (`sitemap.xml`, `page-sitemap.xml`)
    │     │     └── Extracts cleaned HTML and property listing cards
    │     ├── Semantic Chunking (`backend/src/services/rag/chunking.service.ts`)
    │     └── Embedding Service (`backend/src/services/embeddings/embedding.service.ts`)
    │
    └── Database & Persistence
          ├── PostgreSQL + pgvector (Prisma ORM)
          └── Memory Fallback Cache for resilient development & CI
```

---

## 🚀 Key Features

1. **True RAG Retrieval**:
   - Responds strictly with actual ingested website data (e.g. Prycoons listings across Gota, Tragad, Science City, Vaishnodevi, Jagatpur, South Bopal, etc.).
   - Includes real pricing (e.g. ₹92 Lakh onwards for Ananta in Gota), area specs, possession status, and RERA approval status.

2. **Session Memory & Context Retention**:
   - Multi-turn conversation state retains user name, budget, preferred location, and home type across turns.
   - Prevents frustrating repetitive questions.

3. **Anti-Hallucination & Grounding**:
   - System prompts strictly reject fabricating nonexistent amenities (e.g. Olympic helipads), discounts, or unverified floor plans.
   - Polite fallback instructions direct users to connect with human representatives when data is unavailable.

4. **Live Website Crawling & Ingestion**:
   - Discovers sitemaps automatically and processes pages with Cheerio HTML cleanup.
   - Generates SHA-256 chunk hashes to prevent duplicate vectors.

5. **Complete Test Suite**:
   - End-to-end tests for RAG retrieval, conversation memory, and REST API endpoints with 100% pass rate.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ / 20+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database / ORM**: PostgreSQL with `pgvector` extension via Prisma ORM
- **AI / LLM**: OpenAI API (`openai` SDK, configurable `gpt-4o-mini`, `gpt-4o`)
- **Embeddings**: 768-dim vector embeddings (`text-embedding-3-small` / pgvector)
- **Web Crawler**: Axios & Cheerio
- **Validation**: Zod
- **Security**: Helmet, CORS, Express Rate Limit, JsonWebToken, Bcryptjs
- **Logging**: Winston

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend` directory (or copy from `.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL with pgvector)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/industry_chatbot?schema=public"

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# OpenAI API (Company-Provided)
OPENAI_API_KEY=your_company_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_PROVIDER=openai
EMBEDDING_DIMENSION=768

# Website Crawling
CRAWLER_USER_AGENT=IndustryChatbotBot/1.0
DEFAULT_PROJECT_URL=https://prycoons.com/
MAX_CRAWL_PAGES=50

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Database & Prisma
```bash
# Generate Prisma client
npx prisma generate

# Apply migrations (when PostgreSQL is connected)
npx prisma migrate dev --name init
```

### 3. Seed Initial Data
```bash
npm run seed
```

### 4. Run Live Ingestion (e.g., Prycoons.com)
```bash
npm run ingest:prycoons
```

### 5. Start Backend Server
```bash
# Development server (with hot reload via tsx)
npm run dev

# Production build
npm run build
npm start
```

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
npm test
```

Or run individual suites:
```bash
# Test RAG retrieval and anti-hallucination
npm run test:rag

# Test conversation context and memory retention
npm run test:context

# Test all REST API endpoints
npm run test:api
```

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new organization user
- `POST /api/auth/login` — Login with email & password (demo: `saisrikar@example.com` / `saisrikarbrim@123`)
- `GET /api/auth/me` — Get authenticated user profile

### Chat & Sessions
- `POST /api/chat/session` — Create or retrieve a chat session for a project
- `GET /api/chat/session/:sessionId` — Get session state & message history
- `POST /api/chat/message` — Send user message, execute RAG retrieval, and get grounded response
- `GET /api/chat/history/:sessionId` — Get all messages in a session

### Projects & Knowledge
- `GET /api/projects` — List all projects for authenticated user
- `POST /api/projects` — Create a new industry assistant project
- `GET /api/projects/:id` — Get project details
- `POST /api/projects/:id/knowledge/crawl` — Trigger web crawler for a website URL
- `GET /api/projects/:id/knowledge/status` — Get knowledge base status, document count & chunk metrics

### Leads & Analytics
- `POST /api/leads` — Capture lead inquiry
- `GET /api/leads?projectId=...` — Get leads for a project
- `POST /api/analytics/events` — Track visitor analytics event
- `GET /api/analytics/dashboard?projectId=...` — Get aggregated analytics metrics
