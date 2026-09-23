import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_BOTS, 
  INITIAL_KNOWLEDGE_SOURCES, 
  INITIAL_CONVERSATIONS, 
  DEMO_USERS,
  PRYCOONS_PROJECTS,
  MOCK_ANALYTICS
} from '../data/mockData';

const PlatformContext = createContext();

export const PlatformProvider = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexus_theme') || 'dark';
  });

  // User State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[0];
  });

  // Bots State
  const [bots, setBots] = useState(() => {
    const saved = localStorage.getItem('nexus_bots');
    return saved ? JSON.parse(saved) : INITIAL_BOTS;
  });

  // Knowledge Sources State
  const [knowledgeSources, setKnowledgeSources] = useState(() => {
    const saved = localStorage.getItem('nexus_knowledge');
    return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE_SOURCES;
  });

  // Conversations State
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('nexus_conversations');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  // Toasts Notification Queue
  const [toasts, setToasts] = useState([]);

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem('nexus_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nexus_bots', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
    localStorage.setItem('nexus_knowledge', JSON.stringify(knowledgeSources));
  }, [knowledgeSources]);

  useEffect(() => {
    localStorage.setItem('nexus_conversations', JSON.stringify(conversations));
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

  // Registered Users Directory in LocalStorage
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('nexus_registered_users');
    return saved ? JSON.parse(saved) : DEMO_USERS;
  });

  useEffect(() => {
    localStorage.setItem('nexus_registered_users', JSON.stringify(users));
  }, [users]);

  // Auth Operations
  const registerUser = (userData) => {
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name || 'New User',
      email: userData.email,
      password: userData.password || 'password123',
      role: userData.role || 'Workspace Owner',
      organization: userData.organization || 'My Enterprise Workspace',
      industryId: userData.industry || 'real-estate',
      avatar: initials,
      plan: 'Growth Pro',
      creditsRemaining: '10,000 / 10,000'
    };

    setUsers((prev) => [newUser, ...prev.filter((u) => u.email !== userData.email)]);
    setCurrentUser(newUser);
    addToast(`Account created for ${newUser.name}! Welcome to ${newUser.organization}.`, 'success');
    return newUser;
  };

  const loginUser = (email, password) => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      addToast(`Welcome back, ${found.name}! Signed in to ${found.organization}.`, 'success');
      return { success: true, user: found };
    }

    // Auto-create session if it's a new email
    const namePart = email.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const newUser = {
      id: 'usr-' + Date.now(),
      name: formattedName,
      email: email,
      password: password,
      role: 'Project Director',
      organization: `${formattedName}'s Enterprise`,
      avatar: formattedName.slice(0, 2).toUpperCase(),
      plan: 'Growth Pro',
      creditsRemaining: '10,000 / 10,000'
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    addToast(`Signed in as ${newUser.name} (${newUser.organization})`, 'success');
    return { success: true, user: newUser };
  };

  const logoutUser = () => {
    addToast('Signed out of workspace', 'info');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const switchUser = (userId) => {
    const found = users.find((u) => u.id === userId) || DEMO_USERS.find((u) => u.id === userId) || users[0];
    setCurrentUser(found);
    addToast(`Switched account to ${found.name} (${found.organization})`, 'info');
  };

  // Bot Operations
  const createBot = (botData) => {
    const newId = (botData.name || 'custom-bot').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const newBot = {
      id: newId,
      name: botData.name || 'New Custom AI',
      avatar: botData.avatar || '🤖',
      industryId: botData.industryId || 'real-estate',
      industryName: botData.industryName || 'Real Estate & Infrastructure',
      description: botData.description || 'Custom industry AI assistant configured via wizard.',
      status: 'active',
      model: botData.model || 'Gemini 1.5 Pro (Domain-Tuned)',
      tone: botData.tone || 'Professional & Consultative',
      welcomeMessage: botData.welcomeMessage || `Hello! I am ${botData.name || 'your AI assistant'}. How may I help you today?`,
      promptGuidelines: botData.promptGuidelines || 'Provide domain-accurate information, capture high-intent leads, and be helpful.',
      leadCaptureEnabled: botData.leadCaptureEnabled !== undefined ? botData.leadCaptureEnabled : true,
      leadCaptureFields: botData.leadCaptureFields || ['name', 'phone', 'email'],
      primaryColor: botData.primaryColor || '#3b82f6',
      suggestedQuestions: botData.suggestedQuestions && botData.suggestedQuestions.length > 0 
        ? botData.suggestedQuestions 
        : ['What services do you offer?', 'How can I get in touch?', 'Where can I see pricing?'],
      sourcesCount: (botData.initialSources && botData.initialSources.length) || 1,
      totalConversations: 0,
      leadCount: 0,
      csat: 5.0,
      avgResponseTime: '0.7s',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just now'
    };

    setBots((prev) => [newBot, ...prev]);

    // Add any knowledge sources created in wizard
    if (botData.initialSources && botData.initialSources.length > 0) {
      const newSources = botData.initialSources.map((src, i) => ({
        id: `src-custom-${Date.now()}-${i}`,
        botId: newId,
        title: src.title || src.name || 'Uploaded Source Document',
        type: src.type || 'pdf',
        size: src.size || '1.2 MB',
        url: src.url || '#',
        chunks: src.chunks || 12,
        status: 'synced',
        lastSync: 'Just now',
        extractedSummary: src.summary || 'Knowledge extracted and vectorized successfully for instant semantic search.'
      }));
      setKnowledgeSources((prev) => [...newSources, ...prev]);
    } else {
      // Add a default indexed source
      setKnowledgeSources((prev) => [
        {
          id: `src-custom-${Date.now()}`,
          botId: newId,
          title: `${newBot.name} Core Knowledge Base`,
          type: 'url',
          size: '128 KB',
          url: 'https://demo-domain.com/knowledge',
          chunks: 14,
          status: 'synced',
          lastSync: 'Just now',
          extractedSummary: 'Synthesized domain information, product catalogs, and custom FAQ pairs.'
        },
        ...prev
      ]);
    }

    addToast(`Bot "${newBot.name}" deployed successfully!`, 'success');
    return newBot;
  };

  const updateBot = (botId, updates) => {
    setBots((prev) => prev.map((b) => (b.id === botId ? { ...b, ...updates } : b)));
    addToast('Bot settings updated successfully', 'success');
  };

  const deleteBot = (botId) => {
    const bot = bots.find((b) => b.id === botId);
    setBots((prev) => prev.filter((b) => b.id !== botId));
    setKnowledgeSources((prev) => prev.filter((k) => k.botId !== botId));
    setConversations((prev) => prev.filter((c) => c.botId !== botId));
    addToast(`Bot "${bot?.name || botId}" deleted`, 'info');
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
      chunks: Math.floor(Math.random() * 25) + 10,
      status: 'synced',
      lastSync: 'Just now',
      extractedSummary: sourceData.summary || 'Document analyzed and 100% vectorized for retrieval-augmented generation.'
    };
    setKnowledgeSources((prev) => [newSource, ...prev]);
    
    // Update bot count
    setBots((prev) => prev.map((b) => b.id === botId ? { ...b, sourcesCount: (b.sourcesCount || 0) + 1 } : b));
    addToast(`Source "${newSource.title}" indexed successfully!`, 'success');
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
    addToast('Knowledge source re-crawled and re-indexed!', 'success');
  };

  // Interactive Simulated AI Chat Engine
  const sendChatMessage = (botId, userMessage, currentHistory = []) => {
    const bot = bots.find((b) => b.id === botId) || bots[0];
    const textLower = userMessage.toLowerCase();

    let replyText = '';
    let propertyCard = null;
    let sourceCitation = null;
    let showLeadForm = false;

    // Domain matching logic for Prycoons Real Estate showcase
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
        sourceCitation = 'The_Sovereign_Brochure_Specifications.pdf (Chunk #12)';
      } else if (textLower.includes('gift') || textLower.includes('horizon') || textLower.includes('nri') || textLower.includes('tax') || textLower.includes('yield')) {
        propertyCard = PRYCOONS_PROJECTS[1];
        replyText = `**GIFT Horizon Towers** represents next-generation smart living in GIFT City SEZ, Gandhinagar.\n\n` +
          `• **Configuration**: 2 & 3 BHK Smart Tech Residences\n` +
          `• **Carpet Area**: 1,250 – 1,850 sq.ft.\n` +
          `• **Price Range**: Starting at ₹95 Lakhs up to ₹1.65 Cr\n` +
          `• **Key Highlights**: 6.8%–7.5% projected rental yields, zero stamp duty benefits for select SEZ entities, and integrated district cooling.\n\n` +
          `Would you like to download the NRI Investment Dossier or check floor plan availability?`;
        sourceCitation = 'GIFT_City_Investment_ROI_Guide.pdf (Chunk #4)';
      } else if (textLower.includes('emerald') || textLower.includes('science city') || textLower.includes('3bhk') || textLower.includes('sola')) {
        propertyCard = PRYCOONS_PROJECTS[2];
        replyText = `**Prycoons Emerald Heights** is our premium residential haven located on Science City Road, Sola.\n\n` +
          `• **Configuration**: 3 BHK Luxury Living\n` +
          `• **Carpet Area**: 1,950 – 2,400 sq.ft.\n` +
          `• **Price Range**: ₹1.35 Cr to ₹1.85 Cr\n` +
          `• **Amenities**: 30,000 sq.ft. clubhouse, squash courts, zen garden, and 3-tier biometric security.\n` +
          `• **RERA No.**: \`PR/GJ/AHMEDABAD/DASKROI/AUDA/RAA11045/050823\`\n\n` +
          `Sample flats are ready for walkthrough! Shall I assist you with scheduling a site visit?`;
        sourceCitation = 'https://prycoons.com/projects/emerald-heights';
      } else if (textLower.includes('capital') || textLower.includes('commercial') || textLower.includes('office') || textLower.includes('retail') || textLower.includes('sg highway')) {
        propertyCard = PRYCOONS_PROJECTS[3];
        replyText = `**Prycoons Capital Square** is a landmark Grade-A commercial hub on main SG Highway near Vaishnodevi Circle.\n\n` +
          `• **Units**: Retail Showrooms & Executive Corporate Suites\n` +
          `• **Carpet Area**: 850 sq.ft. to 12,500 sq.ft.\n` +
          `• **Pricing**: Starting ₹82 Lakhs (Base rate: ₹6,250 / sq.ft.)\n` +
          `• **Specifications**: Central HVAC, double-height grand lobby, and 10 high-speed elevators.\n\n` +
          `Would you like a customized commercial ROI projection sheet?`;
        sourceCitation = 'https://prycoons.com/projects/capital-square';
      } else if (textLower.includes('visit') || textLower.includes('book') || textLower.includes('tour') || textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('call')) {
        showLeadForm = true;
        replyText = `I would be delighted to arrange a VIP private site visit or consultation for you with our senior property advisory team. Please provide your contact details below to confirm your slot!`;
      } else if (textLower.includes('brochure') || textLower.includes('pdf') || textLower.includes('download') || textLower.includes('floor plan')) {
        replyText = `Here are the instant download links for Prycoons project brochures and floor plans:\n\n` +
          `📄 [Download The Sovereign Sky Villas Brochure (PDF)](#download)\n` +
          `📄 [Download GIFT Horizon Towers Master Plan (PDF)](#download)\n` +
          `📄 [Download Emerald Heights Floor Specs (PDF)](#download)\n\n` +
          `All documents include detailed carpet area disclosures, RERA certifications, and payment schedules.`;
        sourceCitation = 'Prycoons_Customer_FAQ_Master.csv';
      } else if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('budget') || textLower.includes('rate')) {
        replyText = `Prycoons offers residential and commercial developments across several price segments in Ahmedabad & GIFT City:\n\n` +
          `1. **2 BHK Smart Residences** (GIFT City): ₹95 Lakhs – ₹1.25 Cr\n` +
          `2. **3 BHK Premium Living** (Science City Road): ₹1.35 Cr – ₹1.85 Cr\n` +
          `3. **4 & 5 BHK Sky Villas** (Bodakdev): ₹4.85 Cr – ₹8.50 Cr\n` +
          `4. **Commercial Offices** (SG Highway): ₹82 Lakhs – ₹9.2 Cr\n\n` +
          `Which budget range or location matches your requirements best?`;
      } else {
        replyText = `Thank you for your inquiry regarding Prycoons developments. We provide curated residential 2, 3, 4 & 5 BHK homes and Grade-A commercial spaces across Ahmedabad, SG Highway, and GIFT City.\n\n` +
          `You can ask me about:\n` +
          `• Specific projects (**The Sovereign**, **GIFT Horizon**, **Emerald Heights**, **Capital Square**)\n` +
          `• Floor plans, carpet areas, and RERA approvals\n` +
          `• Pricing, payment plans, and home loan assistance\n` +
          `• Scheduling a weekend site visit`;
        sourceCitation = 'Prycoons Knowledge Hub';
      }
    } 
    // Domain responses for Education (EduNova)
    else if (bot.industryId === 'education') {
      if (textLower.includes('eligibility') || textLower.includes('admission') || textLower.includes('requirement')) {
        replyText = `For undergraduate B.Tech programs at EduNova, applicants require a minimum of 60% aggregate in Physics, Chemistry, and Mathematics (PCM) plus a valid JEE Main or EduNova SAT score. Early decision deadline is November 15.`;
      } else if (textLower.includes('scholarship') || textLower.includes('fee')) {
        replyText = `EduNova provides up to 100% tuition fee merit waivers for students scoring in the top 5th percentile. Annual tuition for engineering is $14,500 with flexible semester installments.`;
      } else {
        replyText = `At EduNova, we offer undergraduate and graduate degrees in Computer Science, AI, Business Analytics, and Interaction Design. How can I help guide your academic journey today?`;
      }
      sourceCitation = 'EduNova Admissions Prospectus 2026';
    } 
    // Domain responses for Healthcare (CarePoint)
    else if (bot.industryId === 'healthcare') {
      if (textLower.includes('doctor') || textLower.includes('appointment') || textLower.includes('book')) {
        showLeadForm = true;
        replyText = `Our specialist outpatient clinics operate Monday through Saturday from 8:00 AM to 8:00 PM. Please enter your preferred department and date to secure your consultation appointment.`;
      } else {
        replyText = `CarePoint Clinics provides advanced care across Cardiology, Orthopedics, Neurology, and Pediatrics. For medical emergencies, please call our 24/7 hotline directly or visit emergency care.`;
      }
      sourceCitation = 'CarePoint Hospital Clinical Directory';
    }
    // General fallback for any other custom bot
    else {
      replyText = `Thank you for your question. Based on the indexed knowledge base for **${bot.name}**, our solution is optimized to provide quick, reliable answers and capture inquiries.\n\n` +
        `Feel free to ask more specific questions or request a live specialist to connect with you!`;
      sourceCitation = `${bot.name} Indexed Repository`;
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
      leadStatus: 'Qualified Lead',
      leadInterest: leadInfo.interest || leadInfo.preferredBhk || 'General Inquiry',
      budget: leadInfo.budget || 'Standard',
      channel: 'Web Chatbot',
      timestamp: 'Just now',
      duration: '2m 15s',
      messagesCount: 4,
      sentiment: 'Very Positive (0.95)',
      status: 'resolved',
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
    addToast(`New lead captured: ${leadInfo.name || 'Visitor'}!`, 'success');
  };

  const upgradePlan = (planId) => {
    const plan = planId === 'enterprise' ? 'Enterprise Ultra' : planId === 'growth' ? 'Growth Pro' : 'Starter Plan';
    setCurrentUser((prev) => ({ ...prev, plan }));
    addToast(`Successfully upgraded to ${plan}!`, 'success');
  };

  return (
    <PlatformContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        users,
        registerUser,
        loginUser,
        logoutUser,
        switchUser,
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
