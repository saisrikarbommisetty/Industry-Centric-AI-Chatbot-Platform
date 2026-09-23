import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Clock, 
  Sparkles, 
  HelpCircle,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  VolumeAreaChart, 
  BhkBarChart, 
  SentimentDonutChart, 
  HourlyHeatmap 
} from '../../components/common/Charts';

export const BotAnalytics = () => {
  const { botId } = useParams();
  const { bots, analytics, addToast } = usePlatform();
  const [timeframe, setTimeframe] = useState('30d');

  const currentBot = bots.find((b) => b.id === botId) || bots[0];

  const handleExportReport = () => {
    addToast(`Exported Analytics Report (${timeframe.toUpperCase()}) for ${currentBot.name}`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Analytics Header & Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Autonomous AI Performance & Lead Analytics</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Real-time insights on visitor engagement, property interest distribution, and RAG resolution efficiency.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Timeframe selector */}
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

            <button className="btn btn-secondary btn-sm" onClick={handleExportReport}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total Conversations</span>
              <MessageSquare size={16} className="text-primary" />
            </div>
            <div className="stat-value">{currentBot?.totalConversations || 1842}</div>
            <span className="stat-trend up">
              <TrendingUp size={12} />
              +24.6% vs previous
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>High-Intent Leads</span>
              <Users size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div className="stat-value">{currentBot?.leadCount || 528}</div>
            <span className="stat-trend up">
              <TrendingUp size={12} />
              +31.2% conversion rate
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Resolution Accuracy</span>
              <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
            </div>
            <div className="stat-value">94.8%</div>
            <span className="stat-trend up">
              <TrendingUp size={12} />
              Zero Hallucination Guardrails
            </span>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Average Duration</span>
              <Clock size={16} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div className="stat-value">4m 18s</div>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>5.4 msgs per session</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid-12" style={{ marginBottom: '1.75rem' }}>
          {/* Daily Inquiries & Leads Area Chart */}
          <div className="card" style={{ gridColumn: 'span 8' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Customer Inquiries & Qualified Lead Acquisition</h3>
                <p className="card-subtitle">Volume trajectory over time</p>
              </div>
              <span className="badge badge-primary">Trend: +24%</span>
            </div>
            <VolumeAreaChart data={analytics.dailyVolume} />
          </div>

          {/* Sentiment Ring */}
          <div className="card" style={{ gridColumn: 'span 4' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Sentiment & CSAT</h3>
                <p className="card-subtitle">Visitor satisfaction rating</p>
              </div>
              <span className="badge badge-success">4.92 / 5.0</span>
            </div>
            <SentimentDonutChart items={analytics.sentimentBreakdown} />
          </div>
        </div>

        {/* Property Breakdown & Peak Hours Heatmap */}
        <div className="grid-12" style={{ marginBottom: '1.75rem' }}>
          {/* Property Configuration Distribution */}
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Property Inquiries by Unit Type (Prycoons)</h3>
                <p className="card-subtitle">Buyer preference breakdown across Ahmedabad & GIFT City</p>
              </div>
            </div>
            <BhkBarChart distribution={analytics.bhkDistribution} />
          </div>

          {/* Hourly Traffic Load Matrix */}
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Peak Inbound Chat Traffic Hours</h3>
                <p className="card-subtitle">Optimal staffing & follow-up windows (IST)</p>
              </div>
              <span className="badge badge-neutral">11am - 2pm & 7pm - 10pm</span>
            </div>
            <HourlyHeatmap heatmap={analytics.hourlyHeatmap} />
          </div>
        </div>

        {/* Top Inquired Questions Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Inquired Real-Estate & Domain Questions</h3>
              <p className="card-subtitle">Identified knowledge query clusters from visitor prompts</p>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question Cluster</th>
                  <th>Total Inquiries</th>
                  <th>Trend Velocity</th>
                  <th>RAG Grounding Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topQuestions.map((q, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{q.question}</td>
                    <td>{q.count} times</td>
                    <td><span className="stat-trend up">{q.growth}</span></td>
                    <td><span className="badge badge-success">99.2% Grounded</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
