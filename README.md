# 🏙️ NexusAI — Industry-Centric AI Chatbot Platform

> **Next-Generation Autonomous Domain AI Chatbot Platform** with deep industry grounding, autonomous lead qualification, and instant multi-channel deployment.  
> **Flagship Demonstration Showcase**: **[Prycoons Real Estate](https://prycoons.com/)** (Ahmedabad, SG Highway & GIFT City Developments).

---

## 🌟 Executive Overview

**NexusAI** is an enterprise-grade AI chatbot platform designed to solve the domain-accuracy challenge of generic chatbots. Unlike generic LLM wrappers, NexusAI uses a **domain-centric retrieval-augmented generation (RAG) architecture** tailored to specific industry verticals:

1. **🏢 Real Estate & Infrastructure (Primary Showcase: Prycoons)** — Exact BHK configurations, verified RERA numbers, sq.ft. carpet area disclosures, pricing breakdown, interactive property cards, brochure downloads, and VIP site visit scheduling.
2. **🎓 Higher Education & EdTech (EduNova)** — Program eligibility, merit scholarships, tuition fees, and campus tour bookings.
3. **🩺 Healthcare & Clinics (CarePoint)** — Doctor specialist routing, outpatient OPD schedules, and clinic appointments.
4. **🛎️ Hospitality & Luxury Stays (LuxeStay)** — Presidential suite discovery, concierge dining reservations, and spa packages.
5. **🛍️ E-Commerce & Retail (RetailNexus)** — Order tracking, size recommendations, and returns policy.

---

## ✨ Core Features & Highlights

### 1. 🚀 Complete Clickable User Journey
- **Authentication**: Interactive Login & Signup with 1-click demo personas (*Aarav Sharma — Prycoons Lead Director*, *Pooja Varma — EduNova Dean*, *Dr. Rohan Mehra — CarePoint Medical Director*).
- **Executive Dashboard**: Real-time KPI cards, daily inquiry velocity charts, property preference breakdown, active bot hub, and live conversation stream.
- **4-Step Bot Creation Wizard**: Progressive disclosure workflow:
  - **Step 1**: Basic Info, Avatar, and Industry Selector (Real Estate, Healthcare, Education, Hospitality, E-Commerce).
  - **Step 2**: Knowledge Sources Hub (live URL crawler simulator, PDF brochure dropzone, structured FAQ pairs).
  - **Step 3**: AI Persona & Tone tuning (Consultative, Friendly, Formal, Luxury), Welcome Message, and Lead Capture toggle.
  - **Step 4**: Interactive Review & Live Sandbox Mini-Chat testing before deployment.
- **Celebration & Success Screen**: Animated confetti celebration, 1-click public URL copy, embed snippet copy, and direct jump to preview.

### 2. 🏢 Flagship Prycoons Real Estate Domain AI
The platform comes preloaded with rich, realistic real-estate project data inspired by Prycoons:
- **The Sovereign Sky Villas** — 4 & 5 BHK Ultra-Luxury Sky Mansions in Bodakdev, Ahmedabad (₹4.85 Cr – ₹8.50 Cr, RERA: `PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/RAA09821/220322`).
- **GIFT Horizon Towers** — Smart 2 & 3 BHK Tech Residences in GIFT City SEZ (₹95 Lakhs – ₹1.65 Cr, 6.8%–7.5% rental yield, RERA: `PR/GJ/GANDHINAGAR/GANDHINAGAR/GDA/MAA08912/150123`).
- **Prycoons Emerald Heights** — 3 BHK Family Residences on Science City Road, Sola (₹1.35 Cr – ₹1.85 Cr, 30,000 sq.ft. clubhouse, RERA: `PR/GJ/AHMEDABAD/DASKROI/AUDA/RAA11045/050823`).
- **Prycoons Capital Square** — Grade-A Commercial Retail & Corporate Suites on main SG Highway (₹82 Lakhs – ₹9.2 Cr, RERA: `PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/CAA07841/191122`).

### 3. 💬 Customer-Facing Standalone Chatbot (`/chat/:botId`)
- Full-screen or windowed client experience with online status indicator.
- **Interactive Property Feature Cards** attached directly in the chat stream with specs, pricing, and direct brochure downloads.
- **Autonomous Lead Capture**: Automatically prompts visitors for their Name, Phone (WhatsApp), Email, and Preferred Date when high-intent questions are asked.
- **Suggestion Prompt Pills** for 1-click exploratory queries.

### 4. 🛠️ Comprehensive Single-Bot Management Suite
- **Overview**: Health telemetry, live test console, indexed sources summary, quick embed snippet.
- **Chat History & Inspector**: Master-detail split screen with session filters, user profile card, grounded source citations, and transcript text export.
- **Analytics Deep-Dive**: Timeframe filters (7d, 30d, 90d, All), daily session area charts, customer sentiment ring, BHK interest distribution, and peak hours traffic heatmap.
- **Knowledge Base Hub**: Table of indexed PDFs, URLs, and FAQs with sync status, **Vector Chunk Inspector Modal**, and **Add Knowledge Source Modal**.
- **Share & Embed**: Standalone public share URL, **Interactive Live Embed Customizer** (color, position, bubble icon) with real-time website sandbox preview, embed `<script>` generator, and high-res **Print QR Code**.
- **Settings**: LLM temperature slider, system prompt editor, CRM webhook URL, notification emails, and danger zone.

### 5. 🌐 Platform Global Suite
- **Global Chat History**: Unified conversation audit log across all deployed bots with CSV export.
- **Global Analytics**: Multi-tenant aggregate metrics.
- **Pricing & Plans**: Interactive tiers (*Starter $29/mo*, *Growth $79/mo*, *Enterprise $249/mo*), monthly/annual billing switch (-20%), feature matrix, and simulated plan upgrade modal.
- **Account & Team**: 1-click demo persona switcher, profile info, and developer API key generator.
- **Help & Guides**: Flagship Real Estate blueprint architecture documentation and FAQ accordion.

---

## 🏗️ Project Architecture & File Organization

```
INDUSTRY-CENTRIC AI CHATBOT/
├── index.html                     # HTML5 entry point with Google Fonts
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite development & build configuration
├── spec.md                        # Product requirements specification
├── README.md                      # Comprehensive project documentation
└── src/
    ├── main.jsx                   # React application root entry
    ├── App.jsx                    # Central client-side router (20+ routes)
    ├── context/
    │   └── PlatformContext.jsx    # React Context + LocalStorage persistence + Chat RAG simulation
    ├── data/
    │   └── mockData.js            # Rich multi-industry dataset (Prycoons, EduNova, CarePoint, etc.)
    ├── styles/
    │   ├── variables.css          # Design tokens (colors, gradients, shadows, radius)
    │   ├── base.css               # Reset, typography, custom scrollbars
    │   ├── components.css         # Button system, cards, inputs, badges, modals, toasts, tables
    │   ├── layout.css             # App shell, sidebar, topbar, mobile drawer, bot sub-navigation
    │   ├── chat.css               # Chatbot UI, property cards, lead form, typing animation
    │   └── index.css              # Style bundle aggregator & global utility classes
    ├── components/
    │   └── common/
    │       ├── Layout.jsx         # App Shell layout with Toast notification container
    │       ├── Sidebar.jsx        # Primary platform navigation with mobile drawer
    │       ├── Topbar.jsx         # Header with quick search dropdown, theme toggle, demo chat CTA
    │       ├── BotNav.jsx         # Tab strip sub-navigation for single bot management
    │       └── Charts.jsx         # Custom SVG charts (VolumeArea, BhkBar, SentimentDonut, Heatmap)
    └── pages/
        ├── auth/
        │   ├── Login.jsx          # Login with 1-click test persona quick sign-in
        │   └── Signup.jsx         # Multi-industry workspace onboarding
        ├── dashboard/
        │   └── Dashboard.jsx      # Master executive KPI & analytics dashboard
        ├── bots/
        │   └── BotsList.jsx       # AI assistants hub with industry filters & search
        ├── wizard/
        │   ├── CreateBotWizard.jsx# 4-step progressive creation flow with live sandbox
        │   └── BotCreatedSuccess.jsx # Confetti celebration & shareable link distribution
        ├── bot/
        │   ├── BotOverview.jsx    # Bot telemetry, test console, and knowledge summary
        │   ├── BotChatHistory.jsx # Master-detail conversation transcript inspector
        │   ├── BotAnalytics.jsx   # Analytics charts, BHK breakdown, peak traffic hours
        │   ├── BotKnowledge.jsx   # Vector knowledge manager & chunk inspector modal
        │   ├── BotShare.jsx       # Embed customizer, live sandbox, and QR code generator
        │   └── BotSettings.jsx    # LLM temperature, prompt guidelines, and CRM webhooks
        ├── global/
        │   ├── GlobalHistory.jsx  # Cross-tenant unified conversation audit log
        │   ├── GlobalAnalytics.jsx# Platform-wide aggregate intelligence metrics
        │   ├── PricingPage.jsx    # Tiers, annual billing switch, and upgrade modal
        │   ├── AccountPage.jsx    # Persona switcher, profile info, and API keys
        │   └── HelpDocsPage.jsx   # Architecture blueprints and FAQ accordion
        └── chat/
            └── PublicChatPreview.jsx # Customer-facing standalone chatbot with rich property cards
```

---

## 💻 Tech Stack

- **Core**: React 18 (SPA) + Vite
- **Routing**: `react-router-dom` v6
- **Icons**: `lucide-react` (clean, modern iconography)
- **Visuals & Charts**: High-performance, lightweight custom SVG / HTML charts (zero heavy dependencies)
- **Effects**: `canvas-confetti` (for creation celebration)
- **Styling**: Pure Modern CSS Design System (CSS custom properties, glassmorphism, responsive grid, light/dark themes)
- **State & Storage**: React Context API (`PlatformContext`) with automatic `localStorage` persistence

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (v9 or higher)

### 1. Installation
Clone the repository or navigate to the workspace directory and install dependencies:
```bash
npm install
```

### 2. Run the Development Server
Start the local Vite dev server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000/
```

### 3. Verify Production Build
To test that the application compiles with zero errors:
```bash
npm run build
```

---

## 🧭 Complete Interactive User Journey Guide

Follow this walkthrough to experience the entire prototype:

1. **Sign In**:
   - Navigate to `/login`.
   - Click any **1-Click Demo Login** button (e.g., *Aarav Sharma — Prycoons Infrastructure*).
2. **Explore the Dashboard (`/`)**:
   - Inspect the KPI cards (Total Inquiries, Qualified Leads, Vector Chunks, Latency).
   - Review the **Inquiry Traffic & Lead Ingestion Velocity** chart and **Property Inquiries by Type** bar chart.
   - Click the **"Live Demo: Prycoons AI"** button in the top bar to open the customer chatbot in a new tab.
3. **Create a New Bot (`/bots/create`)**:
   - **Step 1 (Basic Info)**: Select an industry (e.g. *Real Estate* or *Healthcare*), choose an avatar, and enter a name. Click **Continue**.
   - **Step 2 (Knowledge Hub)**: Click **"Crawl Pages"** or click the upload dropzone to simulate uploading a PDF brochure. Click **Continue**.
   - **Step 3 (Persona & Instructions)**: Choose a conversational tone, edit the welcome greeting, and verify lead capture fields. Click **Continue**.
   - **Step 4 (Review & Sandbox)**: Test sending a message in the live mini-chat sandbox on the right. Click **"Deploy & Launch Assistant"**.
4. **Success Screen (`/bots/create/success/:id`)**:
   - Experience the confetti animation. Click **"Copy"** to copy the shareable link or click **"Manage Bot Suite"**.
5. **Manage Prycoons AI (`/bots/prycoons-ai/*`)**:
   - **Overview**: Send a test inquiry like *"Show me 3BHK options"* in the right-hand test console.
   - **Chat History**: Click on Rajesh Patel or Meera Sengupta in the left list to inspect full transcripts with attached property cards, lead tags, and click **"Export"**.
   - **Analytics**: Toggle between `7D`, `30D`, `90D` to view visitor volume, sentiment breakdown, and peak hours heatmap.
   - **Knowledge Base**: Click the **Eye icon (Inspect Chunks)** on any document to view raw vectorized text chunks. Click **"Add Knowledge Source"** to test adding a URL.
   - **Share & Embed**: Change the widget color picker, switch between Bottom-Right and Bottom-Left, and click the floating launcher bubble in the live simulated browser window. Download the QR Code.
   - **Settings**: Adjust the temperature slider, edit the prompt guidelines, or update the CRM webhook URL.
6. **Customer Experience (`/chat/prycoons-ai`)**:
   - Click the prompt pill *"Show me 3 BHK options in Ahmedabad"*.
   - View the interactive **Prycoons Emerald Heights** property card.
   - Click **"Book Visit"** to open the VIP Site Visit modal.
   - Enter your name and phone number, then submit to receive the immediate on-screen confirmation and lead qualification badge.
7. **Pricing & Plans (`/pricing`)**:
   - Toggle between **Monthly** and **Annual (Save 20%)**.
   - Click **"Upgrade to Growth"** or **"Select Starter"** to test the upgrade confirmation modal.

---

## 📄 License & Credits

- **Domain Model**: Inspired by [Prycoons](https://prycoons.com/) real-estate excellence across Gujarat, Ahmedabad, and GIFT City.
- **Platform Architecture**: Built with modern AI-native UI/UX design patterns inspired by leading conversational platforms (Botpress, Intercom, Voiceflow, Chatbase).
