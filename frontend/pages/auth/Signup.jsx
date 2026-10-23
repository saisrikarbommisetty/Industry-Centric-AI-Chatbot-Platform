import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Building, User, Sparkles, ShieldCheck, CheckCircle2, Eye, EyeOff, Layers } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const Signup = () => {
  const navigate = useNavigate();
  const { registerUser, addToast } = usePlatform();
  const [formData, setFormData] = useState({
    name: 'Sai Srikar',
    email: 'saisrikar@example.com',
    organization: 'BRIM Workspace',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Please enter your full name', 'error');
      return;
    }
    if (!formData.email.trim()) {
      addToast('Please provide an email address', 'error');
      return;
    }
    if (!formData.password.trim()) {
      addToast('Please choose a password', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      registerUser(formData);
      navigate('/');
    }, 400);
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
            <span>Fast-Track Deployment</span>
          </div>

          <div>
            <h1 className="auth-brand-title">
              Turn your business domain into an intelligent assistant.
            </h1>
            <p className="auth-brand-desc" style={{ marginTop: '1rem' }}>
              Connect real estate listings, healthcare procedures, education curricula, or hospitality catalogs in a few guided steps.
            </p>
          </div>

          {/* Abstract / Creative Visual Treatment */}
          <div className="auth-visual-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} color="var(--gold)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFDF9', letterSpacing: '0.01em' }}>
                  Workspace Ready Features
                </span>
              </div>
              <span 
                style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  color: 'var(--primary)', 
                  background: 'rgba(200, 92, 74, 0.15)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(200, 92, 74, 0.3)'
                }}
              >
                Zero-Code Setup
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div 
                style={{ 
                  background: 'rgba(255, 253, 249, 0.04)', 
                  padding: '0.65rem 0.8rem', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 253, 249, 0.06)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#B8AFA3' }}>Setup Time</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFDF9' }}>&lt; 3 Minutes</div>
              </div>
              <div 
                style={{ 
                  background: 'rgba(255, 253, 249, 0.04)', 
                  padding: '0.65rem 0.8rem', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 253, 249, 0.06)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#B8AFA3' }}>Knowledge Ingestion</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFDF9' }}>PDFs, URLs & Data</div>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', color: '#8E867B', paddingTop: '0.25rem' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} color="#10B981" /> 14-Day Free Evaluation
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} color="var(--gold)" /> Enterprise Privacy
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

      {/* Right ~50%: Clean & Familiar Signup Form */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
              Create BRIM Workspace
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Set up your conversational assistant platform
            </p>
          </div>

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon-left" />
                <input
                  type="text"
                  required
                  className="form-input has-left-icon"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sai Srikar"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon-left" />
                <input
                  type="email"
                  required
                  className="form-input has-left-icon"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="saisrikar@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Organization / Business Name</label>
              <div className="input-wrapper">
                <Building size={16} className="input-icon-left" />
                <input
                  type="text"
                  required
                  className="form-input has-left-icon"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="BRIM Workspace"
                  autoComplete="organization"
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create password"
                  autoComplete="new-password"
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
              {loading ? 'Creating...' : 'Create Workspace'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Navigation back to Login Page */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
