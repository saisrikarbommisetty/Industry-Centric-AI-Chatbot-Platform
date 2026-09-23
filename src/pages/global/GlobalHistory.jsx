import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquareText, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  User, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const GlobalHistory = () => {
  const navigate = useNavigate();
  const { conversations, bots, addToast } = usePlatform();
  const [search, setSearch] = useState('');
  const [selectedBotFilter, setSelectedBotFilter] = useState('all');

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.userName.toLowerCase().includes(search.toLowerCase()) ||
                          c.leadInterest.toLowerCase().includes(search.toLowerCase()) ||
                          c.botName.toLowerCase().includes(search.toLowerCase());
    const matchesBot = selectedBotFilter === 'all' || c.botId === selectedBotFilter;
    return matchesSearch && matchesBot;
  });

  const handleExportAll = () => {
    addToast('Audit log of all conversations exported as CSV', 'success');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MessageSquareText size={24} style={{ color: 'var(--primary)' }} />
            Unified Conversation Audit Log
          </h1>
          <p className="page-description">
            Audit customer transcripts, high-intent lead captures, and satisfaction metrics across all active industry AI assistants.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExportAll}>
          <Download size={14} />
          <span>Export All CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="input-wrapper" style={{ maxWidth: '320px' }}>
            <Search size={16} className="input-icon-left" />
            <input
              type="text"
              className="form-input has-left-icon"
              placeholder="Search by visitor, interest, or bot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.45rem 0.85rem 0.45rem 2.2rem', fontSize: '0.825rem' }}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`btn btn-sm ${selectedBotFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedBotFilter('all')}
            >
              All Bots ({conversations.length})
            </button>
            {bots.map((b) => (
              <button
                key={b.id}
                className={`btn btn-sm ${selectedBotFilter === b.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedBotFilter(b.id)}
              >
                <span>{b.avatar}</span>
                <span>{b.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor Profile</th>
                <th>Target Assistant</th>
                <th>Inquiry / Requirements</th>
                <th>Lead Status</th>
                <th>Duration</th>
                <th>Sentiment</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((conv) => (
                <tr key={conv.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div 
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      >
                        {conv.userName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {conv.userName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {conv.userPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {conv.botName}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {conv.leadInterest}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Budget: {conv.budget}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {conv.leadStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {conv.duration}
                  </td>
                  <td>
                    <span className="text-success font-mono" style={{ fontSize: '0.75rem' }}>
                      {conv.sentiment.split(' ')[0]}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {conv.timestamp}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/bots/${conv.botId}/conversations`)}
                    >
                      <span>View Chat</span>
                      <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
