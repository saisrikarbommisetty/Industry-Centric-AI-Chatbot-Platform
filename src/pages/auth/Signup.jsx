import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Building, User, Mail, Lock } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { INDUSTRIES } from '../../data/mockData';

export const Signup = () => {
  const navigate = useNavigate();
  const { registerUser, addToast } = usePlatform();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    industry: 'real-estate',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast('Please fill in your name and email', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      registerUser(formData);
      navigate('/bots/create');
    }, 600);
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(139, 92, 246, 0.15), var(--bg-app) 70%)'
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2.25rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div 
            className="brand-logo" 
            style={{ width: '48px', height: '48px', margin: '0 auto 1rem', borderRadius: 'var(--radius-lg)' }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>Create Industry AI Workspace</h2>
          <p style={{ fontSize: '0.85rem' }}>
            Build domain-aware AI assistants with automated knowledge ingestion.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon-left" />
                <input
                  type="text"
                  required
                  className="form-input has-left-icon"
                  placeholder="e.g. Sanyam Shah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  placeholder="sanyam@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Company / Organization Name</label>
            <div className="input-wrapper">
              <Building size={16} className="input-icon-left" />
              <input
                type="text"
                required
                className="form-input has-left-icon"
                placeholder="e.g. Prycoons Realty / Apex Tech"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Industry Focus</label>
            <select
              className="form-select"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon-left" />
              <input
                type="password"
                required
                className="form-input has-left-icon"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full btn-lg" 
            disabled={loading}
            style={{ justifyContent: 'center' }}
          >
            {loading ? 'Setting up workspace...' : 'Get Started with Free Tier'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
