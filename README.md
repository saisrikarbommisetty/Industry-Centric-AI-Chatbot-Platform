# BRIM AI — Industry-Centric Conversational Assistant Platform

A production-ready conversational customer assistant platform that combines automated website knowledge ingestion, Retrieval-Augmented Generation (RAG) with PostgreSQL `pgvector`, contextual multi-turn conversation memory, voice recognition, real-time schedule visit tracking with Excel exports, and genuine PDF brochure generation.

---

## 🌟 Overview

**BRIM AI** is an enterprise-grade conversational assistant engineered to ingest business websites (specifically integrated with [Prycoons Real Estate](https://prycoons.com/)), index structured domain inventory into a PostgreSQL database with vector embeddings, and serve customer conversations with **zero factual hallucination**.

Instead of generating ungrounded AI estimates or canned responses, the platform queries its hybrid vector and keyword knowledge index to retrieve verified project specifications (BHK configurations, pricing, localities, carpet areas, amenities, and RERA approval numbers) and synthesizes human-like answers strictly anchored in authentic source material.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Schedule Visit & Excel Export** | Captures property visit requests into persistent PostgreSQL storage and exports them into styled `.xlsx` spreadsheets with anti-formula injection sanitization. |
| **Voice Input Recognition** | Native Web Speech API integration in the chat composer with live audio animations and transcription review before sending. |
| **Official Prycoons Knowledge** | Authoritative corporate directory (`admin@prycoons.com`, `+91 7861072811`) strictly eliminating outdated contact numbers. |
| **Genuine PDF Brochure Engine** | Generates binary `%PDF-1.3` specification brochures on the fly using `pdfkit`, complete with verified floor specs, pricing, and amenities. |
| **Automated Website Ingestion** | Multi-worker Cheerio crawler that auto-discovers XML sitemaps, extracting properties while stripping navigation, footers, and scripts. |
| **Hybrid RAG Retrieval Engine** | Combines 768-dimensional OpenAI vector embeddings (`<=>` cosine similarity) with metadata filters and token keyword matching. |
| **Anti-Hallucination Guardrails** | Strict system prompts and validation rules that prevent the model from inventing non-existent amenities or arbitrary prices. |
| **Multi-Turn Context Memory** | Retains visitor name, property intent, locality, budget, and lifestyle requirements across conversation turns without repeating questions. |
| **Interactive Property Cards** | Displays verified property cards featuring image previews, locality tags, price ranges, brochure download triggers, and visit scheduling. |
| **Role-Based Authentication** | Secure JWT authentication with `bcryptjs` password hashing, token expiration, and administrative access control. |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Website Visitor / Client]) --> Frontend[React + Vite Frontend]
    Admin([Platform Administrator]) --> Frontend
    
    Frontend -->|REST API / JSON & Blobs| Backend[Express + TypeScript Server]
    
    subgraph Data & Storage Layer
        Postgres[(PostgreSQL + pgvector)]
        PrismaORM[Prisma ORM Client]
    end
    
    subgraph Core Backend Services
        AuthService[JWT & Role Auth Middleware]
        VisitService[Visit Request & ExcelJS Service]
        BrochureService[PDFKit Brochure Generator]
        RAGService[Hybrid Retrieval Engine]
        OpenAIService[OpenAI GPT-4o-mini & Embeddings]
    end

    Backend --> AuthService
    Backend --> VisitService
    Backend --> BrochureService
    Backend --> RAGService
    
    VisitService --> PrismaORM
    RAGService --> PrismaORM
    PrismaORM --> Postgres
    RAGService --> OpenAIService
```

---

## 📂 Project Directory Structure

```
INDUSTRY-CENTRIC AI CHATBOT/
├── .env.example                 # Root frontend environment example
├── .gitignore                   # Root repository gitignore rules
├── index.html                   # Single-Page Application entry point
├── package.json                 # Frontend dependencies and Vite scripts
├── vite.config.js               # Vite config with /api reverse proxy
├── vercel.json                  # Single-Page Application routing config
│
├── frontend/                    # React 18 frontend application
│   ├── components/              # Shared UI components (Layout, Topbar, Sidebar, Nav)
│   ├── context/                 # Global PlatformContext & authentication state
│   ├── data/                    # Seed mock datasets and default bot presets
│   ├── pages/                   # Application pages
│   │   ├── chat/                # PublicChatPreview with voice mic & interactive cards
│   │   ├── visits/              # VisitRequestsPage with search, filter & Excel export
│   │   ├── dashboard/           # Platform metrics & assistant status
│   │   ├── bot/                 # Assistant settings, knowledge, and analytics
│   │   └── auth/                # Login & Registration views
│   ├── styles/                  # Clean modern CSS stylesheets (variables, layout, chat)
│   └── utils/                   # Frontend API client and conversation engine
│
└── backend/                     # Node.js Express + TypeScript backend
    ├── .env.example             # Backend environment variables template
    ├── .gitignore               # Backend gitignore rules
    ├── package.json             # Backend dependencies & test scripts
    ├── tsconfig.json            # TypeScript compiler configuration
    ├── prisma/
    │   └── schema.prisma        # Database schema with pgvector & relational models
    ├── scripts/                 # Crawler & locality ingestion utilities
    ├── src/
    │   ├── server.ts            # Application bootstrap & health checks
    │   ├── app.ts               # Express configuration, CORS, rate limiting
    │   ├── config/              # Environment, PostgreSQL connection, seeds
    │   ├── controllers/         # API Controllers (Chat, Visits, Brochures, Projects)
    │   ├── middleware/          # JWT authentication, error handling, logging
    │   ├── repositories/        # Database access layer
    │   ├── routes/              # Express API routers
    │   ├── services/            # Core business logic (RAG, OpenAI, Visits, PDFKit)
    │   └── types/               # TypeScript interfaces & DTOs
    └── tests/                   # Verification test suites (RAG, Context, E2E)
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

