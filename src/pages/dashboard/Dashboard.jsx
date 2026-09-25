import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Play, 
  ExternalLink, 
  MessageSquare, 
  Users, 
  Clock, 
  ChevronRight,
  Share2,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { VolumeAreaChart } from '../../components/common/Charts';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, bots, conversations, analytics } = usePlatform();

  const primaryBot = bots.find((b) => b.id === 'prycoons-ai') || bots[0];
  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="page-container">
      {/* Top Header Row */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good morning, {currentUser?.name?.split(' ')[0] || 'Sai'}.
          </h1>
          <p className="page-description">
            Manage your customer assistant, review conversations, and track qualified inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => window.open(`/chat/${primaryBot?.id || 'prycoons-ai'}`, '_blank')}
            title="Preview customer assistant in live browser window"
          >
            <Play size={13} style={{ color: 'var(--primary)' }} />
            <span>Preview Assistant</span>
            <ExternalLink size={12} style={{ opacity: 0.6 }} />
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/bots/create')}
          >
            <Plus size={14} />
            <span>Create Assistant</span>
          </button>
        </div>
      </div>

      {/* Primary Active Assistant Spotlight Card */}
      {primaryBot && (
        <div 
          className="card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            marginBottom: '1.75rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div 
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--accent-soft-surface)',
                  border: '1px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  flexShrink: 0
                }}
              >
                {primaryBot.avatar || '🏢'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {primaryBot.name}
                  </h2>
                  <span className="badge badge-primary">{primaryBot.industryName}</span>
                  <span className="badge badge-success">
                    <span className="status-dot active" style={{ width: 6, height: 6 }} />
                    Active
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '640px', lineHeight: 1.55 }}>
                  {primaryBot.description}
                </p>

                <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{primaryBot.totalConversations} conversations</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{primaryBot.leadCount} leads</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    Last activity: {primaryBot.lastActive || '5 minutes ago'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assistant Actions */}
            <div className="flex items-center gap-2">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/bots/${primaryBot.id}/share`)}
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              <button 
                className="btn btn-outline btn-sm"
                onClick={() => window.open(`/chat/${primaryBot.id}`, '_blank')}
              >
                <Play size={13} style={{ color: 'var(--primary)' }} />
                <span>Preview</span>
              </button>

              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/bots/${primaryBot.id}/overview`)}
              >
                <span>Open Assistant</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean KPI Cards Strip */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Conversations</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="stat-value">{analytics.overview.totalConversations}</div>
          <div className="flex items-center justify-between">
            <span className="stat-trend up">
              <TrendingUp size={12} />
              {analytics.overview.conversationsChange}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>vs last week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Visitors</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="stat-value">{analytics.overview.totalVisitors || 218}</div>
          <div className="flex items-center justify-between">
            <span className="stat-trend up">
              <TrendingUp size={12} />
              {analytics.overview.visitorsChange || '+14.2%'}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>unique visitors</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Leads Captured</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="stat-value">{analytics.overview.totalLeadsCaptured}</div>
          <div className="flex items-center justify-between">
            <span className="stat-trend up">
              <TrendingUp size={12} />
              {analytics.overview.leadsChange}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>high-intent inquiries</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Satisfaction (CSAT)</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-soft-surface)', color: 'var(--primary)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>★</span>
            </div>
          </div>
          <div className="stat-value">{analytics.overview.avgCsatScore || '4.9 / 5.0'}</div>
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Avg response: {analytics.overview.avgResponseTime}</span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>96.4% resolved</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Activity Chart (8 cols) & Recent Inquiries (4 cols) */}
      <div className="grid-12" style={{ marginBottom: '1.75rem' }}>
        {/* Activity Trend Chart */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Conversation & Inquiry Activity</h3>
              <p className="card-subtitle">Daily customer sessions and qualified inquiries</p>
            </div>
            <span className="badge badge-neutral">This Week</span>
          </div>
          <VolumeAreaChart data={analytics.dailyVolume} />
        </div>

        {/* Recent Inquiries List */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Inquiries</h3>
              <p className="card-subtitle">Latest customer messages & requests</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/global-history')}>
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {recentConversations.map((conv) => (
              <div 
                key={conv.id}
                className="card card-interactive"
                style={{ padding: '0.85rem 1rem', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}
                onClick={() => navigate(`/bots/${conv.botId}/conversations`)}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {conv.userName}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>{conv.timestamp}</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }} className="truncate">
                  {conv.leadInterest}
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: '0.7rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{conv.leadStatus}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{conv.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
