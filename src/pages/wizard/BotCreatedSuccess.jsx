import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Code, 
  QrCode, 
  ArrowRight, 
  Sparkles,
  Bot,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePlatform } from '../../context/PlatformContext';

export const BotCreatedSuccess = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { bots, addToast } = usePlatform();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const publicUrl = `${window.location.origin}/chat/${currentBot?.id || 'prycoons-ai'}`;
  const embedCode = `<script src="https://cdn.nexusai.com/widget.js" data-bot-id="${currentBot?.id || 'prycoons-ai'}" data-color="${currentBot?.primaryColor || '#3b82f6'}" async></script>`;

  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    addToast('Public chat URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    addToast('Embed widget script snippet copied!', 'success');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '820px' }}>
      <div 
        className="card"
        style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl)',
          background: 'radial-gradient(ellipse at 50% 10%, rgba(16, 185, 129, 0.15), var(--bg-surface) 70%)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Animated Celebration Icon */}
        <div 
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
          }}
        >
          <CheckCircle2 size={38} />
        </div>

        <span className="badge badge-success" style={{ marginBottom: '0.6rem' }}>
          Deployment Complete
        </span>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {currentBot?.name || 'Industry Assistant'} is Live!
        </h1>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 2rem' }}>
          Your AI assistant is fully vectorized, indexed, and ready to engage real-estate buyers, qualify leads, and answer domain queries.
        </p>

        {/* Shareable Link Box */}
        <div 
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              PUBLIC CHATBOT SHAREABLE URL
            </span>
            <span className="badge badge-primary">Direct Access</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              className="form-input font-mono"
              value={publicUrl}
              style={{ fontSize: '0.825rem' }}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
              {copiedLink ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => window.open(`/chat/${currentBot?.id}`, '_blank')}
            >
              <ExternalLink size={14} />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Quick Embed Snippet Box */}
        <div 
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              WEBSITE EMBED WIDGET CODE
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleCopyEmbed}>
              {copiedEmbed ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
              <span>{copiedEmbed ? 'Copied' : 'Copy Snippet'}</span>
            </button>
          </div>

          <div 
            style={{
              background: 'var(--bg-input)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#93c5fd',
              overflowX: 'auto',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {embedCode}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button 
            className="btn btn-secondary btn-lg"
            onClick={() => navigate(`/bots/${currentBot?.id}/overview`)}
          >
            <Activity size={18} />
            <span>Manage Bot Suite</span>
          </button>

          <button 
            className="btn btn-primary btn-lg"
            onClick={() => window.open(`/chat/${currentBot?.id}`, '_blank')}
            style={{ background: 'var(--grad-primary)', border: 'none' }}
          >
            <Sparkles size={18} />
            <span>Open Live Customer Chat</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
