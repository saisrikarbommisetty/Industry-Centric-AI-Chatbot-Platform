import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Download, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Building2,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotChatHistory = () => {
  const { botId } = useParams();
  const { bots, conversations, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const botConversations = conversations.filter((c) => c.botId === currentBot?.id);

  const [selectedConvId, setSelectedConvId] = useState(() => {
    return botConversations[0]?.id || null;
  });

  const [search, setSearch] = useState('');
  const [filterLead, setFilterLead] = useState('all');

  const filteredConversations = botConversations.filter((c) => {
    const matchesSearch = c.userName.toLowerCase().includes(search.toLowerCase()) ||
                          c.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                          c.leadInterest.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterLead === 'all' || (filterLead === 'leads' && c.leadStatus?.includes('Lead'));
    return matchesSearch && matchesFilter;
  });

  const selectedConv = botConversations.find((c) => c.id === selectedConvId) || botConversations[0];

  const handleExport = () => {
    if (!selectedConv) return;
    const textData = `CONVERSATION TRANSCRIPT - ${selectedConv.userName}\nBot: ${selectedConv.botName}\nDate: ${selectedConv.timestamp}\nLead Interest: ${selectedConv.leadInterest}\n\n` +
      selectedConv.transcript.map((m) => `[${m.time}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');

    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcript_${selectedConv.userName.replace(/\s+/g, '_')}.txt`;
    a.click();
    addToast('Conversation transcript downloaded', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Split Screen Master-Detail Layout */}
        <div 
          className="grid-12"
          style={{
            height: 'calc(100vh - 210px)',
            minHeight: '620px',
            gap: '1.25rem'
          }}
        >
          {/* Left Column: Conversation Sessions List (4 cols) */}
          <div 
            className="card"
            style={{
              gridColumn: 'span 4',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {/* Search & Filter Header */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
              <div className="input-wrapper" style={{ marginBottom: '0.65rem' }}>
                <Search size={15} className="input-icon-left" />
                <input
                  type="text"
                  className="form-input has-left-icon"
                  placeholder="Search chats, leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem 0.4rem 2.1rem', fontSize: '0.8rem' }}
                />
              </div>

              <div className="flex gap-1">
                <button
                  className={`btn btn-sm ${filterLead === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setFilterLead('all')}
                >
                  All ({botConversations.length})
                </button>
                <button
                  className={`btn btn-sm ${filterLead === 'leads' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setFilterLead('leads')}
                >
                  Qualified Leads
                </button>
              </div>
            </div>

            {/* Conversation List Scrollable Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className="card card-interactive"
                      style={{
                        padding: '0.75rem 0.85rem',
                        marginBottom: '0.4rem',
                        borderLeft: isSelected ? '3px solid var(--primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-surface)'
                      }}
                      onClick={() => setSelectedConvId(conv.id)}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {conv.userName}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {conv.timestamp.split(',')[0]}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }} className="truncate">
                        {conv.leadInterest}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          {conv.leadStatus}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {conv.transcript.length} msgs
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  No conversations match filters
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Deep Conversation Inspector (8 cols) */}
          {selectedConv ? (
            <div 
              className="card"
              style={{
                gridColumn: 'span 8',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden'
              }}
            >
              {/* User Metadata Profile Bar */}
              <div 
                style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-surface-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--grad-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}
                  >
                    {selectedConv.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedConv.userName}</h3>
                      <span className="badge badge-success">{selectedConv.leadStatus}</span>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <span className="flex items-center gap-1"><Mail size={12} /> {selectedConv.userEmail}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {selectedConv.userPhone}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {selectedConv.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={handleExport} title="Download text transcript">
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Lead Requirements Banner */}
              <div 
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem'
                }}
              >
                <div className="flex items-center gap-2">
                  <Tag size={13} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Target Property / BHK:</span>
                  <span style={{ color: '#60a5fa' }}>{selectedConv.leadInterest}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>Budget: {selectedConv.budget}</span>
                </div>
                <span className="text-success font-mono">{selectedConv.sentiment}</span>
              </div>

              {/* Message Transcript Stream */}
              <div 
                style={{
                  flex: 1,
                  padding: '1.25rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {selectedConv.transcript.map((msg, i) => (
                  <div key={i} className={`message-row ${msg.sender}`}>
                    <div className="message-bubble">
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                      {/* Render property card if attached in transcript */}
                      {msg.propertyCard && (
                        <div className="chat-property-card" style={{ maxWidth: '340px' }}>
                          <div className="property-card-img-placeholder">
                            <span className="property-badge">{msg.propertyCard.bhk}</span>
                            <span>{msg.propertyCard.title}</span>
                          </div>
                          <div className="property-card-body">
                            <div className="property-title">{msg.propertyCard.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                              {msg.propertyCard.location}
                            </div>
                            <div className="property-footer">
                              <span className="property-price">{msg.propertyCard.priceRange}</span>
                              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{msg.propertyCard.carpetArea}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Source Citation */}
                      {msg.sourceCitation && (
                        <div className="source-citation">
                          <BookOpen size={11} />
                          <span>Grounded Source: {msg.sourceCitation}</span>
                        </div>
                      )}

                      {msg.leadCaptured && (
                        <div className="flex items-center gap-1.5" style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                          <CheckCircle2 size={13} />
                          <span>VIP Consultation / Site Visit Slot Captured</span>
                        </div>
                      )}

                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ gridColumn: 'span 8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <MessageSquare size={32} />
                <h3 className="empty-state-title">Select a Conversation</h3>
                <p className="empty-state-desc">Choose an active session from the left pane to view full customer transcript and captured requirements.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
