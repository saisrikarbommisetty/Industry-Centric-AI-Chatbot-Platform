/**
 * CONVERSATIONAL INTELLIGENCE ENGINE
 * Industry-Centric Human-Like Advisory & Sales Assistant System
 * 
 * Features:
 * - Time-aware & location-aware contextual greetings (Ahmedabad / local time)
 * - Priority-based small talk (Holidays -> Festivals -> Culture -> Weather -> Health)
 * - Natural human fillers & conversational reactions
 * - Step-by-step gradual discovery (never a questionnaire)
 * - Mix of personal lifestyle questions with business/property requirements
 * - Rich entity & intent extraction from free text and quick replies
 * - Concise property/service one-liners and shortlist delivery
 * - Natural conversational lead capture (Name -> Phone -> Email)
 * - Confirmation & new launch notification opt-in
 * - Optional engaging closing questions
 * - Human advisor connection
 * - No-response inactivity follow-up
 * - Multi-industry support (Real Estate, Marketing Agency, Education, Healthcare, Hospitality)
 */

import { PRYCOONS_PROJECTS } from '../data/mockData';

// Mock Location & Environmental Context
export const MOCK_USER_LOCATION = {
  city: 'Ahmedabad',
  region: 'Gujarat',
  country: 'India',
  weatherSummary: 'a sunny afternoon',
  temperature: '31°C',
  upcomingHoliday: 'the long festive weekend',
  activeFestival: 'Navratri & Diwali preparations',
  culturalNote: 'heritage cafes and vibrant local energy'
};

// Marketing Agency Services Mock Data
export const MARKETING_SERVICES = [
  {
    id: 'srv-branding',
    title: 'Brand Identity & Visual System',
    tagline: 'Memorable brand positioning, logo architecture & style guides',
    summary: 'Complete brand story, custom typography, palette, and ready-to-launch brand guidelines tailored for high growth.',
    deliveryTime: '2-3 weeks',
    deliverables: ['Logo & Marks', 'Brand Guidelines', 'Typography & Palette', 'Pitch Deck Design']
  },
  {
    id: 'srv-digital',
    title: 'High-Conversion Web & UI Design',
    tagline: 'Modern, fast and responsive digital experiences',
    summary: 'Bespoke web design crafted to captivate visitors and convert them into loyal customers with seamless UX.',
    deliveryTime: '3-4 weeks',
    deliverables: ['Interactive UX/UI', 'Mobile Responsive', 'SEO Optimization', 'Design System']
  },
  {
    id: 'srv-social',
    title: 'Social Media & Growth Marketing',
    tagline: 'Strategic storytelling and performance campaigns',
    summary: 'Engaging content pipelines, reel productions, and targeted ad campaigns to scale brand reach organically and via paid channels.',
    deliveryTime: 'Ongoing Monthly',
    deliverables: ['Content Strategy', 'Video/Reels Production', 'Performance Ads', 'Community Growth']
  }
];

/**
 * Get Time-Aware Context Information
 */
export const getTimeContext = (mockHour = null) => {
  const currentHour = mockHour !== null ? mockHour : new Date().getHours();
  
  if (currentHour >= 5 && currentHour < 9) {
    return {
      period: 'early_morning',
      greeting: 'Good morning!',
      subtext: 'Starting the day bright and early 🌅.',
      icebreaker: 'How is your morning shaping up so far?'
    };
  } else if (currentHour >= 9 && currentHour < 11) {
    return {
      period: 'morning_work',
      greeting: 'Good morning!',
      subtext: 'You might be settling into the day ☕.',
      icebreaker: 'Have you had a chance to grab your morning tea or breakfast yet?'
    };
  } else if (currentHour >= 11 && currentHour < 14) {
    return {
      period: 'lunch_hours',
      greeting: 'Good afternoon!',
      subtext: 'Hope your day is going smoothly 😊.',
      icebreaker: 'Busy day? Hope you have managed to grab some lunch!'
    };
  } else if (currentHour >= 14 && currentHour < 17) {
    return {
      period: 'afternoon',
      greeting: 'Good afternoon!',
      subtext: `It's a warm and sunny day here in ${MOCK_USER_LOCATION.city} ☀️.`,
      icebreaker: "Hope you're staying cool and having a productive day!"
    };
  } else if (currentHour >= 17 && currentHour < 20) {
    return {
      period: 'evening_commute',
      greeting: 'Good evening!',
      subtext: 'Long day? You might already be thinking about heading home 😄.',
      icebreaker: "Hope the day's winding down nicely for you!"
    };
  } else {
    return {
      period: 'night',
      greeting: 'Good evening!',
      subtext: 'Finally home? Hope you had a fulfilling day 😊.',
      icebreaker: 'Sounds like the perfect time to relax and unwind.'
    };
  }
};

