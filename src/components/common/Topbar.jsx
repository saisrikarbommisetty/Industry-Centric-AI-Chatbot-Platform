import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  ExternalLink,
  Plus,
  Play
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const Topbar = ({ onToggleMobile }) => {
  const { currentUser, bots } = usePlatform();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const filteredBots = bots.filter((b) => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.industryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="app-topbar">
      {/* Left: Mobile Toggle & Search */}
      <div className="topbar-left">
        <button 
          className="mobile-menu-toggle btn btn-ghost btn-icon" 
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ position: 'relative', width: '280px' }}>
          <div className="input-wrapper">
            <Search size={16} className="input-icon-left" />
            <input 
              type="text" 
              className="form-input has-left-icon" 
              placeholder="Search assistants, projects..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              style={{ padding: '0.45rem 0.85rem 0.45rem 2.2rem', fontSize: '0.825rem' }}
            />
          </div>

          {/* Quick Autocomplete Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                padding: '0.4rem',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Matching Assistants
              </div>
              {filteredBots.length > 0 ? (
                filteredBots.map((bot) => (
                  <div
                    key={bot.id}
                    className="flex items-center gap-2 cursor-pointer"
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      navigate(`/bots/${bot.id}/overview`);
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                  >
                    <span>{bot.avatar}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                        {bot.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {bot.industryName}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No matching assistants found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Preview & User Status */}
      <div className="topbar-right">
        {/* Customer Chat Preview CTA */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => window.open('/chat/prycoons-ai', '_blank')}
          title="Open customer assistant preview in new window"
        >
          <Play size={13} style={{ color: 'var(--primary)' }} />
          <span>Preview Assistant</span>
          <ExternalLink size={12} style={{ opacity: 0.6 }} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-sm btn-icon" aria-label="Notifications">
            <Bell size={17} />
          </button>
          <span 
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)'
            }} 
          />
        </div>

        {/* Plan Badge */}
        <div 
          className="badge badge-primary cursor-pointer"
          onClick={() => navigate('/pricing')}
          title="View workspace subscription"
        >
          {currentUser?.plan || 'Growth Pro'}
        </div>
      </div>
    </header>
  );
};
