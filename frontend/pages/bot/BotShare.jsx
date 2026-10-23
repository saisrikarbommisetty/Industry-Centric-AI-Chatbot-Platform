import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  QrCode, 
  Download,
  Play
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotShare = () => {
  const { botId } = useParams();
  const { bots, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const publicUrl = `${window.location.origin}/chat/${currentBot.id}`;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const embedScript = `<script src="https://cdn.brimai.com/widget.js" data-assistant-id="${currentBot.id}" async></script>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    addToast('Assistant link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedEmbed(true);
    addToast('Embed snippet copied!', 'success');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadQr = () => {
    addToast('QR Code asset downloaded for marketing materials', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0, maxWidth: '920px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Share {currentBot.name}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Your assistant is live and ready to share with customers or embed on your website.
          </p>
        </div>

        {/* PRIMARY SHARE CARD */}
        <div 
          className="card" 
          style={{ 
            marginBottom: '2rem', 
            padding: '2rem', 
            borderRadius: 'var(--radius-xl)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
            <div className="flex items-center gap-2">
              <Share2 size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Direct Shareable Link</h2>
            </div>
            <span className="badge badge-success">
              <span className="status-dot active" style={{ width: 6, height: 6 }} />
              Active
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Direct link to provide in marketing campaigns, emails, social media, or customer brochures.
          </p>

          <div className="flex gap-2 flex-wrap" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              readOnly
              className="form-input font-mono"
              value={publicUrl}
              style={{ flex: 1, minWidth: '240px', fontSize: '0.85rem', backgroundColor: 'var(--bg-app)' }}
            />
            <button className="btn btn-primary btn-md" onClick={handleCopyLink}>
              {copiedLink ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button 
              className="btn btn-secondary btn-md"
              onClick={() => window.open(`/chat/${currentBot.id}`, '_blank')}
            >
              <Play size={14} style={{ color: 'var(--primary)' }} />
              <span>Open Assistant</span>
              <ExternalLink size={12} style={{ opacity: 0.6 }} />
            </button>
          </div>
        </div>

        {/* SECONDARY OPTIONS: EMBED & QR CODE */}
        <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Website Embed Code Card */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
              <div className="flex items-center gap-2">
                <Code size={16} style={{ color: 'var(--primary)' }} />
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Website Embed Code</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleCopyEmbed}>
                {copiedEmbed ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                <span>{copiedEmbed ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Paste this HTML snippet before the closing <code>&lt;/body&gt;</code> tag on your website.
            </p>

            <div 
              style={{
                background: 'var(--bg-app)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                overflowX: 'auto'
              }}
            >
              {embedScript}
            </div>
          </div>

          {/* QR Code Card */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
              <div className="flex items-center gap-2">
                <QrCode size={16} style={{ color: 'var(--primary)' }} />
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Printable QR Code</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleDownloadQr}>
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Scan QR code on property hoardings, site offices, or print collateral.
            </p>

            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--bg-app)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)'
              }}
            >
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <QrCode size={42} style={{ color: 'var(--text-primary)' }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Directly opens <strong>{currentBot.name}</strong> on any mobile phone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
