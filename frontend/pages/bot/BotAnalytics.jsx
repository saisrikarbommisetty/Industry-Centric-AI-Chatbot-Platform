import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Download,
  Activity
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  VolumeAreaChart, 
  BhkBarChart, 
  SentimentDonutChart 
} from '../../components/common/Charts';

export const BotAnalytics = () => {
  const { botId } = useParams();
  const { bots, analytics, addToast } = usePlatform();
  const [timeframe, setTimeframe] = useState('30d');

  const currentBot = bots.find((b) => b.id === botId) || bots[0];

  const handleExportReport = () => {
    addToast(`Exported Analytics Summary for ${currentBot.name}`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Assistant Analytics
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Summary of visitor sessions, lead conversions, and satisfaction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div 
              style={{
                display: 'inline-flex',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '0.2rem',
                border: '1px solid var(--border-default)'
              }}
            >
              {['7d', '30d', 'all'].map((t) => (
                <button
                  key={t}
                  className={`btn btn-sm ${timeframe === t ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setTimeframe(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleExportReport}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Basic KPI Cards */}
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Conversations</span>
              <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="stat-value">{currentBot?.totalConversations || 342}</div>
            <span className="stat-trend up">
              <TrendingUp size={12} />
              +18.4% this month
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
              +14.2% engagement
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Qualified Leads</span>
              <Activity size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div className="stat-value">{currentBot?.leadCount || 28}</div>
            <span className="stat-trend up">
              <TrendingUp size={12} />
              +22.0% conversion
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Customer Rating</span>
              <span style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>★</span>
            </div>
            <div className="stat-value">{currentBot?.csat || '4.9'} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 5.0</span></div>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>96% positive rating</span>
          </div>
        </div>

        {/* 2 Clean Focused Charts */}
        <div className="grid-12" style={{ gap: '1.25rem' }}>
          {/* Daily Activity Chart */}
          <div className="card" style={{ gridColumn: 'span 8' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Inquiry & Conversation Trends</h3>
                <p className="card-subtitle">Daily visitor sessions vs captured inquiries</p>
              </div>
            </div>
            <VolumeAreaChart data={analytics.dailyVolume} />
          </div>

          {/* Configuration Interest Breakdown */}
          <div className="card" style={{ gridColumn: 'span 4' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Inquiry Breakdown</h3>
                <p className="card-subtitle">Customer configuration preference</p>
              </div>
            </div>
            <BhkBarChart distribution={analytics.bhkDistribution} />
          </div>
        </div>
      </div>
    </div>
  );
};
