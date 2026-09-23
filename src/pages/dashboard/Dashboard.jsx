import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Sparkles, 
  ArrowUpRight, 
  MessageSquare, 
  Users, 
  Database, 
  Zap, 
  ExternalLink, 
  TrendingUp, 
  Bot, 
  ChevronRight,
  Clock,
  ShieldCheck,
  Building2,
  Share2
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { VolumeAreaChart, BhkBarChart, SentimentDonutChart } from '../../components/common/Charts';
import { PRYCOONS_PROJECTS } from '../../data/mockData';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, bots, conversations, analytics, addToast } = usePlatform();

  const prycoonsBot = bots.find((b) => b.id === 'prycoons-ai') || bots[0];
  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="page-container">
      {/* Top Header Row */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
            <span className="badge badge-primary">Enterprise Workspace</span>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>• {currentUser.organization}</span>
          </div>
          <h1 className="page-title">
            Industry AI Orchestration Hub
          </h1>
          <p className="page-description">
            Monitor real-time customer conversations, high-intent lead captures, and domain knowledge indexing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => window.open('/chat/prycoons-ai', '_blank')}
          >
            <Sparkles size={14} style={{ color: '#3b82f6' }} />
            <span>Prycoons Demo Chat</span>
            <ExternalLink size={12} />
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/bots/create')}
          >
            <Plus size={14} />
            <span>Create AI Assistant</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.825rem', fontWeight: 500 }}>Total Inquiries</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="stat-value">{analytics.overview.totalConversations.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            <span className="stat-trend up">
              <TrendingUp size={12} />
              {analytics.overview.conversationsChange}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>vs last 30 days</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.825rem', fontWeight: 500 }}>Qualified Leads</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{analytics.overview.totalLeadsCaptured.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            <span className="stat-trend up">
              <TrendingUp size={12} />
              {analytics.overview.leadsChange}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>31.2% conversion rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.825rem', fontWeight: 500 }}>Knowledge Vector Chunks</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)' }}>
              <Database size={18} />
            </div>
          </div>
          <div className="stat-value">1,480</div>
          <div className="flex items-center justify-between">
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>100% Synced</span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Across 18 sources</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-muted" style={{ fontSize: '0.825rem', fontWeight: 500 }}>Avg Response Time</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--accent-amber-subtle)', color: 'var(--accent-amber)' }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-value">{analytics.overview.avgResponseTime}</div>
          <div className="flex items-center justify-between">
            <span className="stat-trend up">
              <TrendingUp size={12} />
              {analytics.overview.responseTimeChange}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>99.9% uptime SLA</span>
          </div>
        </div>
      </div>

      {/* Flagship Showcase Spotlight: Prycoons Real Estate AI */}
      <div 
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.05) 50%, var(--bg-surface) 100%)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-subtle)',
                border: '1px solid var(--primary-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem'
              }}
            >
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Prycoons AI Real Estate Assistant</h3>
                <span className="badge badge-success">Live & Ingested</span>
                <span className="badge badge-primary">Flagship Showcase</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '680px' }}>
                Demonstrating deep real-estate conversational intelligence for <strong>Ahmedabad, SG Highway & GIFT City</strong> projects. Fully trained on 4 flagship properties (The Sovereign Sky Villas, GIFT Horizon, Emerald Heights, Capital Square), RERA numbers, brochure downloads, and VIP site visit scheduling.
              </p>
              <div className="flex items-center gap-4" style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>🎯 <strong>1,842</strong> Customer Sessions</span>
                <span>•</span>
                <span>💎 <strong>528</strong> Qualified Leads Captured</span>
                <span>•</span>
                <span>⭐ <strong>4.92 / 5.0</strong> CSAT</span>
              </div>
            </div>
          </div>

          {/* Quick Actions on Showcase */}
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => window.open('/chat/prycoons-ai', '_blank')}
            >
              <Sparkles size={14} />
              <span>Launch Live Chat</span>
              <ExternalLink size={12} />
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/bots/prycoons-ai/overview')}
            >
              <span>Manage Bot</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid-12" style={{ marginBottom: '1.75rem' }}>
        {/* Daily Inquiries & Leads Area Chart */}
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Inquiry Traffic & Lead Ingestion Velocity</h3>
              <p className="card-subtitle">Daily simulated customer sessions vs qualified high-intent leads</p>
            </div>
            <span className="badge badge-neutral">Last 7 Days</span>
          </div>
          <VolumeAreaChart data={analytics.dailyVolume} />
        </div>

        {/* Real Estate / BHK Distribution */}
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Property Inquiries by Type</h3>
              <p className="card-subtitle">Visitor configuration preference</p>
            </div>
          </div>
          <BhkBarChart distribution={analytics.bhkDistribution} />
        </div>
      </div>

      {/* Active Bots Grid & Recent Chats Feed */}
      <div className="grid-12" style={{ marginBottom: '1.75rem' }}>
        {/* Active Industry AI Assistants */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Bot size={18} style={{ color: 'var(--primary)' }} />
                Active Industry AI Assistants
              </h3>
              <p className="card-subtitle">Multi-industry chatbot deployments in your organization</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bots')}>
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {bots.map((bot) => (
              <div 
                key={bot.id} 
                className="card card-interactive flex items-center justify-between"
                style={{ padding: '0.85rem 1rem' }}
                onClick={() => navigate(`/bots/${bot.id}/overview`)}
              >
                <div className="flex items-center gap-3">
                  <div style={{ fontSize: '1.5rem' }}>{bot.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{bot.name}</span>
                      <span className={`status-dot ${bot.status === 'active' ? 'active' : 'idle'}`} />
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>{bot.industryName}</span>
                      <span>•</span>
                      <span>{bot.totalConversations || 0} chats</span>
                      <span>•</span>
                      <span>{bot.leadCount || 0} leads</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    className="btn btn-ghost btn-sm btn-icon" 
                    title="Live Customer Chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/chat/${bot.id}`, '_blank');
                    }}
                  >
                    <ExternalLink size={14} />
                  </button>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Conversation Stream */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <MessageSquare size={18} style={{ color: 'var(--accent-emerald)' }} />
                Recent Qualified Leads & Chats
              </h3>
              <p className="card-subtitle">Real-time visitor inquiry transcripts</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/global-history')}>
              <span>All Chats</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {recentConversations.map((conv) => (
              <div 
                key={conv.id}
                className="card card-interactive"
                style={{ padding: '0.85rem 1rem' }}
                onClick={() => navigate(`/bots/${conv.botId}/conversations`)}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{conv.userName}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{conv.leadStatus}</span>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>{conv.timestamp}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <strong>Interest:</strong> {conv.leadInterest} ({conv.budget})
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Bot: {conv.botName}</span>
                  <span className="text-success font-mono">{conv.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
