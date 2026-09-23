// Rich Domain Mock Data for Industry-Centric AI Chatbot Platform

export const INDUSTRIES = [
  { id: 'real-estate', name: 'Real Estate & Infrastructure', icon: 'Building2', badgeClass: 'badge-primary', color: '#3b82f6', desc: 'Property discovery, BHK queries, site visits, brochure distribution, RERA guidance' },
  { id: 'education', name: 'Education & EdTech', icon: 'GraduationCap', badgeClass: 'badge-purple', color: '#8b5cf6', desc: 'Admissions, course discovery, fee structures, eligibility, scholarship counseling' },
  { id: 'healthcare', name: 'Healthcare & Clinics', icon: 'HeartPulse', badgeClass: 'badge-danger', color: '#f43f5e', desc: 'Doctor appointment booking, clinic timings, insurance queries, department routing' },
  { id: 'hospitality', name: 'Hospitality & Luxury Stays', icon: 'Hotel', badgeClass: 'badge-amber', color: '#f59e0b', desc: 'Room reservations, concierge, amenities, dining bookings, local tour guidance' },
  { id: 'ecommerce', name: 'E-Commerce & Retail', icon: 'ShoppingBag', badgeClass: 'badge-cyan', color: '#06b6d4', desc: 'Product lookup, size guidance, return policy, order status tracking, upselling' },
  { id: 'legal', name: 'Legal & Compliance', icon: 'Scale', badgeClass: 'badge-neutral', color: '#94a3b8', desc: 'Client intake, initial case triage, consultation booking, fee estimates' }
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
    name: 'Prycoons AI Assistant',
    avatar: '🏢',
    industryId: 'real-estate',
    industryName: 'Real Estate & Infrastructure',
    description: 'Autonomous property advisor for Prycoons Real Estate. Handles luxury apartment discovery, BHK specifications, RERA queries, brochure downloads, and site visit bookings.',
    status: 'active',
    model: 'Gemini 1.5 Pro (Domain-Tuned)',
    tone: 'Consultative, Professional & Prestigious',
    welcomeMessage: 'Hello and welcome to Prycoons! 🏙️ I am your dedicated AI Real Estate Advisor. Are you looking to explore 2/3/4 BHK luxury residences, commercial spaces on SG Highway, or high-yield investment properties in GIFT City?',
    promptGuidelines: 'You are the official AI representative of Prycoons Real Estate. Provide accurate BHK, sq.ft., price, amenities, and RERA details. Proactively offer brochure downloads and prompt visitors to schedule an on-site visit or VIP private tour.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'preferredBhk', 'budget', 'preferredLocation'],
    primaryColor: '#3b82f6',
    suggestedQuestions: [
      'Show me 3 BHK options in Ahmedabad',
      'What are the details of The Sovereign Sky Villas?',
      'Tell me about GIFT City residential projects',
      'What is the price range and RERA of Emerald Heights?',
      'Book a private site visit for this weekend'
    ],
    sourcesCount: 6,
    totalConversations: 1842,
    leadCount: 528,
    csat: 4.92,
    avgResponseTime: '0.8s',
    createdAt: '2026-08-10',
    lastActive: 'Just now'
  },
  {
    id: 'edunova-ai',
    name: 'EduNova Admissions Assistant',
    avatar: '🎓',
    industryId: 'education',
    industryName: 'Education & EdTech',
    description: 'Admissions and course counselor for university programs, scholarships, entrance eligibility, and campus visit scheduling.',
    status: 'active',
    model: 'Gemini 1.5 Flash (Fast)',
    tone: 'Encouraging, Educational & Helpful',
    welcomeMessage: 'Welcome to EduNova University! 🎓 How can I help you today? Ask about engineering, business or design degrees, scholarships, or admissions deadlines.',
    promptGuidelines: 'Guide prospective students on eligibility, curriculum, faculty, fee structures, and campus life.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'programInterest'],
    primaryColor: '#8b5cf6',
    suggestedQuestions: [
      'What are the eligibility criteria for B.Tech Computer Science?',
      'Tell me about merit-based scholarships',
      'What are the application deadlines for Fall 2026?'
    ],
    sourcesCount: 4,
    totalConversations: 924,
    leadCount: 310,
    csat: 4.85,
    avgResponseTime: '0.6s',
    createdAt: '2026-08-18',
    lastActive: '12 mins ago'
  },
  {
    id: 'carepoint-ai',
    name: 'CarePoint Health Navigator',
    avatar: '🩺',
    industryId: 'healthcare',
    industryName: 'Healthcare & Clinics',
    description: 'Patient routing, specialist doctor discovery, OPD clinic timings, and appointment booking assistant.',
    status: 'active',
    model: 'Gemini 1.5 Pro',
    tone: 'Empathetic, Precise & Reassuring',
    welcomeMessage: 'Hello, I am CarePoint AI Health Navigator. 🩺 How may I assist you with doctor appointments, department services, or clinic schedules?',
    promptGuidelines: 'Help patients find the right specialty, check OPD timings, and schedule consultations. Include medical disclaimers.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'department', 'preferredDate'],
    primaryColor: '#f43f5e',
    suggestedQuestions: [
      'Which cardiologist is available on Thursday?',
      'How do I book an MRI appointment?',
      'What are the emergency OPD hours?'
    ],
    sourcesCount: 5,
    totalConversations: 640,
    leadCount: 198,
    csat: 4.90,
    avgResponseTime: '0.9s',
    createdAt: '2026-08-25',
    lastActive: '1 hour ago'
  },
  {
    id: 'luxestay-ai',
    name: 'LuxeStay Concierge',
    avatar: '🛎️',
    industryId: 'hospitality',
    industryName: 'Hospitality & Luxury Stays',
    description: 'Virtual concierge for 5-star resort suite bookings, fine dining reservations, spa packages, and local experiences.',
    status: 'idle',
    model: 'Gemini 1.5 Flash',
    tone: 'Polished, Courteous & Attentive',
    welcomeMessage: 'Welcome to LuxeStay Palace & Resorts. 🛎️ It would be our pleasure to assist you with suite bookings, dining reservations, or custom itineraries.',
    promptGuidelines: 'Provide personalized luxury hospitality service, describe villa amenities, and process dining reservations.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'email', 'phone', 'checkIn', 'checkOut', 'guests'],
    primaryColor: '#f59e0b',
    suggestedQuestions: [
      'Show me presidential suite availability',
      'What are the fine dining restaurant timings?',
      'Can you book the Ayurvedic Spa ritual for 2?'
    ],
    sourcesCount: 3,
    totalConversations: 412,
    leadCount: 145,
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
    title: 'The Sovereign Sky Villas — Official Project Specifications',
    type: 'pdf',
    size: '4.2 MB',
    url: 'https://prycoons.com/docs/the-sovereign-brochure.pdf',
    chunks: 42,
    status: 'synced',
    lastSync: '2 hours ago',
    extractedSummary: 'Contains structural specifications, floor plans for 4BHK (4,200 sq.ft) & 5BHK (6,800 sq.ft), luxury fittings, RERA number PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/RAA09821/220322, price sheet, and possession timelines.'
  },
  {
    id: 'src-2',
    botId: 'prycoons-ai',
    title: 'GIFT Horizon Towers — Investment & Floor Plan Guide',
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
    extractedSummary: 'Full website page crawl with Science City location map, 30+ amenities list, 3BHK pricing breakdown, payment schedule, and construction progress photos.'
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
    title: 'Gujarat RERA Compliance & Buyer Protection Master Guidelines',
    type: 'pdf',
    size: '1.8 MB',
    url: 'https://prycoons.com/docs/gujarat-rera-compliance.pdf',
    chunks: 18,
    status: 'synced',
    lastSync: '3 days ago',
    extractedSummary: 'RERA validation protocols, escrow account safety, builder-buyer agreement terms, defect liability period of 5 years.'
  },
  {
    id: 'src-6',
    botId: 'prycoons-ai',
    title: 'Prycoons Frequently Asked Questions (FAQ Master)',
    type: 'faq',
    size: '48 KB',
    url: 'Prycoons_Customer_FAQ_Master.csv',
    chunks: 56,
    status: 'synced',
    lastSync: '4 days ago',
    extractedSummary: '56 verified Question-Answer pairs covering home loan partnerships (HDFC, SBI, ICICI), stamp duty in Gujarat (4.9% + 1%), maintenance charges, and visitor booking procedures.'
  }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-101',
    botId: 'prycoons-ai',
    botName: 'Prycoons AI Assistant',
    userName: 'Rajesh Patel',
    userEmail: 'rajesh.patel84@gmail.com',
    userPhone: '+91 98250 44129',
    leadStatus: 'Qualified Lead',
    leadInterest: '3 BHK in Science City (Emerald Heights)',
    budget: '₹1.50 Cr - ₹1.80 Cr',
    channel: 'Website Widget',
    timestamp: 'Today, 14:32',
    duration: '4m 12s',
    messagesCount: 7,
    sentiment: 'Very Positive (0.94)',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hello, I am looking for a 3BHK flat near Science City Ahmedabad with good amenities for my family.',
        time: '14:32'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Hello Rajesh! Welcome to Prycoons. We have the perfect project for you: **Prycoons Emerald Heights** located on Science City Road, Sola.',
        time: '14:32',
        sourceCitation: 'https://prycoons.com/projects/emerald-heights',
        propertyCard: PRYCOONS_PROJECTS[2]
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'What is the price and carpet area for the 3BHK units?',
        time: '14:33'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'At **Prycoons Emerald Heights**, the 3 BHK residences offer generous carpet areas ranging from **1,950 to 2,400 sq.ft.**\n\n- **Starting Price**: ₹1.35 Cr to ₹1.85 Cr (exclusive of stamp duty & registration)\n- **RERA No.**: `PR/GJ/AHMEDABAD/DASKROI/AUDA/RAA11045/050823`\n- **Possession**: March 2027 (Structure on 14th floor underway)\n\nKey family amenities include a 30,000 sq.ft. clubhouse, squash courts, landscaped zen gardens, and a dedicated children\'s play area.',
        time: '14:33',
        sourceCitation: 'The_Sovereign_Brochure_Specifications.pdf (Chunk #8)'
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Can I visit the sample flat this Saturday around 11 AM?',
        time: '14:34'
      },
      {
        id: 'm6',
        sender: 'bot',
        text: 'We would love to host you! I have pre-registered your VIP Site Visit for **Saturday at 11:00 AM** at Prycoons Emerald Heights Experiential Center, Science City Road.\n\nOur senior property advisor **Mr. Krunal Shah** will receive you. Shall I send the location pin and digital brochure to your WhatsApp?',
        time: '14:34',
        leadCaptured: true
      },
      {
        id: 'm7',
        sender: 'user',
        text: 'Yes please, that would be wonderful! Thank you.',
        time: '14:35'
      }
    ]
  },
  {
    id: 'conv-102',
    botId: 'prycoons-ai',
    botName: 'Prycoons AI Assistant',
    userName: 'Meera Sengupta (NRI)',
    userEmail: 'meera.sengupta@singtel.com',
    userPhone: '+65 9123 4567',
    leadStatus: 'High-Intent Investor',
    leadInterest: 'GIFT City 2 BHK Smart Residence',
    budget: '₹1.00 Cr - ₹1.25 Cr',
    channel: 'Direct Share Link',
    timestamp: 'Today, 11:15',
    duration: '6m 45s',
    messagesCount: 6,
    sentiment: 'Positive (0.88)',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hi, I am an NRI based in Singapore. Can you explain the investment prospects and tax benefits of GIFT City residential properties?',
        time: '11:15'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Namaste Meera! GIFT City (India\'s premier International Financial Services Centre) is one of the highest-yielding real estate corridors in Western India.\n\nOur showcase project **GIFT Horizon Towers** offers:\n- **Rental Yields**: 6.8% to 7.5% driven by tech & finance professionals\n- **Tax Incentives**: Favorable capital gains treatment and streamlined NRI repatriation protocols\n- **Pricing**: 2 BHK units from ₹95 Lakhs (1,250 sq.ft.)',
        time: '11:15',
        sourceCitation: 'GIFT_City_Investment_ROI_Guide.pdf',
        propertyCard: PRYCOONS_PROJECTS[1]
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'Is there a digital walkthrough or brochure I can review?',
        time: '11:17'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'Yes! You can instantly download the **GIFT Horizon Towers Complete Master Brochure & NRI Investment Dossier (PDF)** using the button below. I can also schedule an NRI video consultation over Zoom.',
        time: '11:17'
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Downloaded the brochure. Please arrange a Zoom meeting for Sunday.',
        time: '11:19'
      },
      {
        id: 'm6',
        sender: 'bot',
        text: 'Confirmed! We have scheduled your NRI Advisory Zoom call for **Sunday at 3:00 PM IST (5:30 PM Singapore Time)**. A calendar invite has been dispatched to your email.',
        time: '11:19',
        leadCaptured: true
      }
    ]
  },
  {
    id: 'conv-103',
    botId: 'prycoons-ai',
    botName: 'Prycoons AI Assistant',
    userName: 'Vikramaditya Singhania',
    userEmail: 'v.singhania@apexholding.in',
    userPhone: '+91 99099 87654',
    leadStatus: 'Ultra-HNW Luxury Buyer',
    leadInterest: 'The Sovereign Sky Villas (5 BHK Mansion)',
    budget: '₹7.0 Cr - ₹9.0 Cr',
    channel: 'Website Widget',
    timestamp: 'Yesterday, 18:40',
    duration: '5m 10s',
    messagesCount: 5,
    sentiment: 'Very Positive (0.98)',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Tell me about the largest penthouse or sky villa you have available on SG Highway.',
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
        text: 'What are the parking arrangements and who are the other occupants?',
        time: '18:42'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'Each 5 BHK villa includes **4 dedicated basement parking slots with EV charging stations**, plus a private dedicated access elevator.\n\nThe Sovereign is an exclusive community of only 38 luxury residences reserved for distinguished business leaders and industrialists.',
        time: '18:42'
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Excellent. Have your private client director call me tomorrow.',
        time: '18:43'
      }
    ]
  },
  {
    id: 'conv-104',
    botId: 'prycoons-ai',
    botName: 'Prycoons AI Assistant',
    userName: 'Ananya Sharma',
    userEmail: 'ananya.s@technova.com',
    userPhone: '+91 97123 00891',
    leadStatus: 'Commercial Investor',
    leadInterest: 'Capital Square SG Highway Office Space',
    budget: '₹1.00 Cr - ₹2.50 Cr',
    channel: 'QR Code Scan',
    timestamp: '22 Sep 2026, 16:10',
    duration: '3m 20s',
    messagesCount: 4,
    sentiment: 'Positive (0.85)',
    status: 'resolved',
    transcript: [
      {
        id: 'm1',
        sender: 'user',
        text: 'I just scanned the billboard at Vaishnodevi circle. Looking for 1,500 sq ft office space.',
        time: '16:10'
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Welcome to **Prycoons Capital Square**! We have executive corner corporate suites of **1,550 sq.ft.** on the 8th & 11th floors with main SG Highway road frontage.',
        time: '16:10',
        propertyCard: PRYCOONS_PROJECTS[3]
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'What is the price per sq ft and payment plan?',
        time: '16:12'
      },
      {
        id: 'm4',
        sender: 'bot',
        text: 'Base rate starts at **₹6,250 / sq.ft.** with an investor-friendly 20:80 construction-linked payment plan. RERA approved (`PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/CAA07841/191122`).',
        time: '16:12'
      }
    ]
  }
];

