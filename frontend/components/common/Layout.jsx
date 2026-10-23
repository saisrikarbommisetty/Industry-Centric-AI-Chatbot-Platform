import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { usePlatform } from '../../context/PlatformContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = usePlatform();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="app-main">
        <Topbar onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Floating Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              onClick={() => removeToast(toast.id)}
              style={{ padding: '0.2rem', marginLeft: 'auto' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
