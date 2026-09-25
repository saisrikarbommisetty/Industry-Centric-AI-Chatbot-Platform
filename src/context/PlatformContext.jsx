import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_BOTS, 
  INITIAL_KNOWLEDGE_SOURCES, 
  INITIAL_CONVERSATIONS, 
  DEMO_USER,
  DEMO_USERS,
  PRYCOONS_PROJECTS,
  MOCK_ANALYTICS
} from '../data/mockData';

const PlatformContext = createContext();

export const PlatformProvider = ({ children }) => {
  // Theme State - Default to warm light mode
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('brim_theme') || 'light';
  });

  // Auth State - Single demo workspace session
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('brim_auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('brim_user');
    return saved ? JSON.parse(saved) : (localStorage.getItem('brim_auth') === 'true' ? DEMO_USER : null);
  });

  // Assistants / Bots State
  const [bots, setBots] = useState(() => {
    const saved = localStorage.getItem('brim_bots');
    return saved ? JSON.parse(saved) : INITIAL_BOTS;
  });

  // Knowledge Sources State
  const [knowledgeSources, setKnowledgeSources] = useState(() => {
    const saved = localStorage.getItem('brim_knowledge');
    return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE_SOURCES;
  });

  // Conversations State
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('brim_conversations');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('brim_theme', theme);
  }, [theme]);

  // Persist State to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('brim_user', JSON.stringify(currentUser));
      localStorage.setItem('brim_auth', 'true');
    } else {
      localStorage.removeItem('brim_user');
      localStorage.removeItem('brim_auth');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('brim_bots', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
    localStorage.setItem('brim_knowledge', JSON.stringify(knowledgeSources));
  }, [knowledgeSources]);

  useEffect(() => {
    localStorage.setItem('brim_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Toast Dispatcher
  const addToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Operations
  const registerUser = (userData) => {
    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name || 'Sai Srikar',
      email: userData.email || 'saisrikar@example.com',
      role: 'Client Director',
      organization: userData.organization || 'BRIM Workspace',
      avatar: 'SS',
      plan: 'Growth Pro',
      creditsRemaining: '10,000 / 10,000'
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    addToast(`Welcome to BRIM AI, ${newUser.name}!`, 'success');
    return newUser;
  };

  const loginUser = (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check if demo user
    if (cleanEmail === 'saisrikar@example.com' || cleanEmail === 'sai@example.com' || cleanEmail === 'saisrikar' || cleanEmail.includes('saisrikar')) {
      if (cleanPassword && cleanPassword !== DEMO_USER.password) {
        addToast('Invalid password. Please enter the correct password.', 'error');
        return { success: false, error: 'Invalid password' };
      }
      setCurrentUser(DEMO_USER);
      setIsAuthenticated(true);
      addToast(`Welcome back, ${DEMO_USER.name}! Signed into ${DEMO_USER.organization}.`, 'success');
      return { success: true, user: DEMO_USER };
    }

    // Auto-create/format session for any other client email
    const namePart = cleanEmail.split('@')[0] || 'Client';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const newUser = {
      id: 'usr-' + Date.now(),
      name: formattedName,
      email: cleanEmail,
      role: 'Client Director',
      organization: `${formattedName}'s Workspace`,
      avatar: formattedName.slice(0, 2).toUpperCase(),
      plan: 'Growth Pro',
      creditsRemaining: '10,000 / 10,000'
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    addToast(`Signed in as ${newUser.name}`, 'success');
    return { success: true, user: newUser };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('brim_user');
    localStorage.removeItem('brim_auth');
    addToast('Signed out of workspace', 'info');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Assistant / Bot Operations
  const createBot = (botData) => {
    const newId = (botData.name || 'custom-assistant').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const newBot = {
      id: newId,
      name: botData.name || 'New Assistant',
      avatar: botData.avatar || '🏢',
      industryId: botData.industryId || 'real-estate',
      industryName: botData.industryName || 'Real Estate & Property',
      description: botData.description || 'Custom conversational assistant configured for your business.',
      status: 'active',
      model: 'BRIM Conversational Model',
      tone: botData.tone || 'Professional & Consultative',
      welcomeMessage: botData.welcomeMessage || `Hello 👋 Welcome to ${botData.name || 'our assistant'}. How can we help you today?`,
      promptGuidelines: botData.promptGuidelines || 'Provide clear and accurate project details, answers to visitor questions, and assist with bookings.',
      leadCaptureEnabled: botData.leadCaptureEnabled !== undefined ? botData.leadCaptureEnabled : true,
      leadCaptureFields: botData.leadCaptureFields || ['name', 'phone', 'email'],
      primaryColor: botData.primaryColor || '#C85C4A',
      suggestedQuestions: botData.suggestedQuestions && botData.suggestedQuestions.length > 0 
        ? botData.suggestedQuestions 
        : ['Explore properties', 'Find a suitable project', 'Ask about pricing', 'Talk to our team'],
      sourcesCount: (botData.initialSources && botData.initialSources.length) || 1,
      totalConversations: 0,
      leadCount: 0,
      csat: 5.0,
      avgResponseTime: '0.7s',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just now'
    };

    setBots((prev) => [newBot, ...prev]);

    // Add initial knowledge sources if provided
    if (botData.initialSources && botData.initialSources.length > 0) {
      const newSources = botData.initialSources.map((src, i) => ({
        id: `src-${Date.now()}-${i}`,
        botId: newId,
        title: src.title || src.name || 'Website Source',
        type: src.type || 'url',
        size: src.size || '180 KB',
        url: src.url || '#',
        chunks: src.chunks || 12,
        status: 'synced',
        lastSync: 'Just now',
        extractedSummary: src.summary || 'Content indexed successfully for instant answers.'
      }));
      setKnowledgeSources((prev) => [...newSources, ...prev]);
    } else {
      setKnowledgeSources((prev) => [
        {
          id: `src-${Date.now()}`,
          botId: newId,
          title: `${newBot.name} Knowledge Base`,
          type: 'url',
          size: '128 KB',
          url: botData.websiteUrl || 'https://demo-domain.com/knowledge',
          chunks: 14,
          status: 'synced',
          lastSync: 'Just now',
          extractedSummary: 'Synthesized domain information, product specifications, and answers.'
        },
        ...prev
      ]);
    }

    addToast(`Assistant "${newBot.name}" created successfully!`, 'success');
    return newBot;
  };

  const updateBot = (botId, updates) => {
    setBots((prev) => prev.map((b) => (b.id === botId ? { ...b, ...updates } : b)));
    addToast('Assistant settings updated successfully', 'success');
  };

  const deleteBot = (botId) => {
    const bot = bots.find((b) => b.id === botId);
    setBots((prev) => prev.filter((b) => b.id !== botId));
    setKnowledgeSources((prev) => prev.filter((k) => k.botId !== botId));
    setConversations((prev) => prev.filter((c) => c.botId !== botId));
    addToast(`Assistant "${bot?.name || botId}" deleted`, 'info');
  };

  // Knowledge Source Operations
  const addKnowledgeSource = (botId, sourceData) => {
    const newSource = {
      id: `src-${Date.now()}`,
      botId,
      title: sourceData.title || 'Untitled Document',
      type: sourceData.type || 'pdf',
      size: sourceData.size || '2.4 MB',
      url: sourceData.url || '#',
      chunks: Math.floor(Math.random() * 20) + 10,
      status: 'synced',
      lastSync: 'Just now',
      extractedSummary: sourceData.summary || 'Document processed and indexed for customer queries.'
    };
    setKnowledgeSources((prev) => [newSource, ...prev]);
    
    // Update bot count
    setBots((prev) => prev.map((b) => b.id === botId ? { ...b, sourcesCount: (b.sourcesCount || 0) + 1 } : b));
    addToast(`Knowledge source "${newSource.title}" added!`, 'success');
    return newSource;
  };

  const removeKnowledgeSource = (sourceId) => {
    const src = knowledgeSources.find((s) => s.id === sourceId);
    setKnowledgeSources((prev) => prev.filter((s) => s.id !== sourceId));
    if (src) {
      setBots((prev) => prev.map((b) => b.id === src.botId ? { ...b, sourcesCount: Math.max(0, (b.sourcesCount || 1) - 1) } : b));
    }
    addToast('Knowledge source removed', 'info');
  };

  const syncKnowledgeSource = (sourceId) => {
    setKnowledgeSources((prev) => prev.map((s) => s.id === sourceId ? { ...s, lastSync: 'Just now', status: 'synced' } : s));
    addToast('Knowledge source updated and re-synced!', 'success');
  };

  // Conversational Responses Engine
  const sendChatMessage = (botId, userMessage, currentHistory = []) => {
    const bot = bots.find((b) => b.id === botId) || bots[0];
    const textLower = userMessage.toLowerCase();

    let replyText = '';
    let propertyCard = null;
    let sourceCitation = null;
    let showLeadForm = false;

    // Domain matching logic for Real Estate
    if (bot.industryId === 'real-estate' || botId === 'prycoons-ai') {
      if (textLower.includes('sovereign') || textLower.includes('4bhk') || textLower.includes('5bhk') || textLower.includes('sky villa') || textLower.includes('mansion') || textLower.includes('bodakdev')) {
        propertyCard = PRYCOONS_PROJECTS[0];
        replyText = `**The Sovereign Sky Villas** is Prycoons' crown jewel luxury development in Bodakdev, Ahmedabad.\n\n` +
          `• **Configuration**: 4 & 5 BHK Palatial Sky Villas\n` +
          `• **Carpet Area**: 4,200 – 6,800 sq.ft.\n` +
          `• **Price Range**: ₹4.85 Cr to ₹8.50 Cr\n` +
          `• **Possession**: Dec 2026\n` +
          `• **RERA Reg.**: \`PR/GJ/AHMEDABAD/AHMEDABAD_CITY/AUDA/RAA09821/220322\`\n\n` +
          `Each sky villa features a private heated plunge pool, dedicated private elevator, and 4 automated basement parking spaces. Would you like to schedule a private tour of the experience center?`;
        sourceCitation = 'The Sovereign Brochure & Specifications';
      } else if (textLower.includes('gift') || textLower.includes('horizon') || textLower.includes('nri') || textLower.includes('tax') || textLower.includes('yield')) {
        propertyCard = PRYCOONS_PROJECTS[1];
        replyText = `**GIFT Horizon Towers** represents smart living in GIFT City SEZ, Gandhinagar.\n\n` +
          `• **Configuration**: 2 & 3 BHK Smart Tech Residences\n` +
          `• **Carpet Area**: 1,250 – 1,850 sq.ft.\n` +
          `• **Price Range**: Starting at ₹95 Lakhs up to ₹1.65 Cr\n` +
          `• **Key Highlights**: 6.8%–7.5% projected rental yields, zero stamp duty benefits for select SEZ entities, and integrated district cooling.\n\n` +
          `Would you like to download the NRI Investment Guide or check floor plan availability?`;
        sourceCitation = 'GIFT Horizon Investment Guide';
      } else if (textLower.includes('emerald') || textLower.includes('science city') || textLower.includes('3bhk') || textLower.includes('sola')) {
        propertyCard = PRYCOONS_PROJECTS[2];
        replyText = `**Prycoons Emerald Heights** is our premium residential community on Science City Road, Sola.\n\n` +
          `• **Configuration**: 3 BHK Luxury Living\n` +
          `• **Carpet Area**: 1,950 – 2,400 sq.ft.\n` +
          `• **Price Range**: ₹1.35 Cr to ₹1.85 Cr\n` +
          `• **Amenities**: 30,000 sq.ft. clubhouse, squash courts, zen garden, and 3-tier biometric security.\n` +
          `• **RERA No.**: \`PR/GJ/AHMEDABAD/DASKROI/AUDA/RAA11045/050823\`\n\n` +
          `Sample flats are ready for walkthrough! Shall I assist you with scheduling a site visit?`;
        sourceCitation = 'Emerald Heights Project Details';
      } else if (textLower.includes('capital') || textLower.includes('commercial') || textLower.includes('office') || textLower.includes('retail') || textLower.includes('sg highway')) {
        propertyCard = PRYCOONS_PROJECTS[3];
        replyText = `**Prycoons Capital Square** is a landmark commercial hub on main SG Highway near Vaishnodevi Circle.\n\n` +
          `• **Units**: Retail Showrooms & Executive Corporate Suites\n` +
          `• **Carpet Area**: 850 sq.ft. to 12,500 sq.ft.\n` +
          `• **Pricing**: Starting ₹82 Lakhs (Base rate: ₹6,250 / sq.ft.)\n` +
          `• **Specifications**: Central HVAC, double-height grand lobby, and 10 high-speed elevators.\n\n` +
          `Would you like a customized commercial ROI projection sheet?`;
        sourceCitation = 'Capital Square Commercial Specifications';
      } else if (textLower.includes('visit') || textLower.includes('book') || textLower.includes('tour') || textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('call') || textLower.includes('team')) {
        showLeadForm = true;
        replyText = `We would be delighted to arrange a site visit or consultation for you with our senior property advisory team. Please provide your contact details below to confirm your slot!`;
      } else if (textLower.includes('brochure') || textLower.includes('pdf') || textLower.includes('download') || textLower.includes('floor plan')) {
        replyText = `Here are the instant download links for project brochures and floor plans:\n\n` +
          `📄 [Download The Sovereign Sky Villas Brochure (PDF)](#download)\n` +
          `📄 [Download GIFT Horizon Towers Master Plan (PDF)](#download)\n` +
          `📄 [Download Emerald Heights Floor Specs (PDF)](#download)\n\n` +
          `All documents include detailed carpet areas, RERA certifications, and payment schedules.`;
        sourceCitation = 'Prycoons FAQ Guide';
      } else if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('budget') || textLower.includes('rate')) {
        replyText = `Prycoons offers residential and commercial developments across several price segments in Ahmedabad & GIFT City:\n\n` +
          `1. **2 BHK Smart Residences** (GIFT City): ₹95 Lakhs – ₹1.25 Cr\n` +
          `2. **3 BHK Premium Living** (Science City Road): ₹1.35 Cr – ₹1.85 Cr\n` +
          `3. **4 & 5 BHK Sky Villas** (Bodakdev): ₹4.85 Cr – ₹8.50 Cr\n` +
          `4. **Commercial Offices** (SG Highway): ₹82 Lakhs – ₹9.2 Cr\n\n` +
          `Which budget range or location matches your requirements best?`;
      } else if (textLower.includes('explore') || textLower.includes('project') || textLower.includes('suitable')) {
        replyText = `We have 4 flagship projects available across residential and commercial sectors in Ahmedabad and GIFT City:\n\n` +
          `• **The Sovereign Sky Villas** (Bodakdev) — Ultra-luxury 4 & 5 BHK Sky Mansions\n` +
          `• **GIFT Horizon Towers** (GIFT City) — Smart tech 2 & 3 BHK high-rises\n` +
          `• **Emerald Heights** (Science City Road) — Modern 3 BHK family residences\n` +
          `• **Capital Square** (SG Highway) — Grade-A retail & commercial suites\n\n` +
          `Which property would you like to explore in detail?`;
      } else {
        replyText = `Thank you for reaching out! We provide curated residential 2, 3, 4 & 5 BHK homes and Grade-A commercial spaces across Ahmedabad and GIFT City.\n\n` +
          `You can ask me about:\n` +
          `• Specific projects (**The Sovereign**, **GIFT Horizon**, **Emerald Heights**, **Capital Square**)\n` +
          `• Floor plans, carpet areas, and RERA approvals\n` +
          `• Pricing, payment plans, and home loan assistance\n` +
          `• Scheduling a weekend site visit`;
        sourceCitation = 'Prycoons Knowledge Base';
      }
    } 
    // Education Responses
    else if (bot.industryId === 'education') {
      if (textLower.includes('eligibility') || textLower.includes('admission') || textLower.includes('requirement')) {
        replyText = `For undergraduate programs at EduNova, applicants require a minimum of 60% aggregate in secondary schooling plus entrance evaluation. Early decision deadline is November 15.`;
      } else if (textLower.includes('scholarship') || textLower.includes('fee')) {
        replyText = `EduNova provides merit waivers for top percentile applicants. Flexible semester installments and financial counseling are available.`;
      } else {
        replyText = `At EduNova, we offer undergraduate and graduate degrees across Technology, Business, and Design. How can we help guide your academic journey today?`;
      }
      sourceCitation = 'EduNova Admissions Guide';
    } 
    // Healthcare Responses
    else if (bot.industryId === 'healthcare') {
      if (textLower.includes('doctor') || textLower.includes('appointment') || textLower.includes('book')) {
        showLeadForm = true;
        replyText = `Our specialist outpatient clinics operate Monday through Saturday from 8:00 AM to 8:00 PM. Please enter your contact details to secure your consultation appointment.`;
      } else {
        replyText = `CarePoint Clinics provides advanced care across Cardiology, Orthopedics, Neurology, and Pediatrics. For medical emergencies, please call our 24/7 hotline directly.`;
      }
      sourceCitation = 'CarePoint Hospital Directory';
    }
    // General fallback
    else {
      replyText = `Thank you for your question. Based on the knowledge base for **${bot.name}**, I am pleased to assist you with details, pricing, and bookings.\n\n` +
        `Feel free to ask more specific questions or request our team to connect with you!`;
      sourceCitation = `${bot.name} Knowledge Base`;
    }

    return {
      id: 'm-' + Date.now(),
      sender: 'bot',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      propertyCard,
      sourceCitation,
      showLeadForm
    };
  };

  const submitLead = (botId, leadInfo) => {
    const bot = bots.find((b) => b.id === botId) || bots[0];
    const newConvId = 'conv-' + Date.now();
    const newConversation = {
      id: newConvId,
      botId: bot.id,
      botName: bot.name,
      userName: leadInfo.name || 'Website Visitor',
      userEmail: leadInfo.email || 'visitor@example.com',
      userPhone: leadInfo.phone || '+91 98000 00000',
      leadStatus: 'Site Visit Requested',
      leadInterest: leadInfo.interest || leadInfo.preferredBhk || 'General Inquiry',
      budget: leadInfo.budget || 'Standard',
      channel: 'Web Assistant',
      timestamp: 'Just now',
      duration: '2m 15s',
      messagesCount: 4,
      sentiment: 'Positive',
      status: 'active',
      transcript: [
        {
          id: 'm1',
          sender: 'user',
          text: `Inquiry submitted for ${leadInfo.name || 'visitor'}. Preferred: ${leadInfo.interest || 'Information request'}`,
          time: 'Just now'
        },
        {
          id: 'm2',
          sender: 'bot',
          text: `Thank you, ${leadInfo.name}! Your request has been confirmed. Our team will reach out at ${leadInfo.phone || leadInfo.email}.`,
          time: 'Just now',
          leadCaptured: true
        }
      ]
    };

    setConversations((prev) => [newConversation, ...prev]);
    setBots((prev) => prev.map((b) => b.id === botId ? { ...b, leadCount: (b.leadCount || 0) + 1, totalConversations: (b.totalConversations || 0) + 1 } : b));
    addToast(`New inquiry received: ${leadInfo.name || 'Visitor'}!`, 'success');
  };

  const upgradePlan = (planId) => {
    const plan = planId === 'enterprise' ? 'Enterprise' : planId === 'growth' ? 'Growth Pro' : 'Starter Plan';
    setCurrentUser((prev) => ({ ...prev, plan }));
    addToast(`Updated subscription to ${plan}!`, 'success');
  };

  return (
    <PlatformContext.Provider
      value={{
        theme,
        toggleTheme,
        isAuthenticated,
        currentUser,
        registerUser,
        loginUser,
        logoutUser,
        bots,
        createBot,
        updateBot,
        deleteBot,
        knowledgeSources,
        addKnowledgeSource,
        removeKnowledgeSource,
        syncKnowledgeSource,
        conversations,
        sendChatMessage,
        submitLead,
        analytics: MOCK_ANALYTICS,
        toasts,
        addToast,
        removeToast,
        upgradePlan
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);