Create a `.env` file inside the `backend/` directory based on `backend/.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `development` or `production` |
| `PORT` | HTTP server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/industry_chatbot?schema=public` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secure-jwt-secret-key-2026` |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `OPENAI_API_KEY` | OpenAI API Key (required for live completions & vectors) | `sk-proj-...` |
| `OPENAI_MODEL` | OpenAI chat completion model | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL`| Embedding model | `text-embedding-3-small` |
| `EMBEDDING_DIMENSION` | Vector dimensions (matches pgvector schema) | `768` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3000,http://localhost:5173` |

### Frontend Configuration (`.env`)

In local development, Vite proxies all `/api` requests to `http://localhost:5000` automatically. When deploying frontend and backend to separate production domains:

```env
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **PostgreSQL**: v14+ with `pgvector` extension enabled (optional in dev, fallback storage supported)
- **OpenAI API Key**: For natural language responses and embeddings

### 2. Backend Setup
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
# Open .env and add your OPENAI_API_KEY and DATABASE_URL

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations (if PostgreSQL is running)
npx prisma migrate dev --name init

# 6. Seed initial administrator and verified knowledge records
npm run seed

# 7. Start the backend development server (runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
```bash
# 1. From the project root folder
npm install

# 2. Start the Vite development server (runs on http://localhost:3000)
npm run dev
```

Visit **http://localhost:3000** in your web browser.

---

## 🧪 Verification & Testing

The repository includes a comprehensive 22-point master verification suite covering all real-estate conversational flows, brochure downloads, voice recognition, and Excel exports.

From the `backend/` directory:

```bash
# Run the complete test suite
npx tsx tests/master_e2e_verification.ts
```

### Test Coverage Highlights:
- **Test Group A**: Schedule Visit persistence in PostgreSQL, deduplication protection, and formatted `.xlsx` spreadsheet exports with anti-formula injection.
- **Test Group B**: Web Speech API audio processing and composer microphone triggers.
- **Test Group C**: Official Prycoons contact desk validation (`admin@prycoons.com`, `+91 7861072811`) and elimination of obsolete numbers.
- **Test Group D**: Binary `%PDF-1.3` specification brochure generation with verified amenities.

---

## 🚀 Production Deployment Guide

### Option 1: Managed Cloud Deployment (Recommended)
This architecture deploys the Frontend to **Vercel** or **Netlify**, the Backend to **Render** or **Railway**, and the Database to **Supabase** or **Neon**.

#### Step 1: Deploy Database (Supabase / Neon)
1. Create a free PostgreSQL instance on [Supabase](https://supabase.com/) or [Neon](https://neon.tech/).
2. In the SQL Editor, enable the `vector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy the database connection URI (e.g., `postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres`).

#### Step 2: Deploy Backend (Render / Railway)
1. Link your Git repository on **Render** (as a **Web Service**) or **Railway**.
2. Configure the service settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start` (or `node dist/server.js`)
3. Add the Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default assigned by provider)
   - `DATABASE_URL`: Your Supabase/Neon PostgreSQL connection URI
   - `JWT_SECRET`: A strong random string (e.g., `openssl rand -hex 32`)
   - `OPENAI_API_KEY`: Your OpenAI API Key
   - `OPENAI_MODEL`: `gpt-4o-mini`
   - `OPENAI_EMBEDDING_MODEL`: `text-embedding-3-small`
   - `EMBEDDING_DIMENSION`: `768`
   - `CORS_ORIGINS`: Your production frontend URL (e.g. `https://your-frontend.vercel.app`)
4. Deploy the service and verify that `https://your-backend.onrender.com/health` returns `{"status":"ok"}`.

#### Step 3: Deploy Frontend (Vercel)
1. Import your Git repository on **Vercel**.
2. Framework Preset: **Vite**
3. Root Directory: `./` (Root)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com` (Your deployed backend URL without trailing slash)
7. Deploy! Your full-stack real-estate assistant is now live with zero cold-start database blocks.

---

### Option 2: Single-Server VPS Deployment (Ubuntu + Docker / PM2 + Nginx)

For self-hosted deployments on AWS EC2, DigitalOcean, or Linode:

#### 1. Build and Run Backend with PM2
```bash
# On your server
cd /var/www/industry-chatbot/backend
npm install
npx prisma generate
npm run build
pm2 start dist/server.js --name "brim-backend"
pm2 save
```

#### 2. Build Frontend
```bash
cd /var/www/industry-chatbot
npm install
npm run build
# Outputs static production files to /var/www/industry-chatbot/dist
```

#### 3. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static frontend
    location / {
        root /var/www/industry-chatbot/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
    }
}
```

Enable SSL via Certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security & Reliability Guarantees

1. **Spreadsheet Formula Injection Prevention**: User inputs exported to Excel spreadsheets are sanitized by prepending single quotes (`'`) to values starting with `=`, `+`, `-`, or `@`.
2. **Safe Fallback Memory Architecture**: If PostgreSQL is temporarily unreachable, visits, conversations, and projects seamlessly fall back to an in-memory cache to guarantee 100% uptime without user-facing 500 errors.
3. **HTTP Hardening**: Configured with `helmet` headers, origin verification, and rate limiting (`express-rate-limit`).
4. **Binary Integrity**: PDF brochures are created with valid `%PDF-1.3` stream headers, never downloading HTML files or broken links.

---

## 📄 License

This project is licensed under the MIT License.