// Rich Domain Mock Data for BRIM Assistant Platform

export const INDUSTRIES = [
  { id: 'real-estate', name: 'Real Estate & Property', icon: 'Building2', badgeClass: 'badge-primary', color: '#C85C4A', desc: 'Property discovery, BHK queries, site visits, brochure distribution, project guidance' },
  { id: 'marketing', name: 'Marketing & Creative Agency', icon: 'Sparkles', badgeClass: 'badge-cyan', color: '#2A7E8C', desc: 'Brand identity, website UX, social growth, creative campaigns, client intake' },
  { id: 'education', name: 'Education & Admissions', icon: 'GraduationCap', badgeClass: 'badge-purple', color: '#7C5CB8', desc: 'Admissions, course discovery, fee structures, eligibility, campus inquiries' },
  { id: 'healthcare', name: 'Healthcare & Clinics', icon: 'HeartPulse', badgeClass: 'badge-danger', color: '#C85C4A', desc: 'Doctor appointment booking, clinic timings, department routing' },
  { id: 'hospitality', name: 'Hospitality & Stays', icon: 'Hotel', badgeClass: 'badge-gold', color: '#C99A52', desc: 'Room reservations, concierge, amenities, dining bookings' },
  { id: 'ecommerce', name: 'Retail & Commerce', icon: 'ShoppingBag', badgeClass: 'badge-cyan', color: '#2A7E8C', desc: 'Product lookup, size guidance, return policy, order assistance' },
  { id: 'legal', name: 'Professional Services', icon: 'Scale', badgeClass: 'badge-neutral', color: '#8E867B', desc: 'Client intake, consultation booking, services overview' }
];

export const PRYCOONS_PROJECTS = [
  {
    id: 'proj-sovereign',
    title: 'The Sovereign Sky Villas',
    tagline: 'Ultra-Luxury 4 & 5 BHK Sky Mansions',
    location: 'Bodakdev, SG Highway, Ahmedabad',
    bhk: '4 & 5 BHK',
    carpetArea: '4,200 - 6,800 sq.ft.',
    priceRange: '₹4.85 Cr - ₹8.50 Cr',
    status: 'Under Construction (Possession: Dec 2026)',
    reraNo: 'PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/RAA09821/220322',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Plunge Pool', '360° Sky Lounge', 'Concierge Desk', '4-Car Automated Parking', 'Private Elevator'],
    brochureUrl: '#download-brochure-sovereign',
    description: 'An iconic single-tower development offering sprawling palatial sky villas with uninterrupted skyline views of Ahmedabad and signature world-class finishes.'
  },
  {
    id: 'proj-gift-horizon',
    title: 'GIFT Horizon Towers',
    tagline: 'Smart Tech-Enabled 2 & 3 BHK High-Rise Residences',
    location: 'GIFT City SEZ, Gandhinagar - Ahmedabad Corridor',
    bhk: '2 & 3 BHK',
    carpetArea: '1,250 - 1,850 sq.ft.',
    priceRange: '₹95 Lakhs - ₹1.65 Cr',
    status: 'Ready to Move & Phase-2 Dec 2026',
    reraNo: 'PR/GJ/GANDHINAGAR/GANDHINAGAR/GDA/MAA08912/150123',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    amenities: ['District Cooling Integration', 'High-Speed Optical Fiber', 'Co-Working Business Pods', 'EV Fast Charging Hub', 'Rooftop Infinity Pool'],
    brochureUrl: '#download-brochure-gift',
    description: 'Located in India\'s first operational smart city and international financial services centre, offering attractive tax benefits and high rental yields.'
  },
  {
    id: 'proj-emerald',
    title: 'Prycoons Emerald Heights',
    tagline: 'Refined 3 BHK Living for Modern Families',
    location: 'Science City Road, Sola, Ahmedabad',
    bhk: '3 BHK',
    carpetArea: '1,950 - 2,400 sq.ft.',
    priceRange: '₹1.35 Cr - ₹1.85 Cr',
    status: 'Under Construction (Possession: March 2027)',
    reraNo: 'PR/GJ/AHMEDABAD/DASKROI/AUDA/RAA11045/050823',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    amenities: ['30,000 sq.ft. Clubhouse', 'Squash & Badminton Courts', 'Landscaped Zen Garden', '3-Tier Biometric Security', 'Banquet Hall'],
    brochureUrl: '#download-brochure-emerald',
    description: 'Crafted for families seeking balance between serene greenery and urban connectivity, situated 2 minutes from SG Highway.'
  },
  {
    id: 'proj-capital',
    title: 'Prycoons Capital Square',
    tagline: 'Grade-A Commercial Retail & Executive Corporate Suites',
    location: 'Main SG Highway, Near Vaishnodevi Circle, Ahmedabad',
    bhk: 'Commercial Retail / Offices',
    carpetArea: '850 - 12,500 sq.ft.',
    priceRange: 'Starting ₹82 Lakhs - ₹9.2 Cr',
    status: 'Pre-launch & Structural Glazing Complete',
    reraNo: 'PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/CAA07841/191122',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    amenities: ['Double-Height Grand Lobby', 'Central HVAC Air Conditioning', '10 High-Speed Elevators', 'Robotic Multi-Level Parking', 'Rooftop Cafeteria'],
    brochureUrl: '#download-brochure-capital',
    description: 'Ahmedabad’s newest landmark commercial hub designed with sustainable IGBC Gold certified architecture and maximum frontage.'
  }
];

