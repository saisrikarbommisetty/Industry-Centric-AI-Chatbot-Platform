import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  CreditCard, 
  Settings, 
  Plus, 
  Moon, 
  Sun,
  X,
  LogOut
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { theme, toggleTheme, currentUser, bots, logoutUser } = usePlatform();
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-logo">B</div>
        <div className="brand-info">
          <div className="brand-name">
            BRIM AI
            <span className="brand-badge">PRO</span>
          </div>
          <span className="brand-tagline">Conversational Assistant</span>
        </div>
        {mobileOpen && (
          <button 
            className="btn btn-ghost btn-sm btn-icon" 
            style={{ marginLeft: 'auto' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sidebar Navigation Body */}
      <div className="sidebar-body">
        {/* Quick Create CTA */}
        <div>
          <button 
            className="btn btn-primary w-full"
            style={{ padding: '0.6rem 0.85rem', justifyContent: 'center' }}
            onClick={() => { navigate('/bots/create'); handleNavClick(); }}
          >
            <Plus size={16} />
            <span>Create Assistant</span>
          </button>
        </div>

        {/* Main Navigation */}
        <div className="nav-section">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/bots" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <Bot size={18} />
            <span>Assistants</span>
            <span className="nav-item-badge">{bots.length}</span>
          </NavLink>
          <NavLink to="/global-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <MessageSquare size={18} />
            <span>Conversations</span>
          </NavLink>
          <NavLink to="/global-analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>
        </div>

        <div className="nav-divider" />

        {/* Workspace & Settings */}
        <div className="nav-section">
          <NavLink to="/pricing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <CreditCard size={18} />
            <span>Pricing</span>
          </NavLink>
          <NavLink to="/account" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>

      {/* Sidebar Footer with Theme & User Profile */}
      <div className="sidebar-footer">
        <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
          <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Theme</span>
          <button 
            className="btn btn-ghost btn-sm btn-icon" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} style={{ color: '#F59E0B' }} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="user-card" style={{ flex: 1, minWidth: 0 }} onClick={() => navigate('/account')}>
            <div className="user-avatar">{currentUser?.avatar || 'SS'}</div>
            <div className="user-details">
              <div className="user-name">{currentUser?.name || 'Sai Srikar'}</div>
              <div className="user-role">{currentUser?.role || 'Client Director'}</div>
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
