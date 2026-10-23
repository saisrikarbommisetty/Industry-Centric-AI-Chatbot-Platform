import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Bot, 
  Play, 
  ExternalLink, 
  Share2, 
  Trash2, 
  ChevronRight,
  MessageSquare, 
  Users, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { INDUSTRIES } from '../../data/mockData';

export const BotsList = () => {
  const navigate = useNavigate();
  const { bots, deleteBot, addToast } = usePlatform();
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [deleteModalBot, setDeleteModalBot] = useState(null);

  const filteredBots = bots.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
                          b.description.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || b.industryId === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const handleDeleteConfirm = () => {
    if (deleteModalBot) {
      deleteBot(deleteModalBot.id);
      setDeleteModalBot(null);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Assistants
          </h1>
          <p className="page-description">
            Manage your conversational assistants, knowledge bases, and customer deployments.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/bots/create')}>
          <Plus size={16} />
          <span>Create Assistant</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Search Input */}
          <div className="input-wrapper" style={{ maxWidth: '300px', width: '100%' }}>
            <Search size={16} className="input-icon-left" />
            <input
              type="text"
              className="form-input has-left-icon"
              placeholder="Search assistants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.45rem 0.85rem 0.45rem 2.2rem', fontSize: '0.825rem' }}
            />
          </div>

          {/* Industry Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`btn btn-sm ${selectedIndustry === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedIndustry('all')}
            >
              All ({bots.length})
            </button>
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                className={`btn btn-sm ${selectedIndustry === ind.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedIndustry(ind.id)}
              >
                {ind.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assistants Cards Grid */}
      <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
        {filteredBots.map((bot) => (
          <div 
            key={bot.id} 
            className="card flex flex-col justify-between"
            style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}
          >
            <div>
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-3" style={{ marginBottom: '0.85rem' }}>
                <div className="flex items-center gap-3">
                  <div 
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-soft-surface)',
                      border: '1px solid var(--primary-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0
                    }}
                  >
                    {bot.avatar || '🏢'}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {bot.name}
                    </h3>
                    <div className="flex items-center gap-2" style={{ marginTop: '0.2rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                        {bot.industryName}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                        <span className="status-dot active" style={{ width: 5, height: 5 }} />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-ghost btn-sm btn-icon text-muted"
                  title="Delete Assistant"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModalBot(bot);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                {bot.description}
              </p>

              {/* Stats Row */}
              <div 
                className="flex items-center justify-between"
                style={{
                  background: 'var(--bg-app)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1.25rem'
                }}
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={13} style={{ color: 'var(--primary)' }} />
                  <strong style={{ color: 'var(--text-primary)' }}>{bot.totalConversations || 0}</strong> chats
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} style={{ color: 'var(--accent-emerald)' }} />
                  <strong style={{ color: 'var(--text-primary)' }}>{bot.leadCount || 0}</strong> leads
                </span>
                <span>•</span>
                <span>{bot.sourcesCount || 1} sources</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => window.open(`/chat/${bot.id}`, '_blank')}
                  title="Preview Customer Assistant"
                >
                  <Play size={13} style={{ color: 'var(--primary)' }} />
                  <span>Preview</span>
                  <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </button>

                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/bots/${bot.id}/share`)}
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>
              </div>

              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/bots/${bot.id}/overview`)}
              >
                <span>Manage</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalBot && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Delete Assistant</h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{deleteModalBot.name}</strong>? This action will remove its indexed knowledge base and recorded conversations.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setDeleteModalBot(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleDeleteConfirm}
              >
                Delete Assistant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
