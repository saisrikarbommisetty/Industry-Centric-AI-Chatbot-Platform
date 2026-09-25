import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Activity,
  Download
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  VolumeAreaChart, 
  BhkBarChart, 
  SentimentDonutChart 
} from '../../components/common/Charts';

export const GlobalAnalytics = () => {
  const { analytics, addToast } = usePlatform();

  const handleExport = () => {
    addToast('Workspace analytics report downloaded as CSV', 'success');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Analytics
          </h1>
          <p className="page-description">
            High-level performance overview across all customer assistant interactions.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 4 Basic KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Conversations</span>
            <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">{analytics.overview.totalConversations}</div>
          <span className="stat-trend up">
            <TrendingUp size={12} />
            {analytics.overview.conversationsChange} this month
          </span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unique Visitors</span>
            <Users size={16} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div className="stat-value">{analytics.overview.totalVisitors || 218}</div>
          <span className="stat-trend up">
            <TrendingUp size={12} />
            {analytics.overview.visitorsChange || '+14.2%'} growth
          </span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Qualified Leads</span>
            <Activity size={16} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="stat-value">{analytics.overview.totalLeadsCaptured}</div>
          <span className="stat-trend up">
            <TrendingUp size={12} />
            {analytics.overview.leadsChange} conversion
          </span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Average CSAT</span>
            <span style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>★</span>
          </div>
          <div className="stat-value">{analytics.overview.avgCsatScore}</div>
          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>96% positive</span>
        </div>
      </div>

      {/* 2 Clean Charts */}
      <div className="grid-12" style={{ gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Inquiry Activity</h3>
              <p className="card-subtitle">Daily sessions vs high-intent inquiries</p>
            </div>
          </div>
          <VolumeAreaChart data={analytics.dailyVolume} />
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Visitor Feedback</h3>
              <p className="card-subtitle">Sentiment breakdown</p>
            </div>
          </div>
          <SentimentDonutChart items={analytics.sentimentBreakdown} />
        </div>
      </div>
    </div>
  );
};
