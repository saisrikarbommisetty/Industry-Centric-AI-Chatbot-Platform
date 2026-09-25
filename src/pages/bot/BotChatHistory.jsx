import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  Search, 
  MessageSquare, 
  User, 
  Phone, 
  Mail, 
  Download, 
  Clock, 
  Building2,
  CheckCircle2
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

  const filteredConversations = botConversations.filter((c) => {
    const matchesSearch = c.userName.toLowerCase().includes(search.toLowerCase()) ||
                          c.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                          c.leadInterest.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const selectedConv = botConversations.find((c) => c.id === selectedConvId) || botConversations[0];

  const handleExport = () => {
    if (!selectedConv) return;
    const textData = `CONVERSATION TRANSCRIPT - ${selectedConv.userName}\nAssistant: ${selectedConv.botName}\nDate: ${selectedConv.timestamp}\nRequirement: ${selectedConv.leadInterest}\n\n` +
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
        <div 
          className="grid-12"
          style={{
            height: 'calc(100vh - 210px)',
            minHeight: '580px',
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
            {/* Search */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
              <div className="input-wrapper">
                <Search size={15} className="input-icon-left" />
                <input
                  type="text"
                  className="form-input has-left-icon"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem 0.4rem 2.1rem', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConv?.id;
                  return (
                    <div
                      key={conv.id}
                      className="card-interactive"
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary-border)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => setSelectedConvId(conv.id)}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {conv.userName}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{conv.timestamp}</span>
                      </div>

                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }} className="truncate">
                        {conv.leadInterest}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {conv.leadStatus}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {conv.messagesCount} messages
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No conversations found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Message Thread Detail (8 cols) */}
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
            {selectedConv ? (
              <>
                {/* Header */}
                <div 
                  style={{
                    padding: '0.9rem 1.25rem',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedConv.userName}
                      </h3>
                      <span className="badge badge-primary">{selectedConv.leadStatus}</span>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {selectedConv.userPhone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {selectedConv.userEmail}
                      </span>
                    </div>
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                    <Download size={13} />
                    <span>Download Transcript</span>
                  </button>
                </div>

                {/* Message Thread */}
                <div 
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    backgroundColor: 'var(--bg-app)'
                  }}
                >
                  {selectedConv.transcript.map((msg, i) => (
                    <div key={i} className={`message-row ${msg.sender}`}>
                      <div className="message-bubble" style={{ fontSize: '0.85rem' }}>
                        <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                        <span className="message-time">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select a conversation to view the transcript
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
