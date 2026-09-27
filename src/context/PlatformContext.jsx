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
import { 
  createInitialSession, 
  processUserMessage, 
  getInactivityFollowUp 
} from '../utils/conversationEngine';

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

  // Conversational Intelligence Responses Engine
  const sendChatMessage = (botId, userMessage, currentHistory = [], sessionState = null) => {
    const bot = bots.find((b) => b.id === botId) || bots[0];
    const session = sessionState || createInitialSession(bot);
    const { session: updatedSession, response } = processUserMessage(userMessage, session, bot);

    // Auto-capture lead if contact info extracted
    if (response.extractedLead && !session.leadCapturedInCRM) {
      session.leadCapturedInCRM = true;
      submitLead(bot.id, response.extractedLead);
    }

    return { response, session: updatedSession };
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
        createInitialSession,
        getInactivityFollowUp,
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
