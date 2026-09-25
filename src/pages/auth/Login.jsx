import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Sparkles, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const Login = () => {
  const navigate = useNavigate();
  const { loginUser, addToast } = usePlatform();
  const [email, setEmail] = useState('saisrikar@example.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Please enter your email address', 'error');
      return;
    }
    if (!password.trim()) {
      addToast('Please enter your password', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const res = loginUser(email, password);
      if (res && res.success) {
        navigate('/');
      }
    }, 400);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const res = loginUser('saisrikar@example.com', 'saisrikarbrim@123');
      if (res && res.success) {
        navigate('/');
      }
    }, 300);
  };

  return (
    <div className="auth-split-layout">
      {/* Left ~50%: Polished Brand / Banner Section */}
      <div className="auth-brand-side">
        <div className="auth-brand-glow" />
        <div className="auth-brand-glow-bottom" />
        <div className="auth-brand-grid-pattern" />

        {/* Top Brand Mark */}
        <div className="auth-brand-top">
          <div 
            className="brand-logo" 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-md)',
              fontSize: '1.25rem',
              backgroundColor: 'var(--primary)'
            }}
          >
            B
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFDF9' }}>
              BRIM AI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#B8AFA3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Enterprise Platform
            </div>
          </div>
        </div>

        {/* Middle Value Proposition & Visual Treatment */}
        <div className="auth-brand-content">
          <div className="auth-pill-badge">
            <Sparkles size={13} />
            <span>Conversational Assistant Suite</span>
          </div>

          <div>
            <h1 className="auth-brand-title">
              Creative intelligence grounded in domain precision.
            </h1>
            <p className="auth-brand-desc" style={{ marginTop: '1rem' }}>
              Deploy industry-centric conversational assistants tailored to your projects, documentation, brochures, and client consultation workflows.
            </p>
          </div>

          {/* Abstract / Creative Visual Treatment */}
          <div className="auth-visual-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
                  }} 
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFDF9', letterSpacing: '0.01em' }}>
                  Real Estate Assistant • Sovereign Villas
                </span>
              </div>
              <span 
                style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  color: 'var(--gold)', 
                  background: 'rgba(201, 154, 82, 0.15)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(201, 154, 82, 0.3)'
                }}
              >
                99.2% Accuracy
              </span>
            </div>

            <div 
              style={{ 
                background: 'rgba(255, 253, 249, 0.04)', 
                padding: '0.85rem 1rem', 
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                color: '#E6DFD5',
                lineHeight: 1.55,
                border: '1px solid rgba(255, 253, 249, 0.06)'
              }}
            >
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Assistant:</span> "The Sovereign Sky Villas feature 4 & 5 BHK sky mansions in Bodakdev starting at ₹4.85 Cr with verified RERA documentation."
            </div>

            <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', color: '#8E867B', paddingTop: '0.25rem' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} color="#10B981" /> Verified Knowledge Base
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} color="var(--gold)" /> Domain Isolation
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-brand-footer">
          <span>© 2026 BRIM Technologies Inc.</span>
          <span>Client Workspace System</span>
        </div>
      </div>

      {/* Right ~50%: Clean & Familiar Login Form */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div style={{ marginBottom: '1.85rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
              Sign in to BRIM
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Access your conversational workspace and assistants
            </p>
          </div>

          {/* Clean Demo Account Info with 1-Click Demo Login (Email Only, NO password shown) */}
          <div 
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Demo Account
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                saisrikar@example.com
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.45rem 0.85rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onClick={handleDemoLogin}
              disabled={loading}
            >
              <Sparkles size={13} style={{ color: 'var(--primary)' }} />
              <span>Demo Login</span>
            </button>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon-left" />
                <input
                  type="email"
                  required
                  className="form-input has-left-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="saisrikar@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input has-left-icon"
                  style={{ paddingRight: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full btn-lg" 
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              {loading ? 'Signing in...' : 'Sign In to Workspace'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Navigation to Signup Page */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
