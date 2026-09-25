import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Building, 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  LogOut,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const AccountPage = () => {
  const navigate = useNavigate();
  const { currentUser, logoutUser, addToast } = usePlatform();

  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'Production Assistant Token', key: 'brim_live_98a7b6c5d4e3f21049283746', created: '12 Aug 2026', status: 'active' },
    { id: 'key-2', name: 'Staging Webhook Token', key: 'brim_test_11223344556677889900aabb', created: '20 Sep 2026', status: 'active' }
  ]);

  const [copiedKeyId, setCopiedKeyId] = useState(null);

  const handleCopyKey = (keyObj) => {
    navigator.clipboard.writeText(keyObj.key);
    setCopiedKeyId(keyObj.id);
    addToast(`API Token "${keyObj.name}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: 'key-' + Date.now(),
      name: `API Access Token #${apiKeys.length + 1}`,
      key: 'brim_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      created: 'Just now',
      status: 'active'
    };
    setApiKeys((prev) => [newKey, ...prev]);
    addToast('New API access token generated!', 'success');
  };

  const handleRevokeKey = (keyId) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    addToast('API Token revoked', 'info');
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Settings & Account
          </h1>
          <p className="page-description">
            Manage your client workspace profile and developer integration tokens.
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

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Client Profile</h2>
            <p className="card-subtitle">Workspace account holder</p>
          </div>
          <span className="badge badge-primary">{currentUser?.role || 'Client Director'}</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap" style={{ marginBottom: '1.25rem' }}>
          <div 
            className="user-avatar"
            style={{ width: '54px', height: '54px', fontSize: '1.2rem', borderRadius: 'var(--radius-lg)' }}
          >
            {currentUser?.avatar || 'SS'}
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentUser?.name || 'Sai Srikar'}
            </h3>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {currentUser?.email || 'saisrikar@example.com'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Organization: <strong>{currentUser?.organization || 'BRIM Workspace'}</strong>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div>
            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>CURRENT SUBSCRIPTION</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {currentUser?.plan || 'Growth Pro'}
            </div>
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>MONTHLY CONVERSATION CREDITS</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {currentUser?.creditsRemaining || '8,158 / 10,000'}
            </div>
          </div>
        </div>
      </div>

      {/* Developer API Tokens */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Integration Tokens</h2>
            <p className="card-subtitle">Connect webhooks and customer portal integrations</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleGenerateKey}>
            <Plus size={14} />
            <span>Generate Token</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {apiKeys.map((key) => (
            <div 
              key={key.id}
              className="flex items-center justify-between flex-wrap gap-2"
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-default)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {key.name}
                </div>
                <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {key.key.substring(0, 16)}••••••••••••
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopyKey(key)}
                >
                  {copiedKeyId === key.id ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                  <span>{copiedKeyId === key.id ? 'Copied' : 'Copy'}</span>
                </button>

                <button 
                  className="btn btn-ghost btn-sm btn-icon text-muted"
                  onClick={() => handleRevokeKey(key.id)}
                  title="Revoke Token"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