export const MOCK_ANALYTICS = {
  overview: {
    totalConversations: 3818,
    conversationsChange: '+24.6%',
    totalLeadsCaptured: 1181,
    leadsChange: '+31.2%',
    avgResolutionRate: '94.2%',
    resolutionChange: '+2.1%',
    avgResponseTime: '0.78s',
    responseTimeChange: '-18.5%',
    avgCsatScore: '4.91 / 5.0',
    csatChange: '+0.12'
  },
  dailyVolume: [
    { date: 'Sep 17', total: 112, leads: 34 },
    { date: 'Sep 18', total: 135, leads: 42 },
    { date: 'Sep 19', total: 158, leads: 51 },
    { date: 'Sep 20', total: 142, leads: 45 },
    { date: 'Sep 21', total: 189, leads: 62 },
    { date: 'Sep 22', total: 210, leads: 74 },
    { date: 'Sep 23', total: 226, leads: 83 }
  ],
  bhkDistribution: [
    { label: '3 BHK Residences', count: 828, percentage: 45, color: '#3b82f6' },
    { label: '2 BHK Smart Units', count: 552, percentage: 30, color: '#06b6d4' },
    { label: '4 & 5 BHK Sky Villas', count: 331, percentage: 18, color: '#8b5cf6' },
    { label: 'Commercial & Retail', count: 131, percentage: 7, color: '#f59e0b' }
  ],
  sentimentBreakdown: [
    { sentiment: 'Highly Satisfied / Positive', percentage: 84, color: '#10b981' },
    { sentiment: 'Neutral / Informational', percentage: 13, color: '#3b82f6' },
    { sentiment: 'Unresolved / Needs Follow-up', percentage: 3, color: '#f43f5e' }
  ],
  topQuestions: [
    { question: 'What is the price of 3 BHK in Science City / Sola?', count: 482, growth: '+28%' },
    { question: 'What are the GIFT City tax exemptions for NRI buyers?', count: 364, growth: '+41%' },
    { question: 'Can I schedule a site visit for this weekend?', count: 312, growth: '+19%' },
    { question: 'What is the RERA registration number of The Sovereign?', count: 245, growth: '+12%' },
    { question: 'Which banks provide pre-approved home loans for Prycoons?', count: 198, growth: '+15%' }
  ],
  hourlyHeatmap: [
    { hour: '08:00', load: 15 },
    { hour: '10:00', load: 45 },
    { hour: '12:00', load: 88 },
    { hour: '14:00', load: 62 },
    { hour: '16:00', load: 78 },
    { hour: '18:00', load: 95 },
    { hour: '20:00', load: 100 },
    { hour: '22:00', load: 40 }
  ]
};

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Basic Entry',
    priceMonthly: 29,
    priceAnnual: 24,
    description: 'Perfect for single property projects or independent real estate boutique firms.',
    features: [
      '1 Active AI Chatbot',
      'Up to 1,500 Conversations/mo',
      '500 Knowledge Chunks (PDF/Web)',
      'Basic Lead Capture to Email',
      'Standard Website Widget',
      'Community Support'
    ],
    cta: 'Select Starter',
    popular: false
  },
  {
    id: 'growth',
    name: 'Growth Pro',
    badge: 'Most Popular',
    priceMonthly: 79,
    priceAnnual: 65,
    description: 'Built for high-velocity developers, agencies, and multi-project real estate portals.',
    features: [
      '5 Active Industry AI Chatbots',
      'Up to 10,000 Conversations/mo',
      '5,000 Knowledge Chunks + Live Auto-Crawl',
      'Advanced Lead Scoring & CRM Webhooks',
      'Custom Brand Styling & Zero Watermark',
      'Rich Property Cards & Brochure Triggers',
      'QR Code Generator & WhatsApp Bot Sandbox',
      'Priority 24/7 SLA Support'
    ],
    cta: 'Upgrade to Growth',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Ultra',
    badge: 'Full White-label',
    priceMonthly: 249,
    priceAnnual: 199,
    description: 'Dedicated infrastructure, custom LLM fine-tuning, and on-premise data compliance.',
    features: [
      'Unlimited Active AI Chatbots',
      'Unlimited Conversations & Leads',
      '50,000+ Chunks & Real-Time Sync',
      'Custom Domain White-labeling',
      'Multi-agent Omnichannel (Web, WhatsApp, Telegram, IVR)',
      'Dedicated Account Engineer',
      'Custom SLA & SOC2 Compliance'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export const DEMO_USERS = [
  {
    id: 'user-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@prycoons.com',
    role: 'Lead Project Director',
    organization: 'Prycoons Infrastructure Pvt Ltd',
    avatar: 'AS',
    plan: 'Growth Pro',
    creditsRemaining: '8,158 / 10,000'
  },
  {
    id: 'user-2',
    name: 'Pooja Varma',
    email: 'pooja.v@edunova.edu',
    role: 'Dean of Admissions',
    organization: 'EduNova Global Institute',
    avatar: 'PV',
    plan: 'Starter Plan',
    creditsRemaining: '1,120 / 1,500'
  },
  {
    id: 'user-3',
    name: 'Dr. Rohan Mehra',
    email: 'rohan.m@carepointhealth.in',
    role: 'Medical Director',
    organization: 'CarePoint Multi-Specialty Clinics',
    avatar: 'RM',
    plan: 'Enterprise Ultra',
    creditsRemaining: 'Unlimited'
  }
];