export const INITIAL_BOTS = [
  {
    id: 'prycoons-ai',
    name: 'BRIM Real Estate Assistant',
    avatar: '🏢',
    industryId: 'real-estate',
    industryName: 'Real Estate & Property',
    description: 'Conversational assistant for Prycoons Real Estate. Naturally guides visitors through luxury apartments, BHK configurations, project pricing, brochures, and visit bookings.',
    status: 'active',
    model: 'BRIM Conversational Model',
    tone: 'Warm, Consultative & Friendly',
    welcomeMessage: 'Hi there 👋 Good day! Welcome to Prycoons Real Estate. How is your day going so far? May I know your name?',
    promptGuidelines: 'Represent Prycoons Real Estate with human warmth and consultative expertise. Ask one natural question at a time. Mix personal lifestyle questions with property criteria, summarize matches, offer WhatsApp shortlist delivery, and connect to advisors.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'preferredBhk', 'budget'],
    primaryColor: '#C85C4A',
    suggestedQuestions: [
      'Looking to Buy 🏡',
      'Thinking of Renting 🔑',
      'Just Browsing ✨',
      'Explore properties'
    ],
    sourcesCount: 5,
    totalConversations: 342,
    leadCount: 28,
    csat: 4.9,
    avgResponseTime: '0.8s',
    createdAt: '2026-08-10',
    lastActive: '5 minutes ago'
  },
  {
    id: 'apex-brand-ai',
    name: 'Apex Creative & Branding Assistant',
    avatar: '⚡',
    industryId: 'marketing',
    industryName: 'Marketing & Creative Agency',
    description: 'Brand identity, UI/UX design, performance social marketing, and client intake assistant with location-aware trend conversations.',
    status: 'active',
    model: 'BRIM Conversational Model',
    tone: 'Creative, Friendly & Consultative',
    welcomeMessage: 'Hi there 👋 Good day! Welcome to Apex Brand Studio. I’m Maya. May I know your name?',
    promptGuidelines: 'Understand client brand stories, discover their creative & marketing requirements, mix light aesthetic questions with strategic goals, share portfolio one-liners, and capture leads.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'serviceNeeded', 'budget'],
    primaryColor: '#2A7E8C',
    suggestedQuestions: [
      'Eco-friendly startup 🌱',
      'Brand identity & logo 🎨',
      'Website & UX design 💻',
      'Social media growth 📈'
    ],
    sourcesCount: 4,
    totalConversations: 215,
    leadCount: 22,
    csat: 4.92,
    avgResponseTime: '0.7s',
    createdAt: '2026-08-15',
    lastActive: 'Just now'
  },
  {
    id: 'edunova-ai',
    name: 'EduNova Admissions Assistant',
    avatar: '🎓',
    industryId: 'education',
    industryName: 'Education & Admissions',
    description: 'Student advisory assistant for academic degree admissions, scholarship eligibility, and campus visit bookings.',
    status: 'active',
    model: 'BRIM Conversational Model',
    tone: 'Encouraging & Helpful',
    welcomeMessage: 'Welcome to EduNova University! 🎓 How can we help guide your academic journey today?',
    promptGuidelines: 'Guide prospective students on eligibility, curriculum, faculty, fee structures, and campus life.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'programInterest'],
    primaryColor: '#7C5CB8',
    suggestedQuestions: [
      'Undergraduate B.Tech / BBA',
      'Postgraduate MBA / M.Tech',
      'Merit scholarship eligibility',
      'Fall 2026 application deadlines'
    ],
    sourcesCount: 4,
    totalConversations: 186,
    leadCount: 19,
    csat: 4.85,
    avgResponseTime: '0.6s',
    createdAt: '2026-08-18',
    lastActive: '12 mins ago'
  },
  {
    id: 'carepoint-ai',
    name: 'CarePoint Clinic Assistant',
    avatar: '🩺',
    industryId: 'healthcare',
    industryName: 'Healthcare & Clinics',
    description: 'Patient routing, specialist doctor discovery, OPD clinic timings, and consultation scheduling assistant.',
    status: 'active',
    model: 'BRIM Conversational Model',
    tone: 'Empathetic & Clear',
    welcomeMessage: 'Hello, welcome to CarePoint Clinics. 🩺 How may we assist you with appointments or clinic timings today?',
    promptGuidelines: 'Help patients find the right specialty, check OPD timings, and schedule consultations.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'department', 'preferredDate'],
    primaryColor: '#C85C4A',
    suggestedQuestions: [
      'Book a doctor consultation',
      'Check cardiology clinic hours',
      'Emergency OPD information'
    ],
    sourcesCount: 3,
    totalConversations: 142,
    leadCount: 14,
    csat: 4.9,
    avgResponseTime: '0.7s',
    createdAt: '2026-08-25',
    lastActive: '1 hour ago'
  },
  {
    id: 'luxestay-ai',
    name: 'LuxeStay Concierge',
    avatar: '🛎️',
    industryId: 'hospitality',
    industryName: 'Hospitality & Stays',
    description: 'Virtual concierge for resort suite bookings, dining reservations, spa packages, and local experiences.',
    status: 'idle',
    model: 'BRIM Conversational Model',
    tone: 'Courteous & Attentive',
    welcomeMessage: 'Welcome to LuxeStay Palace & Resorts. 🛎️ How can we assist with your stay or dining reservations today?',
    promptGuidelines: 'Provide personalized luxury hospitality service, describe villa amenities, and process reservations.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'email', 'phone', 'checkIn', 'guests'],
    primaryColor: '#C99A52',
    suggestedQuestions: [
      'Presidential suite availability',
      'Fine dining restaurant reservations',
      'Spa and wellness packages'
    ],
    sourcesCount: 3,
    totalConversations: 95,
    leadCount: 8,
    csat: 4.88,
    avgResponseTime: '0.7s',
    createdAt: '2026-09-02',
    lastActive: '3 hours ago'
  }
];

