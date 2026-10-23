import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  MessageSquare, 
  BarChart2, 
  BookOpen, 
  Share2, 
  Settings, 
  Play,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotNav = () => {
  const { botId } = useParams();
  const { bots } = usePlatform();
  const navigate = useNavigate();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];

  return (
    <div className="bot-nav-header">
      {/* Bot Header Row */}
      <div className="bot-info-row">
        <div className="flex items-center gap-3">
          <button 
            className="btn btn-ghost btn-sm btn-icon" 
            onClick={() => navigate('/bots')}
            title="Back to all assistants"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="bot-avatar-badge">{currentBot?.avatar || '🏢'}</div>

          <div className="bot-meta">
            <div className="bot-meta-title">
              {currentBot?.name || 'BRIM Assistant'}
              <span className={`status-dot ${currentBot?.status === 'active' ? 'active' : 'idle'}`} title={`Status: ${currentBot?.status}`} />
            </div>
            <div className="bot-meta-sub">
              <span className="badge badge-primary">{currentBot?.industryName || 'Real Estate'}</span>
              <span>•</span>
              <span>{currentBot?.sourcesCount || 0} Knowledge Sources</span>
              <span>•</span>
              <span>Active</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => window.open(`/chat/${currentBot?.id}`, '_blank')}
            title="Open customer assistant preview in new tab"
          >
            <Play size={13} style={{ color: 'var(--primary)' }} />
            <span>Preview Assistant</span>
            <ExternalLink size={12} style={{ opacity: 0.6 }} />
          </button>
          
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/bots/${currentBot?.id}/share`)}
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bot-tab-strip">
        <NavLink 
          to={`/bots/${currentBot?.id}/overview`} 
          className={({ isActive }) => `bot-tab-link ${isActive ? 'active' : ''}`}
        >
          <Activity size={15} />
          <span>Overview</span>
        </NavLink>

        <NavLink 
          to={`/bots/${currentBot?.id}/conversations`} 
          className={({ isActive }) => `bot-tab-link ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={15} />
          <span>Conversations</span>
        </NavLink>

        <NavLink 
          to={`/bots/${currentBot?.id}/knowledge`} 
          className={({ isActive }) => `bot-tab-link ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={15} />
          <span>Knowledge</span>
        </NavLink>

        <NavLink 
          to={`/bots/${currentBot?.id}/analytics`} 
          className={({ isActive }) => `bot-tab-link ${isActive ? 'active' : ''}`}
        >
          <BarChart2 size={15} />
          <span>Analytics</span>
        </NavLink>

        <NavLink 
          to={`/bots/${currentBot?.id}/share`} 
          className={({ isActive }) => `bot-tab-link ${isActive ? 'active' : ''}`}
        >
          <Share2 size={15} />
          <span>Share</span>
        </NavLink>

        <NavLink 
          to={`/bots/${currentBot?.id}/settings`} 
          className={({ isActive }) => `bot-tab-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={15} />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
};
