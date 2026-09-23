import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Layers, 
  Download,
  Building2,
  GraduationCap,
  HeartPulse,
  Hotel
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { VolumeAreaChart, BhkBarChart, SentimentDonutChart, HourlyHeatmap } from '../../components/common/Charts';

export const GlobalAnalytics = () => {
  const { analytics, bots, addToast } = usePlatform();
  const [timeframe, setTimeframe] = useState('30d');

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
            Platform-Wide Intelligence & Growth Analytics
          </h1>
          <p className="page-description">
            Aggregated metrics spanning all deployed industry chatbots, lead ingestion pipelines, and multi-tenant conversion rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="tab-pill-list">
            {['7d', '30d', '90d', 'all'].map((t) => (
              <button
                key={t}
                className={`tab-pill ${timeframe === t ? 'active' : ''}`}
                onClick={() => setTimeframe(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => addToast('Global intelligence report exported', 'success')}>
            <Download size={14} />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Organization Inquiries</span>
            <MessageSquare size={16} className="text-primary" />
          </div>
          <div className="stat-value">{analytics.overview.totalConversations.toLocaleString()}</div>
          <span className="stat-trend up"><TrendingUp size={12} /> {analytics.overview.conversationsChange}</span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total Qualified Leads</span>
            <Users size={16} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="stat-value">{analytics.overview.totalLeadsCaptured.toLocaleString()}</div>
          <span className="stat-trend up"><TrendingUp size={12} /> {analytics.overview.leadsChange}</span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Knowledge Base Vectors</span>
            <Layers size={16} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="stat-value">1,480</div>
          <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>Across {bots.length} Active Bots</span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Avg Customer CSAT</span>
            <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="stat-value">{analytics.overview.avgCsatScore}</div>
          <span className="text-success" style={{ fontSize: '0.72rem', fontWeight: 600 }}>97% Positive Feedback</span>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid-12" style={{ marginBottom: '1.75rem' }}>
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Aggregated Customer Sessions & Lead Capture Velocity</h3>
              <p className="card-subtitle">Daily interaction trends across all industry verticals</p>
            </div>
            <span className="badge badge-primary">Trend: Upward</span>
          </div>
          <VolumeAreaChart data={analytics.dailyVolume} />
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Sentiment & CSAT Index</h3>
              <p className="card-subtitle">Visitor satisfaction distribution</p>
            </div>
          </div>
          <SentimentDonutChart items={analytics.sentimentBreakdown} />
        </div>
      </div>

      {/* Multi-Industry Breakdown Cards */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        <div className="card">
          <div className="flex items-center gap-3" style={{ marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏢</span>
            <div>
              <h4 style={{ fontWeight: 700 }}>Real Estate Vertical (Prycoons)</h4>
              <span className="badge badge-primary">1,842 Sessions • 528 Leads</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            High-intent property discovery for 3BHK, Sky Villas, GIFT City investments, and weekend site visits.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3" style={{ marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <div>
              <h4 style={{ fontWeight: 700 }}>Education & EdTech (EduNova)</h4>
              <span className="badge badge-purple">924 Sessions • 310 Leads</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Admissions counselor queries, curriculum requirements, merit scholarships, and campus visit bookings.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3" style={{ marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🩺</span>
            <div>
              <h4 style={{ fontWeight: 700 }}>Healthcare & Clinics (CarePoint)</h4>
              <span className="badge badge-danger">640 Sessions • 198 Leads</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Patient department routing, specialist doctor timings, and outpatient appointment bookings.
          </p>
        </div>
      </div>
    </div>
  );
};