export const INITIAL_KNOWLEDGE_SOURCES = [
  {
    id: 'src-1',
    botId: 'prycoons-ai',
    title: 'The Sovereign Sky Villas — Project Brochure & Specifications',
    type: 'pdf',
    size: '4.2 MB',
    url: 'https://prycoons.com/docs/the-sovereign-brochure.pdf',
    chunks: 42,
    status: 'synced',
    lastSync: '2 hours ago',
    extractedSummary: 'Structural specifications, floor plans for 4BHK (4,200 sq.ft) & 5BHK (6,800 sq.ft), luxury fittings, RERA number PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/RAA09821/220322, price sheet, and possession timelines.'
  },
  {
    id: 'src-2',
    botId: 'prycoons-ai',
    title: 'GIFT Horizon Towers — Floor Plan & Investment Guide',
    type: 'pdf',
    size: '3.1 MB',
    url: 'https://prycoons.com/docs/gift-horizon-guide.pdf',
    chunks: 31,
    status: 'synced',
    lastSync: '5 hours ago',
    extractedSummary: 'GIFT City SEZ special tax incentives, 2 BHK (1,250 sq.ft) and 3 BHK (1,850 sq.ft) master layouts, pricing from ₹95L, rental yield projections of 7.2%.'
  },
  {
    id: 'src-3',
    botId: 'prycoons-ai',
    title: 'https://prycoons.com/projects/emerald-heights',
    type: 'url',
    size: '184 KB',
    url: 'https://prycoons.com/projects/emerald-heights',
    chunks: 16,
    status: 'synced',
    lastSync: '1 day ago',
    extractedSummary: 'Full website page details with Science City location map, 30+ amenities list, 3BHK pricing breakdown, payment schedule, and construction progress.'
  },
  {
    id: 'src-4',
    botId: 'prycoons-ai',
    title: 'https://prycoons.com/projects/capital-square',
    type: 'url',
    size: '220 KB',
    url: 'https://prycoons.com/projects/capital-square',
    chunks: 24,
    status: 'synced',
    lastSync: '1 day ago',
    extractedSummary: 'Grade-A commercial retail shops and executive office spaces on SG Highway. Unit carpet areas from 850 sq.ft to 12,500 sq.ft. IGBC Gold certification specifications.'
  },
  {
    id: 'src-5',
    botId: 'prycoons-ai',
    title: 'Prycoons Frequently Asked Questions (FAQ Guide)',
    type: 'faq',
    size: '48 KB',
    url: 'Prycoons_Customer_FAQ_Master.csv',
    chunks: 28,
    status: 'synced',
    lastSync: '2 days ago',
    extractedSummary: 'Answers for home loan tie-ups with HDFC/SBI, site visit procedures, stamp duty schedules, and possession handover guidelines.'
  },
  {
    id: 'src-6',
    botId: 'apex-brand-ai',
    title: 'Apex Agency 2026 Creative Portfolio & Rate Deck',
    type: 'pdf',
    size: '5.6 MB',
    url: 'https://apexbrand.studio/docs/portfolio-2026.pdf',
    chunks: 38,
    status: 'synced',
    lastSync: 'Just now',
    extractedSummary: 'Case studies for D2C brands, tech startups, brand identity systems, high-converting Figma UI/UX designs, and social growth sprint packages.'
  }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-101',
    botId: 'prycoons-ai',
    botName: 'BRIM Real Estate Assistant',
    userName: 'Vikram Patel',
    userEmail: 'vikram.p@apexcapital.in',
    userPhone: '+91 98250 14890',
    leadStatus: 'Shortlist Sent & Advisor Assigned',
    leadInterest: '3 BHK Science City Road (Emerald Heights)',
    budget: '₹1.35 Cr - ₹1.85 Cr',
    channel: 'Website Widget',
    timestamp: 'Today, 14:22',
    duration: '3m 45s',
    messagesCount: 12,
    sentiment: 'Positive',
    status: 'active',
    transcript: [
      {
        id: 'm1',
        sender: 'bot',
        text: 'Hi there 👋 Good afternoon! Welcome to Prycoons Real Estate.\n\nIt’s a sunny afternoon here in Ahmedabad ☀️. Hope you’re staying cool and having a productive day! May I know your name?',
        time: '14:22'
      },
      {
        id: 'm2',
        sender: 'user',
        text: 'Hi, I am Vikram Patel.',
        time: '14:22'
      },
      {
        id: 'm3',
        sender: 'bot',
        text: 'Nice to meet you, Vikram! 👋\n\nSo tell me — are you looking to buy a new home, thinking about renting, or just casually browsing what’s out there?',
        time: '14:23'
      },
      {
        id: 'm4',
        sender: 'user',
        text: 'Looking to buy a 3BHK for my family.',
        time: '14:23'
      },
      {
        id: 'm5',
        sender: 'bot',
        text: 'Exciting! Buying a home is a wonderful milestone 🏡.\n\nBefore we dive into locations, quick one 😄 — do you prefer Netflix nights in a cozy lounge 🍿 or morning walks on a wide open balcony 🌅?',
        time: '14:23'
      },
      {
        id: 'm6',
        sender: 'user',
        text: 'Morning walks and open balcony 🌅',
        time: '14:24'
      },
      {
        id: 'm7',
        sender: 'bot',
        text: 'Love that 🌅! A home with a wide breezy balcony and lush gardens nearby will give you that peaceful start every day.\n\nWhich area in town are you leaning towards — somewhere like Ambli, SG Highway, Science City Road, or Bodakdev?',
        time: '14:24'
      },
      {
        id: 'm8',
        sender: 'user',
        text: 'Science City Road near Sola.',
        time: '14:24'
      },
      {
        id: 'm9',
        sender: 'bot',
        text: 'Got it 👍 A 3 BHK in Science City / Sola with an open balcony.\n\nHere is our prime match that fits your lifestyle:\n\n✨ **Prycoons Emerald Heights** — Refined 3 BHK Living for Modern Families\n• **Configuration**: 3 BHK (1,950 – 2,400 sq.ft.)\n• **Price Guide**: ₹1.35 Cr to ₹1.85 Cr\n• **Highlights**: 30,000 sq.ft. Clubhouse, Landscaped Zen Garden, Squash Courts\n\nWould you like me to share the complete shortlist & floor plan brochure on WhatsApp or Email?',
        time: '14:25',
        propertyCard: PRYCOONS_PROJECTS[2]
      },
      {
        id: 'm10',
        sender: 'user',
        text: 'Send on WhatsApp please. My number is +91 98250 14890, email is vikram.p@apexcapital.in',
        time: '14:25'
      },
      {
        id: 'm11',
        sender: 'bot',
        text: 'Thanks Vikram 🙌 I’ve saved your preferences!\n\nI’m sending your curated brochure packet to **+91 98250 14890**.\n\nWould you like me to connect you with one of our senior property advisors for a quick 5-minute call or schedule a private site tour?',
        time: '14:26',
        leadCaptured: true
      },
      {
        id: 'm12',
        sender: 'user',
        text: 'Yes please, arrange a call with an advisor for Saturday morning.',
        time: '14:26'
      }
    ]
  },
  {
    id: 'conv-102',
    botId: 'apex-brand-ai',
    botName: 'Apex Creative & Branding Assistant',
    userName: 'Rahul Sharma',
    userEmail: 'rahul@greentech.in',
    userPhone: '+91 98980 34567',
    leadStatus: 'Portfolio Shared',
    leadInterest: 'Brand Identity & Website Design',
    budget: '₹2.5 Lakhs - ₹5.0 Lakhs',
    channel: 'Website Widget',
    timestamp: 'Today, 11:15',
    duration: '2m 50s',
    messagesCount: 8,
    sentiment: 'Positive',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'bot',
        text: 'Hi there 👋 Good morning! Welcome to Apex Brand Studio.\n\nIt’s a bright sunny morning in Ahmedabad ☀️. Have you had your morning coffee yet? I’m Maya. May I know your name?',
        time: '11:15'
      },
      {
        id: 'm2',
        sender: 'user',
        text: 'Rahul',
        time: '11:15'
      },
      {
        id: 'm3',
        sender: 'bot',
        text: 'Hi Rahul 👋 Nice to meet you! Welcome to Apex Brand Studio! I’m here to help you make your brand stand out. What’s your brand’s story or what are you building?',
        time: '11:16'
      },
      {
        id: 'm4',
        sender: 'user',
        text: 'We are a startup focusing on eco-friendly packaging solutions.',
        time: '11:16'
      },
      {
        id: 'm5',
        sender: 'bot',
        text: 'That’s interesting! 🌱 Are you mainly looking for help with branding, social media, website design, or something else?',
        time: '11:17'
      },
      {
        id: 'm6',
        sender: 'user',
        text: 'We need full brand identity and a modern website.',
        time: '11:17'
      },
      {
        id: 'm7',
        sender: 'bot',
        text: 'Brand Identity & Web Design is our sweet spot! 🎨 We craft everything from logo systems to responsive web experiences.\n\nShould I send our complete agency portfolio and startup rate deck to your WhatsApp or Email?',
        time: '11:18'
      },
      {
        id: 'm8',
        sender: 'user',
        text: 'WhatsApp to +91 98980 34567, email rahul@greentech.in',
        time: '11:18',
        leadCaptured: true
      }
    ]
  },
  {
    id: 'conv-103',
    botId: 'prycoons-ai',
    botName: 'BRIM Real Estate Assistant',
    userName: 'Rajesh & Suman Gupta',
    userEmail: 'r.gupta@dubaiholding.ae',
    userPhone: '+971 50 891 2345',
    leadStatus: 'Brochure Downloaded',
    leadInterest: '2 & 3 BHK GIFT City Horizon Towers',
    budget: '₹95 Lakhs - ₹1.50 Cr',
    channel: 'Direct Link',
    timestamp: 'Today, 11:05',
    duration: '2m 10s',
    messagesCount: 4,
    sentiment: 'Positive',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Are there special tax incentives or high rental yield properties in GIFT City?',
        time: '11:05'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Yes! **GIFT Horizon Towers** in GIFT City SEZ offers projected rental yields of **6.8% – 7.5%** with special SEZ tax advantages.\n\n• **Configurations**: 2 & 3 BHK Smart Tech Residences\n• **Pricing**: ₹95 Lakhs to ₹1.65 Cr\n• **Key Features**: District cooling integration, EV fast-charging hub, and business pods.\n\nWould you like the complete investment overview brochure?',
        time: '11:05',
        propertyCard: PRYCOONS_PROJECTS[1]
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'Yes, please share the floor plan specs.',
        time: '11:06'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'Here is your direct brochure link: [Download GIFT Horizon Towers Master Plan (PDF)](#download). Our NRI investment desk is available if you would like an ROI calculation.',
        time: '11:06'
      }
    ]
  }
];

