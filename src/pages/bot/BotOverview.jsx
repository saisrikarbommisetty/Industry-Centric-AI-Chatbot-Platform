import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BotNav 
} from '../../components/common/BotNav';
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  Zap, 
  Share2, 
  Play, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check
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
      text: currentBot?.welcomeMessage || 'Hello! How can I assist you with real-estate and property discovery today?',
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
    const code = `<script src="https://cdn.nexusai.com/widget.js" data-bot-id="${currentBot.id}" async></script>`;
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
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Total Inquiries</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                <MessageSquare size={18} />
              </div>
            </div>
            <div className="stat-value">{currentBot?.totalConversations || botConversations.length || 0}</div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>All-time customer sessions</span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Qualified Leads</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="stat-value">{currentBot?.leadCount || 142}</div>
            <span className="text-success" style={{ fontSize: '0.72rem', fontWeight: 600 }}>28.6% conversion rate</span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Knowledge Sources</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)' }}>
                <BookOpen size={18} />
              </div>
            </div>
            <div className="stat-value">{botSources.length || currentBot?.sourcesCount || 0}</div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>PDFs, URLs & FAQs</span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Satisfaction (CSAT)</span>
              <div className="stat-icon-wrapper" style={{ background: 'var(--accent-amber-subtle)', color: 'var(--accent-amber)' }}>
                <Sparkles size={18} />
              </div>
            </div>
            <div className="stat-value">{currentBot?.csat || '4.9'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span></div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Avg Latency: {currentBot?.avgResponseTime || '0.8s'}</span>
          </div>
        </div>

        {/* Two Columns: Left Knowledge & Embed Info / Right Live Quick Test Box */}
        <div className="grid-12" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Left Column (7 cols) */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* System Persona & Prompt Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Configured Persona & Instructions</h3>
                  <p className="card-subtitle">Active behavioral guidelines</p>
                </div>
                <span className="badge badge-primary">{currentBot?.tone}</span>
              </div>

              <div 
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}
              >
                {currentBot?.promptGuidelines || 'Provide exact BHK carpet area, pricing ranges, amenities, and RERA registration numbers. Proactively encourage scheduling an on-site visit.'}
              </div>
            </div>

            {/* Active Knowledge Sources Summary */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Indexed Knowledge Base</h3>
                  <p className="card-subtitle">{botSources.length} synchronized vector sources</p>
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
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{src.type}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{src.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>{src.chunks} Chunks</span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Synced</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Embed Snippet */}
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Embed Widget on Website</h3>
                <button className="btn btn-ghost btn-sm" onClick={handleCopyEmbed}>
                  {copiedEmbed ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                  <span>{copiedEmbed ? 'Copied' : 'Copy Snippet'}</span>
                </button>
              </div>
              <div 
                style={{
                  background: 'var(--bg-input)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  color: '#93c5fd',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {`<script src="https://cdn.nexusai.com/widget.js" data-bot-id="${currentBot.id}" async></script>`}
              </div>
            </div>
          </div>

          {/* Right Column: Live Quick Test Console (5 cols) */}
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
                  background: 'var(--bg-surface-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.25rem' }}>{currentBot.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Interactive Test Console</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Simulates live RAG responses</div>
                  </div>
                </div>

                <button 
                  className="btn btn-ghost btn-sm btn-icon"
                  title="Clear Console"
                  onClick={() => setMessages([{ id: 'init', sender: 'bot', text: currentBot?.welcomeMessage || 'Hello! How may I assist you?', time: 'Just now' }])}
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
                  gap: '0.85rem'
                }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-row ${msg.sender}`}>
                    <div className="message-bubble" style={{ fontSize: '0.825rem', padding: '0.65rem 0.85rem' }}>
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      {msg.sourceCitation && (
                        <div className="source-citation" style={{ fontSize: '0.68rem', marginTop: '0.4rem' }}>
                          <BookOpen size={10} />
                          <span>{msg.sourceCitation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Pills */}
              <div className="suggestion-pills-bar" style={{ padding: '0.35rem 0.75rem' }}>
                {(currentBot?.suggestedQuestions || ['Show me 3 BHK options', 'What are GIFT City projects?']).slice(0, 2).map((q, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className="suggestion-pill"
                    onClick={() => {
                      setInput(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ask a property or domain question..."
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
