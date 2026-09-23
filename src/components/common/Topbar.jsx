import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  Sparkles, 
  ExternalLink,
  Bot,
  Plus
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const Topbar = ({ onToggleMobile }) => {
  const { currentUser, bots } = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const filteredBots = bots.filter((b) => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.industryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="app-topbar">
      {/* Left: Mobile Toggle & Quick Search */}
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
              placeholder="Search bots, properties, chats..."
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

          {/* Quick Search Autocomplete Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                padding: '0.5rem',
                maxHeight: '280px',
                overflowY: 'auto'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', fontWeight: 600 }}>
                MATCHING AI BOTS
              </div>
              {filteredBots.length > 0 ? (
                filteredBots.map((bot) => (
                  <div
                    key={bot.id}
                    className="flex items-center gap-2 cursor-pointer"
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
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
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                        {bot.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {bot.industryName}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No matching bots found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Launch, Public Chat Preview & Profile */}
      <div className="topbar-right">
        {/* Flagship Prycoons Chat Preview CTA */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => window.open('/chat/prycoons-ai', '_blank')}
          title="Open live interactive customer chat window in new tab"
        >
          <Sparkles size={14} style={{ color: '#3b82f6' }} />
          <span>Live Demo: Prycoons AI</span>
          <ExternalLink size={12} style={{ opacity: 0.6 }} />
        </button>

        {/* Create Bot Button */}
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/bots/create')}
        >
          <Plus size={14} />
          <span>New Bot</span>
        </button>

        {/* Notifications Icon with indicator dot */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-sm btn-icon" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <span 
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-rose)',
              boxShadow: '0 0 6px var(--accent-rose)'
            }} 
          />
        </div>

        {/* Current Plan Badge */}
        <div 
          className="badge badge-primary cursor-pointer"
          onClick={() => navigate('/pricing')}
          title="Click to view plan details"
        >
          {currentUser.plan}
        </div>
      </div>
    </header>
  );
};