export const MOCK_ANALYTICS = {
  overview: {
    totalConversations: 342,
    conversationsChange: '+18.4%',
    totalVisitors: 218,
    visitorsChange: '+14.2%',
    totalLeadsCaptured: 28,
    leadsChange: '+22.0%',
    avgResolutionRate: '96.4%',
    avgResponseTime: '0.8s',
    avgCsatScore: '4.9 / 5.0'
  },
  dailyVolume: [
    { date: 'Mon', total: 42, leads: 4 },
    { date: 'Tue', total: 48, leads: 3 },
    { date: 'Wed', total: 54, leads: 5 },
    { date: 'Thu', total: 46, leads: 4 },
    { date: 'Fri', total: 62, leads: 6 },
    { date: 'Sat', total: 52, leads: 4 },
    { date: 'Sun', total: 38, leads: 2 }
  ],
  bhkDistribution: [
    { label: '3 BHK Residences', count: 154, percentage: 45, color: '#C85C4A' },
    { label: '2 BHK Smart Units', count: 102, percentage: 30, color: '#C99A52' },
    { label: '4 & 5 BHK Sky Villas', count: 62, percentage: 18, color: '#2D7A5E' },
    { label: 'Commercial & Retail', count: 24, percentage: 7, color: '#7C5CB8' }
  ],
  sentimentBreakdown: [
    { sentiment: 'Positive / Satisfied', percentage: 92, color: '#2D7A5E' },
    { sentiment: 'Informational', percentage: 7, color: '#C99A52' },
    { sentiment: 'Follow-up Needed', percentage: 1, color: '#C85C4A' }
  ],
  topQuestions: [
    { question: 'What is the price of 3 BHK in Science City / Sola?', count: 88 },
    { question: 'What are the GIFT City tax exemptions for buyers?', count: 64 },
    { question: 'Can I schedule a weekend site visit?', count: 52 },
    { question: 'What is the RERA number of The Sovereign?', count: 39 }
  ]
};

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Standard',
    priceMonthly: 29,
    priceAnnual: 24,
    description: 'Ideal for single projects or boutique firms.',
    features: [
      '1 Active Assistant',
      'Up to 1,500 Conversations/mo',
      'Knowledge Base Sync (PDF & Web)',
      'Lead Capture & Email Notifications',
      'Standard Website Widget',
      'Email Support'
    ],
    cta: 'Select Starter',
    popular: false
  },
  {
    id: 'growth',
    name: 'Growth Pro',
    badge: 'Recommended',
    priceMonthly: 79,
    priceAnnual: 65,
    description: 'Tailored for growing developers, brands, and multi-project portals.',
    features: [
      '5 Active Industry Assistants',
      'Up to 10,000 Conversations/mo',
      'Full Knowledge Base Sync + Auto-Crawl',
      'Lead Qualification & Webhooks',
      'Bespoke Brand Styling',
      'Rich Project Cards & Brochure Triggers',
      'QR Code & Share Links',
      'Priority Support'
    ],
    cta: 'Current Plan',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Custom',
    priceMonthly: 249,
    priceAnnual: 199,
    description: 'For enterprises requiring custom setups, dedicated support, and higher volumes.',
    features: [
      'Unlimited Assistants',
      'Unlimited Conversations & Leads',
      'Multi-domain Knowledge Sources',
      'Dedicated Account Manager',
      'Custom SLA & Enterprise Support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

// Single Demo User for the workspace prototype
export const DEMO_USER = {
  id: 'user-sai',
  name: 'Sai Srikar',
  email: 'saisrikar@example.com',
  password: 'saisrikarbrim@123',
  role: 'Client Director',
  organization: 'BRIM Workspace',
  avatar: 'SS',
  plan: 'Growth Pro',
  creditsRemaining: '8,158 / 10,000'
};

export const DEMO_USERS = [DEMO_USER];
