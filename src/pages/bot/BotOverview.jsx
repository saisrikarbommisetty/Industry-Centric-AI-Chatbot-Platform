import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  Share2, 
  Play, 
  ExternalLink, 
  Send, 
  RefreshCw, 
  Copy, 
  Check,
  Clock,
  Sparkles
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotOverview = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { bots, knowledgeSources, conversations, sendChatMessage, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const botSources = knowledgeSources.filter((k) => k.botId === currentBot?.id);
  const botConversations = conversations.filter((c) => c.botId === currentBot?.id);

  // Quick Live Test Panel State
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: currentBot?.welcomeMessage || 'Hello! How can we assist you with property inquiries today?',
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botResponse = sendChatMessage(currentBot.id, userText, messages);
      setMessages((prev) => [...prev, botResponse]);
    }, 400);
  };

  const handleCopyEmbed = () => {
    const code = `<script src="https://cdn.brimai.com/widget.js" data-assistant-id="${currentBot.id}" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    addToast('Embed snippet copied!', 'success');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* KPI Row */}
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Conversations</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                <MessageSquare size={16} />
              </div>
            </div>
            <div className="stat-value">{currentBot?.totalConversations || botConversations.length || 342}</div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>customer sessions</span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Leads Captured</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)' }}>
                <Users size={16} />
              </div>
            </div>
            <div className="stat-value">{currentBot?.leadCount || 28}</div>
            <span className="text-success" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Qualified Inquiries</span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Knowledge Sources</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
                <BookOpen size={16} />
              </div>
            </div>
            <div className="stat-value">{botSources.length || currentBot?.sourcesCount || 5}</div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Websites & Documents</span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assistant Status</span>
              <span className="badge badge-success">Active</span>
            </div>
            <div className="stat-value" style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              Ready & Live
            </div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Avg response time: {currentBot?.avgResponseTime || '0.8s'}</span>
          </div>
        </div>

        {/* Two Columns: Left (7 cols) Details & Sources / Right (5 cols) Live Test Console */}
        <div className="grid-12" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Left Column */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Assistant Instructions Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Assistant Instructions & Guidelines</h3>
                  <p className="card-subtitle">Active behavioral instructions</p>
                </div>
                <span className="badge badge-primary">{currentBot?.tone}</span>
              </div>

              <div 
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}
              >
                {currentBot?.promptGuidelines || 'Provide clear and accurate project details, answers to visitor questions, and assist with bookings.'}
              </div>
            </div>

            {/* Active Knowledge Sources Summary */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Knowledge Base</h3>
                  <p className="card-subtitle">{botSources.length} synchronized sources</p>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/bots/${currentBot.id}/knowledge`)}
                >
                  Manage Knowledge
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {botSources.slice(0, 4).map((src) => (
                  <div 
                    key={src.id}
                    className="flex items-center justify-between"
                    style={{
                      background: 'var(--bg-app)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.825rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{src.type}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{src.title}</span>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Synced</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Embed Snippet */}
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.6rem' }}>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Embed on Website</h3>
                <button className="btn btn-ghost btn-sm" onClick={handleCopyEmbed}>
                  {copiedEmbed ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                  <span>{copiedEmbed ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <div 
                style={{
                  background: 'var(--bg-app)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  overflowX: 'auto',
                  border: '1px solid var(--border-default)'
                }}
              >
                {`<script src="https://cdn.brimai.com/widget.js" data-assistant-id="${currentBot.id}" async></script>`}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview Test Console (5 cols) */}
          <div style={{ gridColumn: 'span 5' }}>
            <div 
              className="card"
              style={{
                height: '560px',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden'
              }}
            >
              {/* Test Header */}
              <div 
                style={{
                  padding: '0.85rem 1.15rem',
                  background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent-soft-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem'
                    }}
                  >
                    {currentBot.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Interactive Test</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Simulate customer responses</div>
                  </div>
                </div>

                <button 
                  className="btn btn-ghost btn-sm btn-icon"
                  title="Restart conversation"
                  onClick={() => setMessages([{ id: 'init', sender: 'bot', text: currentBot?.welcomeMessage || 'Hello! How may we assist you today?', time: 'Just now' }])}
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Message Stream */}
              <div 
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  backgroundColor: 'var(--bg-app)'
                }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-row ${msg.sender}`}>
                    <div className="message-bubble" style={{ fontSize: '0.825rem', padding: '0.65rem 0.85rem' }}>
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Pills */}
              <div className="suggestion-pills-bar" style={{ padding: '0.35rem 0.75rem' }}>
                {(currentBot?.suggestedQuestions || ['Explore properties', 'Ask about pricing']).slice(0, 2).map((q, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className="suggestion-pill"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ask a question or test responses..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm btn-icon" disabled={!input.trim()}>
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