/**
 * Human fillers to naturally prepend when appropriate
 */
const HUMAN_FILLERS = [
  'Got it!',
  'Perfect 👍',
  'That makes total sense.',
  'Oh, that is a great choice!',
  'Nice!',
  'Okay, I’ve got you.',
  'Hmm 🤔 let me look that up for you.'
];

/**
 * Creates a fresh conversation session
 */
export const createInitialSession = (bot = null) => {
  const timeCtx = getTimeContext();
  const botName = bot?.name || 'Prycoons Assistant';
  const isRealEstate = !bot || bot.industryId === 'real-estate' || bot.id === 'prycoons-ai';
  const isMarketing = bot?.industryId === 'marketing' || bot?.industryId === 'ecommerce' || bot?.id?.includes('brand') || bot?.id?.includes('market');

  let initialText = '';
  let initialQuickReplies = [];

  // Minimal first message asking only for the user's name
  const minimalGreeting = 'Hi 👋 May I know your name?';
  initialText = minimalGreeting;
  // Simple quick replies prompting name input
  initialQuickReplies = ['I am Rahul', 'Hello', 'My name is Rahul'];

  return {
    state: 'GREETING',
    stepIndex: 0,
    userName: '',
    userLocation: MOCK_USER_LOCATION.city,
    industryId: bot?.industryId || 'real-estate',
    intent: '', // 'buy' | 'rent' | 'browse' | 'branding' | 'marketing'
    discovery: {
      location: '', // e.g. 'Ambli', 'SG Highway', 'Bodakdev', 'Science City', 'GIFT City'
      homeType: '', // '2BHK', '3BHK', '4BHK', '5BHK'
      mustHave: '', // 'Big Balcony', 'Spacious Kitchen', 'Garden Space', 'Gym & Pool'
      lifestyle: '', // 'Netflix nights', 'Morning walks', 'House full of friends', 'Quiet family day'
      budget: '', // 'Around ₹90 Lakhs', '₹1.5 - ₹2 Cr', '₹4.5 Cr+'
      timeline: '', // 'Next month', 'Within 6 months', 'Ready to move', 'Exploring'
      brandStory: '', // for marketing
      servicesNeeded: [] // for marketing
    },
    lead: {
      deliveryMethod: '', // 'WhatsApp', 'Email', 'View Shortlist'
      name: '',
      phone: '',
      email: '',
      captured: false,
      newLaunchOptIn: null
    },
    engagement: {
      funAnswer: '',
      advisorConnected: false
    },
    inactivityFollowUpSent: false,
    historyLog: [],
    initialMessage: {
      id: 'init-' + Date.now(),
      sender: 'bot',
      text: initialText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: initialQuickReplies
    }
  };
};

/**
 * Natural Name Extractor
 */
const extractName = (text) => {
  if (!text) return '';
  const cleaned = text.trim();
  
  // "I am Rahul", "My name is Rahul Sharma", "This is Rahul", "Call me Rahul"
  const patterns = [
    /(?:i am|i'm|my name is|this is|call me|myself)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/
  ];

  for (const pat of patterns) {
    const match = cleaned.match(pat);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const forbidden = ['hi', 'hello', 'hey', 'yes', 'no', 'looking', 'buy', 'rent', 'browse', 'homes', 'good'];
      if (!forbidden.includes(candidate.toLowerCase())) {
        return candidate.split(' ')[0].charAt(0).toUpperCase() + candidate.split(' ')[0].slice(1);
      }
    }
  }
  return '';
};

/**
 * Phone Number Extractor
 */
const extractPhone = (text) => {
  const match = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,6}/);
  if (match) {
    return match[0].trim();
  }
  return '';
};

/**
 * Email Extractor
 */
const extractEmail = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (match) {
    return match[0].trim();
  }
  return '';
};

/**
 * Main Process Message function
 * Transitions conversation states naturally
 */
