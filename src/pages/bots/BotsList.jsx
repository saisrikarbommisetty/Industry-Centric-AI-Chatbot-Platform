import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Bot, 
  Sparkles, 
  ExternalLink, 
  Share2, 
  Trash2, 
  Settings, 
  MessageSquare, 
  Users, 
  BookOpen, 
  Play, 
  Filter,
  CheckCircle,
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
            <Bot size={26} style={{ color: 'var(--primary)' }} />
            Industry AI Assistants
          </h1>
          <p className="page-description">
            Deploy and manage specialized autonomous conversational bots tailored to distinct industry verticals.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/bots/create')}>
          <Plus size={16} />
          <span>Create New Bot</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Search Input */}
          <div className="input-wrapper" style={{ maxWidth: '320px' }}>
            <Search size={16} className="input-icon-left" />
            <input
              type="text"
              className="form-input has-left-icon"
              placeholder="Search by name or keyword..."
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
              All Industries ({bots.length})
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

      {/* Bots Grid */}
      {filteredBots.length > 0 ? (
        <div className="grid-3">
          {filteredBots.map((bot) => (
            <div 
              key={bot.id} 
              className="card card-interactive flex flex-col justify-between"
              style={{ minHeight: '260px' }}
              onClick={() => navigate(`/bots/${bot.id}/overview`)}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2" style={{ marginBottom: '0.85rem' }}>
                  <div className="flex items-center gap-3">
                    <div 
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--primary-subtle)',
                        border: '1px solid var(--primary-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem'
                      }}
                    >
                      {bot.avatar}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {bot.name}
                      </h3>
                      <div className="flex items-center gap-1.5" style={{ marginTop: '0.15rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                          {bot.industryName.split('&')[0]}
                        </span>
                        <span className={`status-dot ${bot.status === 'active' ? 'active' : 'idle'}`} title={`Status: ${bot.status}`} />
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-ghost btn-sm btn-icon"
                    title="Live Customer Chat Preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/chat/${bot.id}`, '_blank');
                    }}
                  >
                    <ExternalLink size={15} />
                  </button>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.15rem', lineClamp: 2 }}>
                  {bot.description}
                </p>

                {/* Metrics Badges Row */}
                <div className="grid-3" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.45rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conversations</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bot.totalConversations || 0}</div>
                  </div>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.45rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Leads</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>{bot.leadCount || 0}</div>
                  </div>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.45rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sources</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa' }}>{bot.sourcesCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div 
                className="flex items-center justify-between" 
                style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/bots/${bot.id}/overview`)}
                >
                  Manage Bot
                </button>

                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    title="Share & Embed Widget"
                    onClick={() => navigate(`/bots/${bot.id}/share`)}
                  >
                    <Share2 size={15} />
                  </button>

                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    title="Settings"
                    onClick={() => navigate(`/bots/${bot.id}/settings`)}
                  >
                    <Settings size={15} />
                  </button>

                  <button
                    className="btn btn-ghost btn-sm btn-icon text-danger"
                    title="Delete Bot"
                    onClick={() => setDeleteModalBot(bot)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bot size={28} />
          </div>
          <h3 className="empty-state-title">No AI Assistants Found</h3>
          <p className="empty-state-desc">
            No bots match your current search query or industry filter. Create a new custom bot or clear your filters.
          </p>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setSelectedIndustry('all'); }}>
              Reset Filters
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/bots/create')}>
              <Plus size={14} />
              <span>Create Assistant</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalBot && (
        <div className="modal-overlay" onClick={() => setDeleteModalBot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title text-danger" style={{ fontSize: '1.1rem' }}>
                <AlertTriangle size={18} />
                Confirm Bot Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteModalBot.name}</strong>?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                This will purge all {deleteModalBot.sourcesCount} indexed knowledge sources and {deleteModalBot.totalConversations} associated chat transcripts permanently.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteModalBot(null)}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteConfirm}>
                Yes, Delete Bot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
