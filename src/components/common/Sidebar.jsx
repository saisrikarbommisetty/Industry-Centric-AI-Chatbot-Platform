import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquareText, 
  BarChart3, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  User, 
  Sparkles, 
  Plus, 
  Moon, 
  Sun,
  X,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { theme, toggleTheme, currentUser, bots, switchUser, logoutUser } = usePlatform();
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <Sparkles size={18} />
        </div>
        <div className="brand-info">
          <div className="brand-name">
            NexusAI
            <span className="brand-badge">PRO</span>
          </div>
          <span className="brand-tagline">Industry Chatbot Suite</span>
        </div>
        {mobileOpen && (
          <button 
            className="btn btn-ghost btn-sm btn-icon" 
            style={{ marginLeft: 'auto' }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sidebar Navigation Body */}
      <div className="sidebar-body">
        {/* Quick CTA */}
        <div>
          <button 
            className="btn btn-primary w-full"
            style={{ padding: '0.65rem', justifyContent: 'center' }}
            onClick={() => { navigate('/bots/create'); handleNavClick(); }}
          >
            <Plus size={16} />
            <span>Create New Bot</span>
          </button>
        </div>

        {/* Platform Section */}
        <div className="nav-section">
          <span className="nav-section-title">Core Platform</span>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/bots" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <Bot size={18} />
            <span>My AI Bots</span>
            <span className="nav-item-badge">{bots.length}</span>
          </NavLink>
          <NavLink to="/global-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <MessageSquareText size={18} />
            <span>Chat History</span>
          </NavLink>
          <NavLink to="/global-analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <BarChart3 size={18} />
            <span>Global Analytics</span>
          </NavLink>
        </div>

        {/* Active Industry Bots Quick List */}
        <div className="nav-section">
          <span className="nav-section-title">Featured Showcase</span>
          {bots.slice(0, 3).map((bot) => (
            <NavLink 
              key={bot.id} 
              to={`/bots/${bot.id}/overview`} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
              title={bot.name}
            >
              <span style={{ fontSize: '1.1rem' }}>{bot.avatar}</span>
              <span className="truncate">{bot.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Account & Administration */}
        <div className="nav-section">
          <span className="nav-section-title">Account & Billing</span>
          <NavLink to="/pricing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <CreditCard size={18} />
            <span>Pricing & Plans</span>
          </NavLink>
          <NavLink to="/account" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <User size={18} />
            <span>Account & Team</span>
          </NavLink>
          <NavLink to="/help" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <HelpCircle size={18} />
            <span>Help & Guides</span>
          </NavLink>
        </div>
      </div>

      {/* Sidebar Footer with Theme & User Profile */}
      <div className="sidebar-footer">
        <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Appearance</span>
          <button 
            className="btn btn-ghost btn-sm btn-icon" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} style={{ color: '#fbbf24' }} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="user-card" style={{ flex: 1, minWidth: 0 }} onClick={() => navigate('/account')}>
            <div className="user-avatar">{currentUser?.avatar || 'U'}</div>
            <div className="user-details">
              <div className="user-name">{currentUser?.name || 'User'}</div>
              <div className="user-role">{currentUser?.role || 'Workspace Member'}</div>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm btn-icon text-muted"
            title="Sign Out"
            onClick={() => {
              logoutUser();
              navigate('/login');
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
