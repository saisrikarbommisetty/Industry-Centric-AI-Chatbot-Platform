import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  RotateCcw, 
  ExternalLink, 
  Building2, 
  CheckCircle2, 
  Phone, 
  Calendar, 
  Download, 
  User, 
  Mail, 
  X,
  Sparkles
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
      text: currentBot?.welcomeMessage || 'Hello 👋 How can we help you today? Ask about 2/3/4 BHK luxury residences, commercial spaces on SG Highway, or high-yield investment properties in GIFT City.',
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
    preferredBhk: '3 BHK Luxury',
    budget: '₹1.50 Cr - ₹2.00 Cr',
    preferredDate: 'Saturday 11:00 AM'
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
    }, 500);
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
      text: `🎉 Thank you, **${leadFormData.name}**! Your site visit / consultation for **${leadFormData.preferredBhk}** has been confirmed for **${leadFormData.preferredDate}**.\n\nOur property advisor will reach out to you at **${leadFormData.phone}** with directions and floor plan brochures.`,
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
        text: currentBot?.welcomeMessage || 'Hello 👋 How can we help you today?',
        time: 'Just now'
      }
    ]);
    setActiveLeadForm(false);
    addToast('Conversation restarted', 'info');
  };

  const handleBrochureDownload = (projectName) => {
    addToast(`Downloading ${projectName} Specifications (PDF)...`, 'success');
  };

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
              <div className="chat-title">{currentBot?.name || 'BRIM Assistant'}</div>
              <div className="chat-subtitle">Prycoons Real Estate • Online</div>
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
                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                {/* Property Card Demonstration */}
                {msg.propertyCard && (
                  <div className="chat-property-card">
                    <img 
                      src={msg.propertyCard.image} 
                      alt={msg.propertyCard.title} 
                      className="chat-property-image"
                    />
                    <div className="chat-property-content">
                      <div className="chat-property-title">{msg.propertyCard.title}</div>
                      <div className="chat-property-tagline">{msg.propertyCard.tagline}</div>

                      <div className="chat-property-specs">
                        <div><strong>Config:</strong> {msg.propertyCard.bhk}</div>
                        <div><strong>Price:</strong> {msg.propertyCard.priceRange}</div>
                        <div><strong>Area:</strong> {msg.propertyCard.carpetArea}</div>
                        <div><strong>Location:</strong> {msg.propertyCard.location.split(',')[0]}</div>
                      </div>

                      <div className="chat-property-actions">
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => {
                            setLeadFormData((prev) => ({ ...prev, preferredBhk: msg.propertyCard.title }));
                            setActiveLeadForm(true);
                          }}
                        >
                          <Calendar size={13} />
                          <span>Schedule Visit</span>
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleBrochureDownload(msg.propertyCard.title)}
                        >
                          <Download size={13} />
                          <span>Brochure</span>
                        </button>
                      </div>
                    </div>
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
        <div className="suggestion-pills-bar">
          {(currentBot?.suggestedQuestions || [
            'Explore properties',
            'Find a suitable project',
            'Ask about pricing',
            'Talk to our team'
          ]).map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-pill"
              onClick={() => handleSendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Type your message or ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button 
            type="button" 
            className="chat-send-btn" 
            disabled={!input.trim()}
            onClick={() => handleSendMessage()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
