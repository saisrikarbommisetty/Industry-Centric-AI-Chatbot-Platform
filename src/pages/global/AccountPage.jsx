import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Building, 
  Key, 
  Users, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Shield, 
  Sparkles, 
  RefreshCw, 
  Mail,
  LogOut
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { DEMO_USERS } from '../../data/mockData';

export const AccountPage = () => {
  const navigate = useNavigate();
  const { currentUser, switchUser, logoutUser, addToast } = usePlatform();

  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'Production Webhook Key', key: 'nx_live_98a7b6c5d4e3f21049283746', created: '12 Aug 2026', status: 'active' },
    { id: 'key-2', name: 'Staging Development Key', key: 'nx_test_11223344556677889900aabb', created: '20 Sep 2026', status: 'active' }
  ]);

  const [copiedKeyId, setCopiedKeyId] = useState(null);

  const teamMembers = [
    { name: currentUser.name, email: currentUser.email, role: 'Workspace Owner', status: 'Active' },
    { name: 'Krunal Shah', email: 'krunal.shah@prycoons.com', role: 'Real Estate Sales Lead', status: 'Active' },
    { name: 'Neha Joshi', email: 'neha.j@prycoons.com', role: 'Digital Marketing Specialist', status: 'Active' }
  ];

  const handleCopyKey = (keyObj) => {
    navigator.clipboard.writeText(keyObj.key);
    setCopiedKeyId(keyObj.id);
    addToast(`API Key "${keyObj.name}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: 'key-' + Date.now(),
      name: `API Access Token #${apiKeys.length + 1}`,
      key: 'nx_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      created: 'Just now',
      status: 'active'
    };
    setApiKeys((prev) => [newKey, ...prev]);
    addToast('New API access key generated!', 'success');
  };

  const handleRevokeKey = (keyId) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    addToast('API Key revoked', 'info');
  };

  return (
    <div className="page-container" style={{ maxWidth: '950px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <User size={24} style={{ color: 'var(--primary)' }} />
            Account & Workspace Management
          </h1>
          <p className="page-description">
            Manage organization credentials, switch test user personas, and provision developer API tokens.
          </p>
        </div>

        <button 
          className="btn btn-outline btn-sm text-danger"
          onClick={() => {
            logoutUser();
            navigate('/login');
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Demo Persona Switcher Banner */}
      <div 
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--primary-border)',
          marginBottom: '1.75rem',
          padding: '1.25rem 1.5rem'
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
          <Sparkles size={16} />
          <span>INSTANT DEMO PERSONA SWITCHER</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
          Switch between predefined industry leaders to test different workspace roles:
        </p>

        <div className="grid-3" style={{ gap: '0.75rem' }}>
          {DEMO_USERS.map((user) => (
            <div
              key={user.id}
              className="card card-interactive flex items-center justify-between"
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: currentUser.id === user.id ? 'var(--primary-subtle)' : 'var(--bg-surface-elevated)',
                borderColor: currentUser.id === user.id ? 'var(--primary)' : 'var(--border-subtle)'
              }}
              onClick={() => switchUser(user.id)}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem' }}>{user.avatar}</span>
                <div className="truncate">
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {user.organization.split(' ')[0]}
                  </div>
                </div>
              </div>
              {currentUser.id === user.id && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Active</span>}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Details */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Profile & Organization</h3>
            <p className="card-subtitle">Active identity details</p>
          </div>
          <span className="badge badge-success">{currentUser.plan}</span>
        </div>

        <div className="grid-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" readOnly value={currentUser.name} />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" readOnly value={currentUser.email} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input type="text" className="form-input" readOnly value={currentUser.role} />
          </div>

          <div className="form-group">
            <label className="form-label">Organization Name</label>
            <input type="text" className="form-input" readOnly value={currentUser.organization} />
          </div>
        </div>
      </div>

      {/* Developer API Keys Management */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Key size={18} style={{ color: 'var(--accent-purple)' }} />
              Developer API Keys
            </h3>
            <p className="card-subtitle">Authenticate server-side bot ingestion and webhooks</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleGenerateKey}>
            <Plus size={14} />
            <span>Generate Key</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {apiKeys.map((keyObj) => (
            <div
              key={keyObj.id}
              className="flex items-center justify-between flex-wrap gap-2"
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{keyObj.name}</div>
                <div className="font-mono text-muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                  {keyObj.key.slice(0, 16)}••••••••••••
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleCopyKey(keyObj)}>
                  {copiedKeyId === keyObj.id ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                  <span>{copiedKeyId === keyObj.id ? 'Copied' : 'Copy'}</span>
                </button>
                <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleRevokeKey(keyObj.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Workspace Members */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Users size={18} style={{ color: 'var(--accent-emerald)' }} />
              Workspace Team Members
            </h3>
            <p className="card-subtitle">Colleagues with access to this tenant</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => addToast('Invitation dispatched to team member', 'success')}>
            <Plus size={14} />
            <span>Invite Colleague</span>
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div>{m.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email}</div>
                  </td>
                  <td>{m.role}</td>
                  <td><span className="badge badge-success">{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
