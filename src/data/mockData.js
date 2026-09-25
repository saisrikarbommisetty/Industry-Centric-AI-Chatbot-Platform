// Rich Domain Mock Data for BRIM Assistant Platform

export const INDUSTRIES = [
  { id: 'real-estate', name: 'Real Estate & Property', icon: 'Building2', badgeClass: 'badge-primary', color: '#C85C4A', desc: 'Property discovery, BHK queries, site visits, brochure distribution, project guidance' },
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
    description: 'Conversational assistant for Prycoons Real Estate. Guides visitors through luxury apartments, BHK configurations, project pricing, brochures, and visit bookings.',
    status: 'active',
    model: 'BRIM Conversational Model',
    tone: 'Professional & Consultative',
    welcomeMessage: 'Hello 👋 Welcome to Prycoons Real Estate! How can we help you today? Explore luxury 2/3/4 BHK residences, commercial spaces on SG Highway, or investment opportunities in GIFT City.',
    promptGuidelines: 'Represent Prycoons Real Estate clearly and warmly. Provide accurate BHK sizes, pricing ranges, amenities, and RERA details. Help visitors schedule a site visit or download project brochures.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'preferredBhk', 'budget'],
    primaryColor: '#C85C4A',
    suggestedQuestions: [
      'Explore properties',
      'Find a suitable project',
      'Ask about pricing',
      'Talk to our team'
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
      'What are the eligibility criteria for B.Tech?',
      'Tell me about merit scholarships',
      'Application deadlines for Fall 2026'
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
    welcomeMessage: 'Hello, welcome to CarePoint Clinics. 🩺 How may we assist you with appointments or clinic timings?',
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
    leadStatus: 'Site Visit Requested',
    leadInterest: '3 BHK Science City Road (Emerald Heights)',
    budget: '₹1.50 Cr - ₹1.80 Cr',
    channel: 'Website Widget',
    timestamp: 'Today, 14:22',
    duration: '3m 45s',
    messagesCount: 6,
    sentiment: 'Positive',
    status: 'active',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hi, I am looking for a 3 BHK luxury flat near Science City with possession in 2027.',
        time: '14:22'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Welcome! For 3 BHK residences on Science City Road, we feature **Prycoons Emerald Heights**.\n\n• **Configuration**: 3 BHK Luxury Living\n• **Carpet Area**: 1,950 – 2,400 sq.ft.\n• **Price**: ₹1.35 Cr to ₹1.85 Cr\n• **Possession**: March 2027 (RERA: `PR/GJ/AHMEDABAD/DASKROI/AUDA/RAA11045/050823`)\n• **Highlights**: 30,000 sq.ft. clubhouse, squash courts, and zen garden.\n\nWould you like to schedule an on-site visit or download the floor plan brochure?',
        time: '14:22',
        propertyCard: PRYCOONS_PROJECTS[2]
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'Yes, please schedule a visit for Saturday morning around 11 AM.',
        time: '14:24'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'I would be happy to arrange your visit! Please share your contact number to confirm the appointment.',
        time: '14:24'
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'My name is Vikram Patel, phone is +91 98250 14890.',
        time: '14:25'
      },
      {
        id: 'm6',
        sender: 'bot',
        text: 'Your site visit for Emerald Heights on Saturday at 11:00 AM is confirmed! Our property advisor will call you with location details.',
        time: '14:25',
        leadCaptured: true
      }
    ]
  },
  {
    id: 'conv-102',
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
  },
  {
    id: 'conv-103',
    botId: 'prycoons-ai',
    botName: 'BRIM Real Estate Assistant',
    userName: 'Mehul Shah',
    userEmail: 'mehul.shah@zydusgroup.com',
    userPhone: '+91 99099 22334',
    leadStatus: 'VIP Tour Requested',
    leadInterest: 'The Sovereign Sky Villas (5 BHK Duplex)',
    budget: '₹7.0 Cr - ₹9.0 Cr',
    channel: 'Website Widget',
    timestamp: 'Yesterday, 18:40',
    duration: '5m 10s',
    messagesCount: 5,
    sentiment: 'Positive',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Tell me about the largest sky villa available on SG Highway.',
        time: '18:40'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'For unmatched luxury and privacy, we present **The Sovereign Sky Villas** in Bodakdev, just off SG Highway. These 5 BHK duplex sky mansions offer **6,800 sq.ft. carpet area** with private heated plunge pools and 14-ft high ceilings.',
        time: '18:40',
        propertyCard: PRYCOONS_PROJECTS[0]
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'What are the parking arrangements?',
        time: '18:42'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'Each 5 BHK villa includes **4 dedicated basement parking slots with EV charging stations**, plus a private dedicated access elevator.\n\nThe Sovereign is an exclusive community of only 38 luxury residences.',
        time: '18:42'
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Excellent. Have your private client director call me tomorrow.',
        time: '18:43'
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
