import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Activity,
  Play
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
  const embedCode = `<script src="https://cdn.brimai.com/widget.js" data-assistant-id="${currentBot?.id || 'prycoons-ai'}" async></script>`;

  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    addToast('Public assistant link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    addToast('Embed widget script snippet copied!', 'success');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '780px' }}>
      <div 
        className="card"
        style={{
          textAlign: 'center',
          padding: '3rem 2.25rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Success Icon */}
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-emerald-subtle)',
            border: '2px solid var(--accent-emerald)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <CheckCircle2 size={34} />
        </div>

        <span className="badge badge-success" style={{ marginBottom: '0.6rem' }}>
          Assistant Ready
        </span>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          {currentBot?.name || 'BRIM Assistant'} is Ready!
        </h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.55 }}>
          Your assistant knowledge base is synchronized. You can preview the customer chat or share the direct link.
        </p>

        {/* Shareable Link Box */}
        <div 
          style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Direct Shareable Link
            </span>
            <span className="badge badge-primary">Active</span>
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
              {copiedLink ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => window.open(`/chat/${currentBot?.id}`, '_blank')}
            >
              <ExternalLink size={14} />
              <span>Open</span>
            </button>
          </div>
        </div>

        {/* Quick Embed Box */}
        <div 
          style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Website Embed Code
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleCopyEmbed}>
              {copiedEmbed ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
              <span>{copiedEmbed ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div 
            style={{
              background: '#FFFFFF',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-primary)',
              overflowX: 'auto',
              border: '1px solid var(--border-default)'
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
            <Activity size={17} />
            <span>Manage Assistant</span>
          </button>

          <button 
            className="btn btn-primary btn-lg"
            onClick={() => window.open(`/chat/${currentBot?.id}`, '_blank')}
          >
            <Play size={16} />
            <span>Preview Customer Assistant</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
