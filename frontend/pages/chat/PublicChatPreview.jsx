import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  RotateCcw, 
  ExternalLink, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  X,
  Sparkles,
  Download,
  MapPin,
  Mic,
  MicOff
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { createInitialSession, getInactivityFollowUp, getWelcomeMessageForSession } from '../../utils/conversationEngine';
import { api } from '../../utils/api';
import { OFFICIAL_PRYCOONS_CONTACT } from '../../utils/organization';

/**
 * Format message text into readable JSX with bold support, markdown links, and no stray raw asterisks
 */
function renderFormattedMessage(text, onDownloadClick) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} style={{ height: '0.4rem' }} />;
    }

    // Parse markdown links [label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const lineElements = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        lineElements.push(line.substring(lastIndex, matchIndex));
      }
      const label = match[1];
      const url = match[2];
      const isBrochure = label.toLowerCase().includes('brochure') || label.toLowerCase().includes('download');

      lineElements.push(
        <a
          key={`link-${idx}-${matchIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (isBrochure && onDownloadClick) {
              e.preventDefault();
              onDownloadClick({ 
                title: label.replace(/download|official|brochure|\(pdf\)|\*/gi, '').trim() || 'Prycoons_Residences', 
                sourceUrl: url 
              });
            }
          }}
          style={{
            display: isBrochure ? 'inline-flex' : 'inline',
            alignItems: 'center',
            gap: '0.35rem',
            padding: isBrochure ? '0.35rem 0.75rem' : '0',
            backgroundColor: isBrochure ? 'var(--primary)' : 'transparent',
            color: isBrochure ? '#ffffff' : 'var(--primary)',
            borderRadius: isBrochure ? '6px' : '0',
            textDecoration: isBrochure ? 'none' : 'underline',
            fontWeight: 600,
            fontSize: '0.82rem',
            margin: isBrochure ? '0.35rem 0' : '0',
          }}
        >
          {isBrochure && <Download size={13} />}
          <span>{label.replace(/\*\*/g, '')}</span>
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      lineElements.push(line.substring(lastIndex));
    }

    // Now format bold tags inside string segments
    const formattedElements = lineElements.map((el, elIdx) => {
      if (typeof el !== 'string') return el;
      const parts = el.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={`${elIdx}-${pIdx}`}>{part.slice(2, -2)}</strong>;
        }
        return part.replace(/\*{2,}/g, '').replace(/^\*\s+/, '• ');
      });
    });

    return (
      <div key={idx} style={{ marginBottom: '0.2rem', lineHeight: 1.45 }}>
        {formattedElements}
      </div>
    );
  });
}

export const PublicChatPreview = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { bots, sendChatMessage, submitLead, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const messagesEndRef = useRef(null);

  // Conversational session ref & state
  const sessionRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inactivityFiredForMsgIdRef = useRef(null);

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const submittingMsgIdRef = useRef(null);

  // Web Speech API Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      addToast('Voice input is not supported in this browser. Please type your message.', 'info');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        addToast('Listening... Speak naturally 🎙️', 'info');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInput(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          addToast('Microphone access was denied. Please allow microphone permissions in browser settings.', 'error');
        } else if (event.error === 'no-speech') {
          // User was quiet
        } else if (event.error === 'audio-capture') {
          addToast('No microphone found on your device.', 'error');
        } else {
          addToast(`Voice input notice: ${event.error}`, 'info');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      addToast('Could not initialize microphone.', 'error');
    }
  };

  // Inline Lead Form Modal / Drawer State
  const [activeLeadForm, setActiveLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredBhk: '3 BHK Luxury',
    budget: '₹1.35 Cr - ₹1.85 Cr',
    preferredDate: 'Saturday 11:00 AM',
    selectedProperty: null
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Requirement #7: Consistent & Persistent Conversation History Across Reloads
  useEffect(() => {
    let isCancelled = false;
    const sessionKey = `brim_chat_session_${currentBot?.id}`;
    const savedSessionId = localStorage.getItem(sessionKey);

    async function loadConversationHistory() {
      if (savedSessionId) {
        try {
          const res = await api.chat.getMessages(savedSessionId);
          if (!isCancelled && res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const formatted = res.data.map((m, idx, arr) => {
              const isBot = m.role !== 'USER';
              const qr = m.metadata?.quickReplies || [];
              let selected = m.metadata?.selectedReply;
              if (!selected && isBot && arr[idx + 1] && arr[idx + 1].role === 'USER') {
                const nextUserText = arr[idx + 1].content?.trim().toLowerCase();
                const matched = qr.find((q) => q.trim().toLowerCase() === nextUserText);
                if (matched) selected = matched;
              }
              return {
                id: m.id,
                sender: isBot ? 'bot' : 'user',
                text: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                propertyCard: m.metadata?.propertyCard || null,
                propertyCards: m.metadata?.propertyCards || (m.metadata?.propertyCard ? [m.metadata.propertyCard] : []),
                sources: m.metadata?.sources || [],
                sourceCitation: m.metadata?.sources?.[0]?.title || null,
                quickReplies: qr,
                selectedReply: selected,
              };
            });

            setMessages(formatted);
            sessionRef.current = {
              id: savedSessionId,
              sessionId: savedSessionId,
              botId: currentBot.id,
              inactivityFollowUpSent: false,
            };
            return;
          }
        } catch (e) {
          console.warn('Could not restore session messages, initializing fresh session:', e);
        }

        // If savedSessionId exists but no messages in database yet (e.g. refreshed right after opening):
        // Restore the SAME session with the consistent welcome message selected for this session ID
        const welcomeKey = `prycoons_welcome_${currentBot?.id}_${savedSessionId}`;
        const savedWelcomeText = localStorage.getItem(welcomeKey) || getWelcomeMessageForSession(savedSessionId);
        const restoredSession = createInitialSession(currentBot, savedSessionId);
        restoredSession.welcomeMessage = savedWelcomeText;
        restoredSession.initialMessage.text = savedWelcomeText;
        restoredSession.botId = currentBot?.id;
        sessionRef.current = restoredSession;

        if (!isCancelled) {
          setMessages([restoredSession.initialMessage]);
        }
        return;
      }

      // If genuinely fresh session (no savedSessionId):
      const freshSession = createInitialSession(currentBot);
      freshSession.botId = currentBot?.id;
      sessionRef.current = freshSession;
      const newSessionId = freshSession.id || freshSession.sessionId;
      localStorage.setItem(sessionKey, newSessionId);
      localStorage.setItem(`prycoons_welcome_${currentBot?.id}_${newSessionId}`, freshSession.welcomeMessage || freshSession.initialMessage.text);
      if (!isCancelled) {
        setMessages([freshSession.initialMessage]);
      }
    }

    loadConversationHistory();

    return () => {
      isCancelled = true;
    };
  }, [currentBot?.id]);

  // Requirement #1: Inactivity Follow-Up - Exactly 60 Seconds
  useEffect(() => {
    // Clear pending timer on any state change
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Do not show an inactivity message while the assistant is generating a response
    if (isTyping) return;

    // Start timer only after the assistant has finished responding to the latest user message
    const hasUserInteracted = messages.some((m) => m.sender === 'user');
    if (!hasUserInteracted) return;

    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg && 
      lastMsg.sender === 'bot' && 
      sessionRef.current && 
      !sessionRef.current.inactivityFollowUpSent &&
      inactivityFiredForMsgIdRef.current !== lastMsg.id
    ) {
      // Exactly 60 seconds (60000ms) of genuine inactivity
      inactivityTimerRef.current = setTimeout(() => {
        if (isTyping) return;
        if (inactivityFiredForMsgIdRef.current === lastMsg.id) return;
        inactivityFiredForMsgIdRef.current = lastMsg.id;

        const followUp = getInactivityFollowUp(sessionRef.current);
        if (followUp) {
          setMessages((prev) => [...prev, followUp]);
        }
      }, 60000);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Reset inactivity timer on any user typing
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  // Requirement #2: Actual Browser Location Detection via navigator.geolocation & Reverse Geocoding
  const handleShareLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      addToast('Geolocation is not supported by your browser. Please type your preferred area.', 'info');
      return;
    }

    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let resolvedLocality = null;

        try {
          // Reverse-geocode real coordinates via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14`,
            {
              headers: { 'Accept-Language': 'en' },
              signal: AbortSignal.timeout(6000),
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const locality =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.city_district ||
              addr.subdistrict;
            const city = addr.city || addr.town || addr.municipality || addr.village;
            const state = addr.state || addr.province;
            const parts = [locality, city, state].filter(Boolean);
            if (parts.length > 0) {
              resolvedLocality = parts.join(', ');
            } else if (data.display_name) {
              resolvedLocality = data.display_name.split(',').slice(0, 3).join(',').trim();
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding error:', err);
        }

        setRequestingLocation(false);

        if (resolvedLocality) {
          addToast(`Location resolved: ${resolvedLocality}`, 'success');

          if (sessionRef.current) {
            sessionRef.current.userLocation = resolvedLocality;
            sessionRef.current.userCoordinates = { latitude, longitude, locality: resolvedLocality };
          }

          handleSendMessage(`LOCATION_SHARED: ${resolvedLocality}`, {
            location: resolvedLocality,
            coordinates: { latitude, longitude },
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        } else {
          // If reverse geocoding fails, do not fabricate or simulate hardcoded city
          addToast('GPS detected, but could not resolve address. Please type your preferred locality.', 'info');
        }
      },
      (err) => {
        setRequestingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          addToast('Location access was denied. You can type your preferred area anytime.', 'info');
          if (sessionRef.current) {
            sessionRef.current.locationDenied = true;
          }
        } else if (err.code === err.TIMEOUT) {
          addToast('Location request timed out. Please type your area manually.', 'info');
        } else {
          addToast('Could not retrieve GPS location. Please type your area manually.', 'info');
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  const handleDownloadBrochure = async (property) => {
    const card = property || sessionRef.current?.lastViewedProperty || (messages.flatMap((m) => m.propertyCards || []).slice(-1)[0]) || (messages.find((m) => m.propertyCard)?.propertyCard);
    const title = card?.title || 'Prycoons Ahmedabad Residences';

    addToast(`Preparing official PDF brochure for ${title}... 📄`, 'info');

    // 1. If property object already has a direct download URL, trigger it natively
    if (property?.sourceUrl && property.sourceUrl.includes('/api/brochures/download')) {
      const link = document.createElement('a');
      link.href = property.sourceUrl;
      link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Brochure.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Downloaded official PDF brochure for ${title} 📥`, 'success');
      return;
    }

    // 2. Try POST generatePdf
    try {
      const res = await api.brochures.generatePdf({
        title: card?.title || 'Prycoons Ahmedabad Residences',
        location: card?.location || 'Ahmedabad, Gujarat',
        bhk: card?.bhk || '3 & 4 BHK Luxury Residences',
        priceRange: card?.priceRange || 'Available upon inquiry',
        carpetArea: card?.carpetArea || 'Super Built-Up Area',
        status: card?.status || 'RERA Gujarat Approved',
        amenities: card?.amenities && card.amenities.length > 0
          ? card.amenities
          : ['Landscaped Zen Garden', 'State-of-the-art Gymnasium', 'Swimming Pool & Deck', 'Clubhouse & Indoor Sports', '24/7 Security & CCTV'],
        image: card?.image,
        sourceUrl: card?.propertyDetailUrl || card?.sourceUrl || 'https://prycoons.com/',
        description: card?.description
      });

      const fileBlob = (res instanceof Blob) ? res : (res?.blob || res);
      const downloadFilename = res?.filename || fileBlob?.filename || `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Brochure.pdf`;

      if (fileBlob && (fileBlob instanceof Blob || fileBlob.size > 0)) {
        const url = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFilename.endsWith('.pdf') ? downloadFilename : `${downloadFilename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        addToast(`Downloaded official PDF brochure for ${title} 📥`, 'success');
        return;
      }
    } catch (err) {
      console.warn('POST generatePdf error, using direct download endpoint:', err.message);
    }

    // 3. Resilient GET fallback
    try {
      const params = new URLSearchParams({
        title: card?.title || 'Prycoons Ahmedabad Residences',
        location: card?.location || 'Ahmedabad, Gujarat',
        bhk: card?.bhk || '3 & 4 BHK Luxury Residences',
        price: card?.priceRange || 'Available upon inquiry',
        carpetArea: card?.carpetArea || 'Super Built-Up Area',
        status: card?.status || 'RERA Gujarat Approved',
        url: card?.propertyDetailUrl || card?.sourceUrl || 'https://prycoons.com/'
      });
      const downloadUrl = `/api/brochures/download?${params.toString()}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Brochure.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Downloaded official PDF brochure for ${title} 📥`, 'success');
    } catch (fallbackErr) {
      console.error('Failed to download brochure:', fallbackErr);
      addToast('Could not generate PDF brochure at this moment. Please try again.', 'error');
    }
  };

  const handleOptionSelect = (msgId, optionText) => {
    // Prevent duplicate submissions on rapid repeated clicks or when busy
    if (isTyping || submittingMsgIdRef.current) return;

    // Check if this option group is already submitted or locked
    const currentMsg = messages.find((m) => m.id === msgId);
    if (selectedOptions[msgId] || currentMsg?.selectedReply) return;

    // Provide immediate visual feedback showing which option is selected
    setSelectedOptions((prev) => ({ ...prev, [msgId]: optionText }));
    submittingMsgIdRef.current = msgId;

    // Persist selected option on the message in state
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, selectedReply: optionText } : m))
    );

    // If brochure download requested, trigger brochure download
    const qLow = optionText.toLowerCase().trim();
    if (
      (qLow.includes('download') && qLow.includes('brochure')) ||
      qLow === 'download brochure' ||
      qLow === 'download brochure 📥' ||
      qLow === 'brochure'
    ) {
      const lastCard = messages.flatMap((m) => m.propertyCards || []).slice(-1)[0] || (messages.find((m) => m.propertyCard)?.propertyCard);
      handleDownloadBrochure(lastCard);
    }

    // Submit selected answer through existing message pipeline
    handleSendMessage(optionText);
  };

  const handleSendMessage = (textToSend, customClientContext = null) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // If query asks for brochure, also automatically initiate brochure download
    const queryLow = query.toLowerCase().trim();
    if (
      (queryLow.includes('download') && queryLow.includes('brochure')) ||
      queryLow === 'download brochure' ||
      queryLow === 'download brochure 📥' ||
      queryLow === 'brochure'
    ) {
      const lastCard = messages.flatMap((m) => m.propertyCards || []).slice(-1)[0] || (messages.find((m) => m.propertyCard)?.propertyCard);
      handleDownloadBrochure(lastCard);
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.inactivityFollowUpSent = false;
    }

    const isLocationMsg = query.startsWith('LOCATION_SHARED:');
    const displayText = isLocationMsg
      ? `📍 Shared location: ${query.replace('LOCATION_SHARED:', '').trim()}`
      : query;

    const userMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: displayText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const clientCtx = {
      ...(customClientContext || {}),
      location: sessionRef.current?.userLocation,
      coordinates: sessionRef.current?.userCoordinates,
      locationDenied: sessionRef.current?.locationDenied,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    (async () => {
      try {
        const { response, session: updatedSession } = await sendChatMessage(
          currentBot.id, 
          query, 
          messages, 
          sessionRef.current,
          clientCtx
        );
        
        sessionRef.current = updatedSession;
        if (updatedSession?.id) {
          localStorage.setItem(`brim_chat_session_${currentBot.id}`, updatedSession.id);
        }
        setMessages((prev) => [...prev, response]);

        if (response.showLeadForm) {
          setActiveLeadForm(true);
        }

        if (response.advisorConnected) {
          addToast('Advisor consultation requested!', 'success');
        }
      } catch (err) {
        console.warn('Chat send error:', err);
        // Restore interactive state if submission fails
        if (submittingMsgIdRef.current) {
          const failedId = submittingMsgIdRef.current;
          setSelectedOptions((prev) => {
            const next = { ...prev };
            delete next[failedId];
            return next;
          });
          setMessages((prev) =>
            prev.map((m) => (m.id === failedId ? { ...m, selectedReply: undefined } : m))
          );
        }
      } finally {
        setIsTyping(false);
        submittingMsgIdRef.current = null;
      }
    })();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!leadFormData.name || !leadFormData.phone) {
      addToast('Please enter your name and phone number', 'error');
      return;
    }

    const card = leadFormData.selectedProperty;
    const propertyTitle = card?.title || leadFormData.preferredBhk || 'Prycoons Property';
    const propertyUrl = card?.propertyDetailUrl || card?.sourceUrl || (card ? 'https://prycoons.com/' : undefined);

    try {
      // 1. Submit lead to existing PlatformContext
      submitLead(currentBot.id, {
        name: leadFormData.name,
        phone: leadFormData.phone,
        email: leadFormData.email,
        interest: propertyTitle,
        budget: card?.priceRange || leadFormData.budget
      });

      // 2. Persist Schedule Visit request in persistent database via visitService
      let visitRes = null;
      try {
        visitRes = await api.visits.createVisit({
          customerName: leadFormData.name.trim(),
          mobileNumber: leadFormData.phone.trim(),
          email: leadFormData.email?.trim() || undefined,
          propertyName: card ? card.title : 'Unspecified Property',
          propertyUrl: propertyUrl,
          locality: card?.location || 'Unspecified Locality',
          city: 'Ahmedabad',
          bhk: card?.bhk || leadFormData.preferredBhk,
          propertyPrice: card?.priceRange,
          assistantId: currentBot?.id || 'prycoons-ai',
          conversationId: sessionRef.current?.id || sessionRef.current?.sessionId,
          customerNotes: `Preferred Date/Slot: ${leadFormData.preferredDate || 'Flexible'}`
        });
      } catch (visitErr) {
        console.warn('Backend createVisit API note:', visitErr.message);
      }

      // 3. Cache locally in localStorage so it always appears in Visit Requests page
      const newVisit = visitRes?.data || {
        requestId: `VR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        submittedAt: new Date().toISOString(),
        customerName: leadFormData.name.trim(),
        mobileNumber: leadFormData.phone.trim(),
        email: leadFormData.email?.trim() || null,
        propertyName: card ? card.title : 'Unspecified Property',
        propertyUrl: propertyUrl,
        locality: card?.location || 'Unspecified Locality',
        city: 'Ahmedabad',
        bhk: card?.bhk || leadFormData.preferredBhk,
        propertyPrice: card?.priceRange,
        assistantId: currentBot?.id || 'prycoons-ai',
        assistantName: currentBot?.name || 'Prycoons AI Assistant',
        visitStatus: 'New Request',
        preferredDate: leadFormData.preferredDate || 'Flexible',
        customerNotes: `Preferred Date/Slot: ${leadFormData.preferredDate || 'Flexible'}`
      };

      try {
        const storedVisits = JSON.parse(localStorage.getItem('brim_visit_requests') || '[]');
        storedVisits.unshift(newVisit);
        localStorage.setItem('brim_visit_requests', JSON.stringify(storedVisits));
      } catch (e) {
        console.warn('Could not cache visit locally:', e);
      }

      setActiveLeadForm(false);

      // Append confirmation in chat
      const confirmMessage = {
        id: 'bot-confirm-' + Date.now(),
        sender: 'bot',
        text: `🎉 Thank you, **${leadFormData.name}**! Your visit request for **${card ? card.title : leadFormData.preferredBhk}** has been received (Request ID: #${newVisit.requestId || 'VISIT'}).\n\nOur property team will contact you at **${leadFormData.phone}** to finalize the appointment details for **${leadFormData.preferredDate}**.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        leadCaptured: true
      };
      setMessages((prev) => [...prev, confirmMessage]);
      addToast('Visit request recorded successfully!', 'success');
    } catch (err) {
      console.error('Failed to record visit request:', err);
      addToast(err.message || 'Could not record your visit request. Please check your details and try again.', 'error');
    }
  };

  const handleRestartChat = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    const sessionKey = `brim_chat_session_${currentBot?.id}`;
    const oldSessionId = localStorage.getItem(sessionKey);
    if (oldSessionId) {
      localStorage.removeItem(`prycoons_welcome_${currentBot?.id}_${oldSessionId}`);
    }
    localStorage.removeItem(sessionKey);

    const freshSession = createInitialSession(currentBot);
    freshSession.botId = currentBot?.id;
    sessionRef.current = freshSession;
    const newSessionId = freshSession.id || freshSession.sessionId;
    localStorage.setItem(sessionKey, newSessionId);
    localStorage.setItem(`prycoons_welcome_${currentBot?.id}_${newSessionId}`, freshSession.welcomeMessage || freshSession.initialMessage.text);

    setMessages([freshSession.initialMessage]);
    setActiveLeadForm(false);
    setSelectedOptions({});
    submittingMsgIdRef.current = null;
    inactivityFiredForMsgIdRef.current = null;
    addToast('Conversation restarted', 'info');
  };

  // Get current active quick replies from the latest bot message
  const lastBotMessage = [...messages].reverse().find((m) => m.sender === 'bot');
  const lastBotMessageId = lastBotMessage?.id;
  const activeQuickReplies = (lastBotMessage?.quickReplies && lastBotMessage.quickReplies.length > 0)
    ? lastBotMessage.quickReplies
    : (currentBot?.suggestedQuestions || ['Looking to Buy 🏡', 'Thinking of Renting 🔑', 'Just Browsing ✨']);

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'var(--bg-app)'
      }}
    >
      <div 
        className="chat-container"
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '92vh',
          maxHeight: '780px',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-default)'
        }}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div 
              className="chat-avatar"
              style={{ backgroundColor: currentBot?.primaryColor || 'var(--primary)' }}
            >
              {currentBot?.avatar || '🏢'}
              <div className="online-indicator" />
            </div>
            <div className="chat-title-group">
              <div className="chat-title">{currentBot?.name || 'Prycoons Assistant'}</div>
              <div className="chat-subtitle">{currentBot?.industryName || 'Prycoons Real Estate'} • Online</div>
            </div>
          </div>

          <div className="chat-actions">
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              title="Restart Conversation"
              onClick={handleRestartChat}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className="message-bubble">
                {/* Render formatted message text with bold support and no stray raw asterisks */}
                <div className="message-text-content">
                  {renderFormattedMessage(msg.text, handleDownloadBrochure)}
                </div>

                {/* Predefined Interactive Selection Chips (Radio-Button Style) */}
                {msg.sender === 'bot' && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div 
                    className="chat-chips-group" 
                    role="radiogroup" 
                    aria-label="Predefined options"
                  >
                    {msg.quickReplies.map((q, optIdx) => {
                      const isSelected = (msg.selectedReply === q) || (selectedOptions[msg.id] === q);
                      const isLocked = isTyping || (submittingMsgIdRef.current !== null) || (msg.selectedReply !== undefined) || (selectedOptions[msg.id] !== undefined) || (msg.id !== lastBotMessageId);

                      return (
                        <button
                          key={`${msg.id}-opt-${optIdx}`}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isLocked ? -1 : 0}
                          className={`selection-chip ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                          disabled={isLocked}
                          onClick={() => handleOptionSelect(msg.id, q)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (!isLocked) {
                                handleOptionSelect(msg.id, q);
                              }
                            }
                          }}
                        >
                          <span className="chip-radio-circle" aria-hidden="true">
                            {isSelected && <span className="chip-radio-dot" />}
                          </span>
                          <span className="chip-label">{q}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Multi-Property Cards Demonstration: Display 5-8 relevant properties */}
                {(() => {
                  const cardsToRender = (msg.propertyCards && msg.propertyCards.length > 0)
                    ? msg.propertyCards
                    : (msg.propertyCard ? [msg.propertyCard] : []);

                  if (cardsToRender.length === 0) return null;

                  return (
                    <div className="chat-property-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
                      {cardsToRender.map((card, cIdx) => {
                        const hasImgError = imgErrors[card.title || cIdx];
                        const hasValidImage = card.image && !hasImgError;

                        return (
                          <div key={card.id || cIdx} className="chat-property-card">
                            {hasValidImage ? (
                              <img 
                                src={card.image} 
                                alt={card.title} 
                                className="chat-property-image"
                                loading="lazy"
                                onError={() => {
                                  setImgErrors((prev) => ({ ...prev, [card.title || cIdx]: true }));
                                }}
                              />
                            ) : (
                              <div className="chat-property-image-placeholder">
                                <Building2 size={30} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  {card.title}
                                </span>
                              </div>
                            )}

                            <div className="chat-property-content">
                              <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                                <div className="chat-property-title">
                                  <strong>{card.title}</strong>
                                </div>
                                {card.priceRange && (
                                  <div className="chat-property-price-badge">
                                    <strong>{card.priceRange}</strong>
                                  </div>
                                )}
                              </div>

                              <div className="chat-property-tagline" style={{ marginBottom: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <strong>Location:</strong> {card.location ? `${card.location}` : 'Ahmedabad, Gujarat'}
                              </div>

                              <div className="chat-property-specs">
                                <div><strong>Configuration:</strong> {card.bhk || '3 BHK'}</div>
                                <div><strong>Area:</strong> {card.carpetArea || 'Spacious layout'}</div>
                                {card.status && <div style={{ gridColumn: 'span 2' }}><strong>Status:</strong> {card.status}</div>}
                              </div>

                              {card.amenities && card.amenities.length > 0 && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                    <strong>Amenities:</strong>
                                  </div>
                                  <div className="chat-property-amenities-chips">
                                    {card.amenities.slice(0, 5).map((am, aIdx) => (
                                      <span key={aIdx} className="amenity-chip">{am}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="chat-property-actions" style={{ marginTop: '0.65rem' }}>
                                <button 
                                  className="btn btn-primary btn-sm"
                                  style={{ flex: 1 }}
                                  onClick={() => {
                                    setLeadFormData((prev) => ({ 
                                      ...prev, 
                                      preferredBhk: card.title,
                                      selectedProperty: card
                                    }));
                                    setActiveLeadForm(true);
                                  }}
                                >
                                  <Calendar size={13} />
                                  <span>Schedule Visit</span>
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                  onClick={() => handleDownloadBrochure(card)}
                                  title="Download Project Brochure"
                                >
                                  <Download size={13} />
                                  <span>Brochure</span>
                                </button>
                                {(() => {
                                  const propUrl = card.propertyDetailUrl || card.sourceUrl;
                                  const isBareHome = !propUrl || propUrl.trim() === 'https://prycoons.com/' || propUrl.trim() === 'https://prycoons.com';
                                  if (isBareHome) return null;
                                  return (
                                    <a
                                      href={propUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-secondary btn-sm"
                                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                    >
                                      <ExternalLink size={13} />
                                      <span>View</span>
                                    </a>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {msg.sourceCitation && (
                  <div className="source-citation">
                    <Sparkles size={11} style={{ color: 'var(--primary)' }} />
                    <span>{msg.sourceCitation}</span>
                  </div>
                )}

                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message-row bot">
              <div className="message-bubble" style={{ padding: '0.6rem 1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Assistant is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Inline Lead Capture Drawer */}
        {activeLeadForm && (
          <div className="chat-lead-drawer">
            <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Schedule Site Visit / Consultation</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setActiveLeadForm(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                  value={leadFormData.name}
                  onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile Phone Number"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                  value={leadFormData.phone}
                  onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                />
              </div>

              <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="email"
                  placeholder="Email Address (Optional)"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                  value={leadFormData.email}
                  onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                />
                <select
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                  value={leadFormData.preferredDate}
                  onChange={(e) => setLeadFormData({ ...leadFormData, preferredDate: e.target.value })}
                >
                  <option value="Saturday 11:00 AM">Saturday 11:00 AM</option>
                  <option value="Sunday 04:00 PM">Sunday 04:00 PM</option>
                  <option value="Weekday Evening">Weekday Evening</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }}>
                <CheckCircle2 size={14} />
                <span>Confirm Appointment</span>
              </button>
            </form>
          </div>
        )}

        {/* Suggestion Pills Bar */}
        {((!sessionRef.current?.userLocation && !sessionRef.current?.locationDenied) || (!lastBotMessage?.quickReplies || lastBotMessage.quickReplies.length === 0)) && (
          <div className="suggestion-pills-bar">
            {/* Natural location sharing button if location not yet determined */}
            {!sessionRef.current?.userLocation && !sessionRef.current?.locationDenied && (
              <button
                type="button"
                className="suggestion-pill location-pill"
                onClick={handleShareLocation}
                disabled={requestingLocation}
                style={{ backgroundColor: 'var(--primary-subtle)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <MapPin size={12} />
                <span>{requestingLocation ? 'Detecting...' : 'Share My Location'}</span>
              </button>
            )}

            {(!lastBotMessage?.quickReplies || lastBotMessage.quickReplies.length === 0) && activeQuickReplies.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-pill"
                disabled={isTyping}
                onClick={() => {
                  if (q.toLowerCase().includes('download') && q.toLowerCase().includes('brochure')) {
                    const lastCard = messages.flatMap((m) => m.propertyCards || []).slice(-1)[0] || (messages.find((m) => m.propertyCard)?.propertyCard);
                    handleDownloadBrochure(lastCard);
                  }
                  handleSendMessage(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input-field"
            placeholder={isListening ? "Listening... Speak naturally 🎙️" : "Type your message or ask a question..."}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          {/* Voice Input Microphone Button */}
          <button 
            type="button" 
            className={`chat-mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoiceInput}
            title={
              !speechSupported 
                ? 'Voice recognition not supported in this browser' 
                : (isListening ? 'Listening... Click to stop' : 'Voice input (Click to speak)')
            }
            aria-label={isListening ? "Stop voice listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button 
            type="button" 
            className="chat-send-btn" 
            disabled={!input.trim()}
            onClick={() => handleSendMessage()}
            title="Send Message"
            aria-label="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
