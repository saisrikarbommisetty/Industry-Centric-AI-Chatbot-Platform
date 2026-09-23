import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  Building2, 
  BookOpen, 
  CheckCircle2, 
  Phone, 
  Calendar, 
  Download, 
  User, 
  Mail, 
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PRYCOONS_PROJECTS } from '../../data/mockData';

export const PublicChatPreview = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { bots, sendChatMessage, submitLead, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const messagesEndRef = useRef(null);

  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: currentBot?.welcomeMessage || 'Hello! Welcome to Prycoons Real Estate. How can I assist with luxury residential and commercial property inquiries today?',
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Inline Lead Form Modal / Drawer State
  const [activeLeadForm, setActiveLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredBhk: '3 BHK',
    budget: '₹1.50 Cr - ₹2.00 Cr',
    preferredDate: 'This Weekend (Saturday 11 AM)'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = sendChatMessage(currentBot.id, query, messages);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);

      if (response.showLeadForm) {
        setActiveLeadForm(true);
      }
    }, 600);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!leadFormData.name || !leadFormData.phone) {
      addToast('Please enter your name and phone number', 'error');
      return;
    }

    submitLead(currentBot.id, {
      name: leadFormData.name,
      phone: leadFormData.phone,
      email: leadFormData.email,
      interest: leadFormData.preferredBhk,
      budget: leadFormData.budget
    });

    setActiveLeadForm(false);

    // Append confirmation in chat
    const confirmMessage = {
      id: 'bot-confirm-' + Date.now(),
      sender: 'bot',
      text: `🎉 Thank you, **${leadFormData.name}**! Your VIP Site Visit / Consultation for **${leadFormData.preferredBhk}** has been confirmed for **${leadFormData.preferredDate}**.\n\nOur senior property advisor will reach out to you at **${leadFormData.phone}** with directions and digital floor plans.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leadCaptured: true
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handleRestartChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: currentBot?.welcomeMessage || 'Hello! How can I assist you today?',
        time: 'Just now'
      }
    ]);
    addToast('Chat session restarted', 'info');
  };

  const handleBrochureDownload = (projectName) => {
    addToast(`Downloading ${projectName} Official Project Specifications (PDF)...`, 'success');
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(59, 130, 246, 0.12), #060911 80%)'
      }}
    >
      <div 
        className="chat-container"
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '86vh',
          maxHeight: '820px',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">
              {currentBot.avatar}
              <span className="online-indicator" />
            </div>
            <div className="chat-title-group">
              <div className="flex items-center gap-1.5">
                <span className="chat-title">{currentBot.name}</span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                  AI Verified
                </span>
              </div>
              <span className="chat-subtitle">
                {currentBot.industryName} • Powered by Grounded RAG
              </span>
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
            <button 
              className="btn btn-ghost btn-sm btn-icon"
              title="Return to Platform Hub"
              onClick={() => navigate(`/bots/${currentBot.id}/overview`)}
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className="message-bubble">
                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                {/* Attached Real Estate Property Feature Card */}
                {msg.propertyCard && (
                  <div className="chat-property-card">
                    <div 
                      className="property-card-img-placeholder"
                      style={{
                        backgroundImage: `url(${msg.propertyCard.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <span className="property-badge">{msg.propertyCard.bhk}</span>
                    </div>

                    <div className="property-card-body">
                      <div className="property-title">{msg.propertyCard.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {msg.propertyCard.location}
                      </div>

                      <div className="property-specs">
                        <span className="spec-tag">📐 {msg.propertyCard.carpetArea}</span>
                        <span className="spec-tag">📜 RERA Approved</span>
                        <span className="spec-tag">🏗️ {msg.propertyCard.status.split('(')[0]}</span>
                      </div>

                      <div className="property-footer">
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Starting Price</span>
                          <span className="property-price">{msg.propertyCard.priceRange}</span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => handleBrochureDownload(msg.propertyCard.title)}
                          >
                            <Download size={12} />
                            <span>Brochure</span>
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => setActiveLeadForm(true)}
                          >
                            <Calendar size={12} />
                            <span>Book Visit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grounded Source Citation */}
                {msg.sourceCitation && (
                  <div className="source-citation">
                    <BookOpen size={11} />
                    <span>Verified Source: {msg.sourceCitation}</span>
                  </div>
                )}

                {/* Lead Captured Confirmation Pill */}
                {msg.leadCaptured && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>Lead Dispatched to CRM Pipeline</span>
                  </div>
                )}

                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Typing Animation */}
          {isTyping && (
            <div className="message-row bot">
              <div className="message-bubble" style={{ padding: '0.5rem 0.85rem' }}>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Pills */}
        <div className="suggestion-pills-bar">
          {(currentBot?.suggestedQuestions || [
            'Show me 3 BHK options in Ahmedabad',
            'What are the details of The Sovereign?',
            'Tell me about GIFT City residential projects',
            'Book a private site visit for this weekend'
          ]).map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-pill"
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form 
          className="chat-input-container"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about properties, BHK, pricing, RERA or amenities..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="chat-send-btn" 
            disabled={!input.trim() || isTyping}
            style={{ backgroundColor: currentBot.primaryColor || '#3b82f6' }}
            aria-label="Send Message"
          >
            <Send size={16} />
          </button>
        </form>

        {/* Lead Capture Modal Drawer */}
        {activeLeadForm && (
          <div className="modal-overlay" onClick={() => setActiveLeadForm(false)}>
            <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                  <h3 className="card-title" style={{ fontSize: '1rem' }}>
                    Schedule VIP Site Visit & Consultation
                  </h3>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setActiveLeadForm(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="label-required">*</span></label>
                    <div className="input-wrapper">
                      <User size={15} className="input-icon-left" />
                      <input
                        type="text"
                        required
                        className="form-input has-left-icon"
                        placeholder="e.g. Sanyam Patel"
                        value={leadFormData.name}
                        onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number (WhatsApp) <span className="label-required">*</span></label>
                    <div className="input-wrapper">
                      <Phone size={15} className="input-icon-left" />
                      <input
                        type="tel"
                        required
                        className="form-input has-left-icon"
                        placeholder="+91 98250 12345"
                        value={leadFormData.phone}
                        onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={15} className="input-icon-left" />
                      <input
                        type="email"
                        className="form-input has-left-icon"
                        placeholder="sanyam@example.com"
                        value={leadFormData.email}
                        onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Preferred Unit</label>
                      <select
                        className="form-select"
                        value={leadFormData.preferredBhk}
                        onChange={(e) => setLeadFormData({ ...leadFormData, preferredBhk: e.target.value })}
                      >
                        <option value="3 BHK Premium (Emerald Heights)">3 BHK (Emerald Heights)</option>
                        <option value="2 BHK Smart (GIFT City)">2 BHK (GIFT City)</option>
                        <option value="4 & 5 BHK Sky Villa (The Sovereign)">4/5 BHK Sky Villa (Sovereign)</option>
                        <option value="Commercial Office (Capital Square)">Commercial Office</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Budget Range</label>
                      <select
                        className="form-select"
                        value={leadFormData.budget}
                        onChange={(e) => setLeadFormData({ ...leadFormData, budget: e.target.value })}
                      >
                        <option value="₹95 L - ₹1.35 Cr">₹95 L - ₹1.35 Cr</option>
                        <option value="₹1.35 Cr - ₹2.50 Cr">₹1.35 Cr - ₹2.50 Cr</option>
                        <option value="₹4.50 Cr - ₹8.50 Cr">₹4.50 Cr - ₹8.50 Cr (Luxury)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveLeadForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Confirm VIP Site Visit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