export const processUserMessage = (userText, session, bot) => {
  const text = (userText || '').trim();
  const textLower = text.toLowerCase();
  const timeCtx = getTimeContext();
  const botName = bot?.name || 'Prycoons Assistant';
  const isMarketing = bot?.industryId === 'marketing' || bot?.industryId === 'ecommerce' || bot?.id?.includes('brand') || bot?.id?.includes('market');
  const isEducation = bot?.industryId === 'education';
  const isHealthcare = bot?.industryId === 'healthcare';
  const isHospitality = bot?.industryId === 'hospitality';

  let nextState = session.state;
  let replyText = '';
  let quickReplies = [];
  let propertyCard = null;
  let showLeadForm = false;
  let sourceCitation = null;
  let leadCaptured = false;
  let advisorConnected = false;

  // Extract any names, phone, email present in input
  const foundName = extractName(text);
  if (foundName && !session.userName) {
    session.userName = foundName;
    session.lead.name = foundName;
  }

  const foundPhone = extractPhone(text);
  if (foundPhone && !session.lead.phone) {
    session.lead.phone = foundPhone;
  }

  const foundEmail = extractEmail(text);
  if (foundEmail && !session.lead.email) {
    session.lead.email = foundEmail;
  }

  // =========================================================================
  // 1. GREETING & NAME CAPTURE STAGE
  // =========================================================================
  if (session.state === 'GREETING') {
    if (foundName) {
      session.userName = foundName;
      session.lead.name = foundName;
    } else if (!session.userName && text.length < 25 && !textLower.includes('help') && !textLower.includes('explore')) {
      session.userName = text.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Friend';
      session.lead.name = session.userName;
    }

    const userNameStr = session.userName ? `, ${session.userName}` : '';

    if (isMarketing) {
      replyText = `Nice to meet you${userNameStr}! 👋\n\nIt's ${timeCtx.greeting.toLowerCase()} and ${MOCK_USER_LOCATION.weatherSummary} in ${MOCK_USER_LOCATION.city} ☀️. ${timeCtx.icebreaker}\n\nTell me a little about your brand — what's your brand story or what are you building?`;
      quickReplies = ['Eco-friendly packaging startup 🌱', 'Direct-to-consumer fashion brand 👗', 'B2B SaaS tech company 💻', 'Local luxury boutique ✨'];
      nextState = 'MARKETING_STORY';
    } else if (isEducation) {
      replyText = `Wonderful to connect with you${userNameStr}! 🎓\n\n${timeCtx.icebreaker}\n\nAre you exploring undergraduate programs, master's degrees, or looking for scholarship details?`;
      quickReplies = ['Undergraduate B.Tech / BBA', 'Postgraduate MBA / M.Tech', 'Scholarship eligibility', 'Campus visit booking'];
      nextState = 'EDUCATION_INTENT';
    } else if (isHealthcare) {
      replyText = `Hello${userNameStr} 🩺.\n\n${timeCtx.icebreaker}\n\nHow can CarePoint Clinic assist you today?`;
      quickReplies = ['Book doctor appointment', 'Consultation clinic hours', 'Cardiology & OPD', 'General enquiry'];
      nextState = 'HEALTHCARE_INTENT';
    } else if (isHospitality) {
      replyText = `A warm welcome to LuxeStay Palace${userNameStr}! 🛎️\n\n${timeCtx.icebreaker}\n\nAre you planning a leisure holiday getaway, a private weekend villa stay, or fine dining?`;
      quickReplies = ['Luxury Suite / Villa stay', 'Weekend getaway packages', 'Fine dining reservations', 'Spa & wellness'];
      nextState = 'HOSPITALITY_INTENT';
    } else {
      // REAL ESTATE DEFAULT
      replyText = `Nice to meet you${userNameStr}! 👋\n\nIt's ${timeCtx.greeting.toLowerCase()} and ${MOCK_USER_LOCATION.weatherSummary} here in ${MOCK_USER_LOCATION.city} ☀️. ${timeCtx.icebreaker}\n\nSo tell me — are you looking to buy a new home, thinking about renting, or just casually browsing what's out there?`;
      quickReplies = ['Looking to Buy 🏡', 'Thinking of Renting 🔑', 'Just Browsing ✨', 'Commercial / Office 🏢'];
      nextState = 'INTENT_DETECTION';
    }
  }

  // =========================================================================
  // 2. INTENT DETECTION STAGE (REAL ESTATE)
  // =========================================================================
  else if (session.state === 'INTENT_DETECTION') {
    if (textLower.includes('rent')) {
      session.intent = 'rent';
      replyText = `Got it! Renting gives you fantastic flexibility 👍.\n\nAre you looking for a cozy 2BHK, a spacious 3BHK, or something larger in Ahmedabad?`;
      quickReplies = ['2 BHK furnished', '3 BHK luxury', '4 BHK Penthouse', 'Open to options'];
      nextState = 'DISCOVERY_HOME_TYPE';
    } else if (textLower.includes('browse') || textLower.includes('explor') || textLower.includes('check')) {
      session.intent = 'browse';
      replyText = `No problem at all 😊. Just exploring is a great place to start!\n\nIs there a particular neighborhood you've been curious about, like Ambli, SG Highway, Bodakdev, or GIFT City?`;
      quickReplies = ['Ambli & SG Highway', 'Science City / Sola', 'Bodakdev Sky Mansions', 'GIFT City High-Rises', 'Suggest best areas'];
      nextState = 'DISCOVERY_LOCATION';
    } else if (textLower.includes('commercial') || textLower.includes('office') || textLower.includes('retail')) {
      session.intent = 'commercial';
      session.discovery.homeType = 'Commercial Retail / Executive Suites';
      replyText = `Grade-A commercial spaces! 🏢 Smart timing — SG Highway and GIFT City are experiencing major commercial growth.\n\nAre you looking for a retail showroom, corporate office, or an investment unit with high rental yields?`;
      quickReplies = ['Corporate Executive Office', 'High-street Retail Shop', 'High-Yield Investment Unit'];
      nextState = 'DISCOVERY_BUDGET';
    } else {
      session.intent = 'buy';
      replyText = `Exciting! Buying a home is a wonderful milestone 🏡.\n\nBefore we dive into locations, quick one 😄 — do you prefer **Netflix nights in a cozy lounge 🍿** or **morning walks on a wide open balcony 🌅**?`;
      quickReplies = ['Netflix nights 🍿', 'Morning walks & balcony 🌅', 'Both are essential! ✨'];
      nextState = 'DISCOVERY_PERSONAL';
    }
  }

  // =========================================================================
  // 3. MIX PERSONAL + PROPERTY QUESTIONS (REAL ESTATE)
  // =========================================================================
  else if (session.state === 'DISCOVERY_PERSONAL') {
    if (textLower.includes('netflix') || textLower.includes('popcorn') || textLower.includes('lounge')) {
      session.discovery.lifestyle = 'Netflix nights & cozy living lounge';
      replyText = `Haha, Netflix nights are the best! 🍿 A spacious living room with great ambient light and acoustics makes all the difference.\n\nBy the way, which area in town are you considering — somewhere like Ambli, SG Highway, Bodakdev, or open to suggestions?`;
    } else if (textLower.includes('morning') || textLower.includes('walk') || textLower.includes('balcony')) {
      session.discovery.lifestyle = 'Morning walks & open balcony';
      session.discovery.mustHave = 'Spacious Balcony & Zen Garden';
      replyText = `Love that 🌅! A home with a wide breezy balcony and lush gardens nearby will give you that peaceful start every day.\n\nWhich location are you leaning towards — Ambli, SG Highway, Science City, or GIFT City?`;
    } else {
      session.discovery.lifestyle = 'Balanced luxury lifestyle';
      replyText = `Perfect balance! A home should be both an entertainment lounge and a serene personal sanctuary 🌿.\n\nDo you already have an area in mind, or should I suggest some top locations in Ahmedabad?`;
    }
    quickReplies = ['Ambli', 'SG Highway', 'Bodakdev', 'Science City / Sola', 'GIFT City', 'Open to suggestions'];
    nextState = 'DISCOVERY_LOCATION';
  }

  // =========================================================================
  // 4. DISCOVERY: LOCATION
  // =========================================================================
  else if (session.state === 'DISCOVERY_LOCATION') {
    if (textLower.includes('ambli')) {
      session.discovery.location = 'Ambli / SG Highway';
      replyText = `Ambli is one of the most sought-after upscale corridors right now — great cafes, rapid connectivity, and premium communities 🏙️.\n\nAre you thinking about a cozy 2BHK, a 3BHK, or something larger like a 4 or 5 BHK sky villa?`;
    } else if (textLower.includes('bodakdev')) {
      session.discovery.location = 'Bodakdev';
      replyText = `Bodakdev is classic luxury — established, quiet, and right near the city's finest spots.\n\nAre you looking for a generous 3BHK or a 4/5 BHK palatial sky villa?`;
    } else if (textLower.includes('gift')) {
      session.discovery.location = 'GIFT City';
      replyText = `GIFT City SEZ is incredible for both modern lifestyle and smart investment yields (projected 6.8%–7.5%) 📈.\n\nAre you looking at 2 BHK smart homes or 3 BHK executive high-rises?`;
    } else if (textLower.includes('science') || textLower.includes('sola')) {
      session.discovery.location = 'Science City / Sola';
      replyText = `Science City Road is fantastic for families — wide avenues, green spaces, and easy SG Highway access 🌳.\n\nAre you focusing on 3 BHK luxury residences or 4 BHK homes?`;
    } else {
      session.discovery.location = 'Ahmedabad Prime Corridors (Ambli / SG Highway)';
      replyText = `Great! Ambli, Science City, and Bodakdev are our most popular premium corridors.\n\nAre you thinking about a 2BHK, a 3BHK, or something bigger like a 4 or 5 BHK?`;
    }
    quickReplies = ['3 BHK Luxury', '2 BHK Smart Unit', '4 & 5 BHK Sky Villa', 'Commercial Office'];
    nextState = 'DISCOVERY_HOME_TYPE';
  }

  // =========================================================================
  // 5. DISCOVERY: HOME TYPE & MUST-HAVES
  // =========================================================================
  else if (session.state === 'DISCOVERY_HOME_TYPE') {
    if (textLower.includes('2bhk') || textLower.includes('2 bhk')) {
      session.discovery.homeType = '2 BHK Smart Residence';
    } else if (textLower.includes('4') || textLower.includes('5') || textLower.includes('villa') || textLower.includes('mansion')) {
      session.discovery.homeType = '4 & 5 BHK Palatial Sky Villa';
    } else {
      session.discovery.homeType = '3 BHK Luxury Living';
    }

    replyText = `Got it 👍 ${session.discovery.homeType}.\n\nWhat is the one must-have feature your new home absolutely needs? 🌿`;
    quickReplies = ['Big Balcony / Terrace 🌅', 'Spacious Chef Kitchen 🍳', 'Garden & Greenery 🌳', 'Clubhouse, Gym & Pool 🏊', 'High-speed EV Parking ⚡'];
    nextState = 'DISCOVERY_MUST_HAVE';
  }

  // =========================================================================
  // 6. DISCOVERY: MUST-HAVE & BUDGET / TIMELINE
  // =========================================================================
  else if (session.state === 'DISCOVERY_MUST_HAVE') {
    if (textLower.includes('balcony') || textLower.includes('terrace')) {
      session.discovery.mustHave = 'Wide Scenic Balcony';
      replyText = `A scenic balcony is non-negotiable for evening chai and relaxing views ☕.\n\nWhat budget range are you comfortable with? I can narrow down the perfect options for you 💰.`;
    } else if (textLower.includes('kitchen')) {
      session.discovery.mustHave = 'Spacious Kitchen & Utility';
      replyText = `A large, well-ventilated kitchen makes daily living so much more enjoyable 🍳.\n\nWhat budget bracket are you aiming around?`;
    } else if (textLower.includes('garden') || textLower.includes('green')) {
      session.discovery.mustHave = 'Landscaped Zen Gardens';
      replyText = `Living close to nature brings so much peace 🌿.\n\nWhat budget range are you planning for this move?`;
    } else {
      session.discovery.mustHave = text.length > 20 ? text.slice(0, 30) : text;
      replyText = `Noted! That is an excellent requirement 👍.\n\nWhat budget range are you comfortable with?`;
    }
    quickReplies = ['₹90 Lakhs – ₹1.35 Cr', '₹1.35 Cr – ₹2.00 Cr', '₹4.50 Cr – ₹8.50 Cr', 'Flexible / Best value'];
    nextState = 'DISCOVERY_BUDGET';
  }

  // =========================================================================
  // 7. PROPERTY SUGGESTION & SHORTLIST SUMMARY
  // =========================================================================
  else if (session.state === 'DISCOVERY_BUDGET') {
    session.discovery.budget = text.includes('₹') || text.includes('Cr') || text.includes('Lakh') ? text : '₹1.35 Cr - ₹1.85 Cr';

    // Pick best matching property card
    if (session.discovery.homeType.includes('4') || session.discovery.homeType.includes('5') || textLower.includes('4.5') || textLower.includes('8') || session.discovery.location.includes('Bodakdev')) {
      propertyCard = PRYCOONS_PROJECTS[0]; // The Sovereign
    } else if (session.discovery.location.includes('GIFT') || session.discovery.homeType.includes('2') || textLower.includes('90') || textLower.includes('95')) {
      propertyCard = PRYCOONS_PROJECTS[1]; // GIFT Horizon
    } else if (session.intent === 'commercial' || textLower.includes('commercial')) {
      propertyCard = PRYCOONS_PROJECTS[3]; // Capital Square
    } else {
      propertyCard = PRYCOONS_PROJECTS[2]; // Emerald Heights
    }

    const loc = session.discovery.location || 'Ahmedabad';
    const bhk = session.discovery.homeType || '3BHK';
    const bud = session.discovery.budget || 'your preferred budget';
    const must = session.discovery.mustHave ? ` with a ${session.discovery.mustHave.toLowerCase()}` : '';

    replyText = `Got it 👍 A **${bhk}** in **${loc}**, around **${bud}**${must}.\n\nHere is our prime match that fits your lifestyle perfectly:\n\n` +
      `✨ **${propertyCard.title}** — ${propertyCard.tagline}\n` +
      `• **Configuration**: ${propertyCard.bhk} (${propertyCard.carpetArea})\n` +
      `• **Price Guide**: ${propertyCard.priceRange}\n` +
      `• **Highlights**: ${propertyCard.amenities.slice(0, 3).join(', ')}\n\n` +
      `Would you like me to share the complete shortlist & floor plan brochure with you?`;
    
    sourceCitation = `${propertyCard.title} Verified RERA Specifications`;
    quickReplies = ['Send on WhatsApp 📱', 'Send to Email 📩', 'View Right Here 👀'];
    nextState = 'DELIVERY_PREFERENCE';
  }

  // =========================================================================
  // 8. DELIVERY PREFERENCE & LEAD CAPTURE
  // =========================================================================
  else if (session.state === 'DELIVERY_PREFERENCE') {
    if (textLower.includes('whatsapp') || textLower.includes('phone') || textLower.includes('mobile')) {
      session.lead.deliveryMethod = 'WhatsApp';
    } else if (textLower.includes('email') || textLower.includes('mail')) {
      session.lead.deliveryMethod = 'Email';
    } else {
      session.lead.deliveryMethod = 'WhatsApp & Email';
    }

    if (!session.userName) {
      replyText = `Perfect 👍 Can I get your name so I can address the brochure packet to you?`;
      quickReplies = ['Rahul', 'Priya', 'Amit'];
      nextState = 'LEAD_NAME';
    } else if (!session.lead.phone) {
      replyText = `Perfect, ${session.userName} 👍!\n\nWhat’s the best WhatsApp or mobile number to reach you on?`;
      quickReplies = ['+91 98250 14890', '+91 99099 22334'];
      nextState = 'LEAD_PHONE';
    } else {
      replyText = `I already have your contact saved as **${session.lead.phone}** 🙌.\n\nWould you like me to also send the PDF specifications to your email?`;
      quickReplies = ['Yes, my email is...', 'No, WhatsApp is great 👍'];
      nextState = 'LEAD_EMAIL';
    }
  }

  // =========================================================================
  // 9. LEAD NAME CAPTURE
  // =========================================================================
  else if (session.state === 'LEAD_NAME') {
    session.userName = foundName || text.split(' ')[0] || 'Rahul';
    session.lead.name = session.userName;

    replyText = `Thanks, ${session.userName}! What’s the best mobile number to send the property matches to on WhatsApp?`;
    quickReplies = ['+91 98250 14890', '+91 98000 12345'];
    nextState = 'LEAD_PHONE';
  }

  // =========================================================================
  // 10. LEAD PHONE CAPTURE
  // =========================================================================
  else if (session.state === 'LEAD_PHONE') {
    session.lead.phone = foundPhone || text || '+91 98250 14890';
    leadCaptured = true;

    replyText = `Got it! And what is your preferred email address for the detailed master floor plans? (Or say 'skip' if WhatsApp is enough)`;
    quickReplies = ['rahul.patel@example.com', 'WhatsApp is enough 😊'];
    nextState = 'LEAD_EMAIL';
  }

  // =========================================================================
  // 11. LEAD EMAIL & CONFIRMATION
  // =========================================================================
  else if (session.state === 'LEAD_EMAIL') {
    if (foundEmail || (text.includes('@') && !textLower.includes('skip') && !textLower.includes('enough'))) {
      session.lead.email = foundEmail || text;
    } else {
      session.lead.email = session.lead.email || 'visitor@example.com';
    }
    leadCaptured = true;
    session.lead.captured = true;

    const name = session.userName || 'there';
    const loc = session.discovery.location || 'Ambli / SG Highway';

    replyText = `Thanks ${name} 🙌 I've saved your preferences!\n\nI’m preparing your curated brochure packet with floor specs and pricing for ${loc}.\n\nWould you like me to also let you know whenever a new exclusive project launches in **${loc}** that matches your criteria?`;
    quickReplies = ['Yes, notify me 🔔', 'Maybe later 👍'];
    nextState = 'LEAD_CONFIRMATION';
  }

  // =========================================================================
  // 12. LEAD CONFIRMATION & NOTIFICATION OPT-IN
  // =========================================================================
  else if (session.state === 'LEAD_CONFIRMATION') {
    if (textLower.includes('yes') || textLower.includes('notify') || textLower.includes('sure')) {
      session.lead.newLaunchOptIn = true;
      replyText = `You’re all set for VIP launch alerts! 🚀\n\nOne last fun question 😄 — are you more of a **weekend house-party person 🎶** or a **quiet family-dinner person 🍽️**?`;
    } else {
      session.lead.newLaunchOptIn = false;
      replyText = `Understood! No spam, promised 👍.\n\nOne last fun question 😄 — are you more of a **weekend house-party person 🎶** or a **quiet family-dinner person 🍽️**?`;
    }
    quickReplies = ['Weekend house-party 🎶', 'Quiet family-dinner 🍽️', 'A bit of both! ✨'];
    nextState = 'OPTIONAL_ENGAGEMENT';
  }

  // =========================================================================
  // 13. OPTIONAL ENGAGEMENT & HUMAN ADVISOR OFFER
  // =========================================================================
  else if (session.state === 'OPTIONAL_ENGAGEMENT') {
    session.engagement.funAnswer = text;
    if (textLower.includes('party') || textLower.includes('music') || textLower.includes('house-party')) {
      replyText = `Got it 😄 I'll keep that in mind — homes with a dedicated clubhouse deck and sound-insulated terrace will have the exact vibe you love!\n\nWould you like me to connect you with one of our senior property advisors for a quick 5-minute call to answer any specific questions?`;
    } else {
      replyText = `Love that 🏡 Serene dining layouts and tranquil open spaces give the warmest family atmosphere.\n\nWould you like me to connect you with one of our senior property advisors for a quick 5-minute call or schedule a private site tour?`;
    }
    quickReplies = ['Connect me with an Advisor 📞', 'Not now, WhatsApp is great 👍'];
    nextState = 'HUMAN_ADVISOR';
  }

  // =========================================================================
  // 14. HUMAN ADVISOR CONNECTION
  // =========================================================================
  else if (session.state === 'HUMAN_ADVISOR') {
    if (textLower.includes('connect') || textLower.includes('advisor') || textLower.includes('call') || textLower.includes('yes')) {
      advisorConnected = true;
      session.engagement.advisorConnected = true;
      replyText = `🎉 Wonderful! Our senior advisor **Mr. Aniket Mehta** has been assigned to your request.\n\nHe will reach out on **${session.lead.phone || '+91 98250 14890'}** at your convenience. Thank you for chatting with Prycoons Real Estate! Have a fantastic day ahead ✨.`;
    } else {
      replyText = `No worries at all 😊. I’ll send your brochure and shortlist over WhatsApp. You can also reach our direct helpline anytime at **+91 98250 14890**.\n\nHave a wonderful day ahead! 🌟`;
    }
    quickReplies = ['Explore another project', 'Restart conversation 🔄'];
    nextState = 'COMPLETED';
  }

  // =========================================================================
  // 15. MARKETING AGENCY BRANCH (Requirement #18)
  // =========================================================================
  else if (session.state === 'MARKETING_STORY') {
    session.discovery.brandStory = text;
    replyText = `That sounds super exciting! 🌱 Building a unique story is what makes modern brands stand out.\n\nAre you mainly looking for help with **Brand Identity**, **Social Media & Content Growth**, **High-Converting Website Design**, or **Performance Ads**?`;
    quickReplies = ['Brand Identity & Logo 🎨', 'Website & UX Design 💻', 'Social Media & Growth 📈', 'Full Agency Package 🚀'];
    nextState = 'MARKETING_SERVICE';
  } else if (session.state === 'MARKETING_SERVICE') {
    if (textLower.includes('brand') || textLower.includes('logo')) {
      session.discovery.servicesNeeded = ['Brand Identity'];
      replyText = `Brand Identity is our bread and butter! 🎨 We craft everything from logo systems to typography, tone of voice, and investor pitch decks.\n\nQuick question 😄 — does your brand lean towards a **sleek minimalist aesthetic ⚡** or a **warm, organic & authentic feel 🌿**?`;
    } else if (textLower.includes('web') || textLower.includes('ux') || textLower.includes('design')) {
      session.discovery.servicesNeeded = ['Website Design'];
      replyText = `A stunning digital experience drives true conversions 💻! We build ultra-fast, responsive web interfaces with rich micro-animations.\n\nAre you looking to launch in the next 3-4 weeks or currently planning your roadmap?`;
    } else {
      session.discovery.servicesNeeded = ['Full Growth Package'];
      replyText = `Full growth acceleration! 🚀 We combine brand storytelling with high-converting web presence and viral social pipelines.\n\nWhat timeline are you looking to launch your new identity or campaigns?`;
    }
    quickReplies = ['Sleek & Modern ⚡', 'Warm & Organic 🌿', 'Bold & Vibrant 💥'];
    nextState = 'MARKETING_PROPOSAL';
  } else if (session.state === 'MARKETING_PROPOSAL') {
    replyText = `Got it 👍 That aesthetic fits your vision seamlessly!\n\nHere is what our **Brand Studio Portfolio** covers:\n\n` +
      `• **Identity Architecture**: Logo marks, typography & color guide\n` +
      `• **Digital Assets**: Social templates, motion bumpers & packaging deck\n` +
      `• **Turnaround**: Fast 2-3 week sprint with dedicated art director\n\n` +
      `Would you like me to send our complete agency portfolio & rate card over WhatsApp or Email?`;
    quickReplies = ['Send on WhatsApp 📱', 'Send to Email 📩', 'Connect with Creative Director 📞'];
    nextState = 'DELIVERY_PREFERENCE';
  }

  // =========================================================================
  // 16. EDUCATION BRANCH
  // =========================================================================
  else if (session.state === 'EDUCATION_INTENT') {
    if (textLower.includes('scholarship') || textLower.includes('fee')) {
      replyText = `EduNova offers merit scholarships up to 60% tuition waiver based on secondary scores and entrance results 🎓.\n\nMay I have your WhatsApp number so our admissions counselor can share the scholarship application kit?`;
    } else if (textLower.includes('undergraduate') || textLower.includes('b.tech') || textLower.includes('bba')) {
      replyText = `Our B.Tech & BBA programs feature industry immersion and global exchange semesters 🌍.\n\nWould you like me to send the Fall 2026 admissions brochure and eligibility criteria over WhatsApp or Email?`;
    } else {
      replyText = `At EduNova, applications for Fall 2026 are currently open with early decision benefits 📚.\n\nShould I send the admissions guide to your WhatsApp or Email?`;
    }
    quickReplies = ['Send on WhatsApp 📱', 'Send to Email 📩', 'Speak with Admissions Team 📞'];
    nextState = 'DELIVERY_PREFERENCE';
  }

  // =========================================================================
  // 17. HEALTHCARE BRANCH
  // =========================================================================
  else if (session.state === 'HEALTHCARE_INTENT') {
    if (textLower.includes('doctor') || textLower.includes('appointment') || textLower.includes('book')) {
      replyText = `Our specialist outpatient clinics operate Monday through Saturday from 8:00 AM to 8:00 PM 🩺.\n\nWhat is your mobile number so our care desk can reserve your preferred doctor consultation slot?`;
      quickReplies = ['+91 98250 14890', '+91 99099 22334'];
      nextState = 'LEAD_PHONE';
    } else {
      replyText = `CarePoint Clinics provides advanced care across Cardiology, Orthopedics, Neurology, and Pediatrics.\n\nWould you like our clinic care coordinator to call you with specialist availability?`;
      quickReplies = ['Yes, arrange a call 📞', 'General timings is fine 👍'];
      nextState = 'HUMAN_ADVISOR';
    }
  }

  // =========================================================================
  // 18. HOSPITALITY BRANCH
  // =========================================================================
  else if (session.state === 'HOSPITALITY_INTENT') {
    replyText = `LuxeStay Palace features private pool villas, presidential suites, and bespoke spa therapies 🛎️.\n\nShould I share our weekend getaway brochure and seasonal tariff over WhatsApp or Email?`;
    quickReplies = ['Send on WhatsApp 📱', 'Send to Email 📩', 'Connect with Concierge 📞'];
    nextState = 'DELIVERY_PREFERENCE';
  }

  // =========================================================================
  // 19. COMPLETED / RESTART STAGE
  // =========================================================================
  else {
    if (textLower.includes('restart') || textLower.includes('again') || textLower.includes('reset')) {
      const resetSession = createInitialSession(bot);
      return {
        session: resetSession,
        response: resetSession.initialMessage
      };
    }

    replyText = `Always glad to help! Feel free to ask about any specific project details, RERA numbers, floor plans, or booking a private walkthrough 😊.`;
    quickReplies = ['Explore properties', 'Ask about pricing', 'Talk to advisor'];
    nextState = 'COMPLETED';
  }

  session.state = nextState;
  session.stepIndex += 1;

  const responseMessage = {
    id: 'bot-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    sender: 'bot',
    text: replyText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickReplies,
    propertyCard,
    sourceCitation,
    showLeadForm,
    leadCaptured,
    advisorConnected,
    extractedLead: leadCaptured ? {
      name: session.lead.name || session.userName || 'Website Visitor',
      phone: session.lead.phone || '+91 98250 14890',
      email: session.lead.email || 'visitor@example.com',
      interest: session.discovery.homeType || session.discovery.servicesNeeded?.[0] || 'Property Shortlist',
      budget: session.discovery.budget || 'Standard',
      location: session.discovery.location || MOCK_USER_LOCATION.city
    } : null
  };

  return {
    session,
    response: responseMessage
  };
};

/**
 * Generates an Inactivity Follow-Up message (Requirement #17)
 */
export const getInactivityFollowUp = (session) => {
  if (session.inactivityFollowUpSent) return null;
  session.inactivityFollowUpSent = true;

  const nameStr = session.userName ? `${session.userName}, ` : '';
  const options = [
    `No worries ${nameStr}😊. Are you more comfortable continuing on WhatsApp, or would you prefer a quick 5-minute call whenever you're free?`,
    `Take your time ${nameStr}😊. I’ll leave our direct advisory helpline here — you can call or message us whenever it’s convenient: **+91 98250 14890**.`
  ];

  const chosenText = options[Math.floor(Math.random() * options.length)];

  return {
    id: 'bot-inactivity-' + Date.now(),
    sender: 'bot',
    text: chosenText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickReplies: ['WhatsApp is great 📱', 'Call me later 📞', 'I’m still here! 👍']
  };
};
