import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Lock, Mail } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { DEMO_USERS } from '../../data/mockData';

export const Login = () => {
  const navigate = useNavigate();
  const { loginUser, switchUser, addToast, users } = usePlatform();
  const [email, setEmail] = useState('aarav.sharma@prycoons.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Please enter your email address', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      loginUser(email, password);
      navigate('/');
    }, 500);
  };

  const handleQuickDemoUser = (user) => {
    switchUser(user.id);
    navigate('/');
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(59, 130, 246, 0.15), var(--bg-app) 70%)'
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div 
            className="brand-logo" 
            style={{ width: '48px', height: '48px', margin: '0 auto 1rem', borderRadius: 'var(--radius-lg)' }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Welcome to NexusAI</h2>
          <p style={{ fontSize: '0.875rem' }}>
            Next-Gen Industry-Centric AI Chatbot Orchestration
          </p>
        </div>

        {/* 1-Click Demo Profiles Box */}
        <div 
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            <UserCheck size={14} />
            <span>ONE-CLICK DEMO LOGIN (TEST PERSONAS)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {DEMO_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                className="btn btn-secondary btn-sm flex items-center justify-between w-full"
                style={{ textAlign: 'left', padding: '0.45rem 0.75rem' }}
                onClick={() => handleQuickDemoUser(user)}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{user.avatar}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({user.organization.split(' ')[0]})</span>
                </div>
                <ArrowRight size={12} className="text-muted" />
              </button>
            ))}
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Work Email Address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon-left" />
              <input
                type="email"
                required
                className="form-input has-left-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <label className="form-label">Password</label>
              <a href="#forgot" style={{ fontSize: '0.75rem' }} onClick={(e) => { e.preventDefault(); addToast('Password reset link sent to demo email', 'info'); }}>
                Forgot password?
              </a>
            </div>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon-left" />
              <input
                type="password"
                required
                className="form-input has-left-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full btn-lg" 
            disabled={loading}
            style={{ justifyContent: 'center' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an enterprise account?{' '}
          <Link to="/signup" style={{ fontWeight: 600 }}>
            Create free workspace
          </Link>
        </div>
      </div>
    </div>
  );
};
