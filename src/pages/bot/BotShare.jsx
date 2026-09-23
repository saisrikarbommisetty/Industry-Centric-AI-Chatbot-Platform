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
  Sliders, 
  Smartphone, 
  MessageCircle, 
  Send, 
  Sparkles,
  Download,
  Eye
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotShare = () => {
  const { botId } = useParams();
  const { bots, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const publicUrl = `${window.location.origin}/chat/${currentBot.id}`;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Widget Customizer State
  const [widgetColor, setWidgetColor] = useState(currentBot.primaryColor || '#3b82f6');
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [bubbleIcon, setBubbleIcon] = useState('chat');
  const [popupGreeting, setPopupGreeting] = useState(true);
  const [widgetOpen, setWidgetOpen] = useState(false);

  const embedScript = `<script 
  src="https://cdn.nexusai.com/widget.js" 
  data-bot-id="${currentBot.id}"
  data-color="${widgetColor}"
  data-position="${widgetPosition}"
  data-greeting="${popupGreeting ? 'true' : 'false'}"
  async>
</script>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    addToast('Public chatbot link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedEmbed(true);
    addToast('Embed snippet copied!', 'success');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadQr = () => {
    addToast('QR Code asset downloaded (High-Res SVG for print & hoardings)', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Top Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Share, Embed & Multi-Channel Deployment</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Distribute your AI assistant via direct public link, website embed widget, print QR codes, or messaging channels.
          </p>
        </div>

        {/* Public Link Card */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
            <div className="flex items-center gap-2">
              <Share2 size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ fontSize: '1rem' }}>Standalone Public Chatbot URL</h3>
            </div>
            <span className="badge badge-success">Active & Publicly Accessible</span>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Direct web destination for marketing campaigns, digital ads, email signatures, and property portals.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              className="form-input font-mono"
              value={publicUrl}
              style={{ fontSize: '0.85rem' }}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
              {copiedLink ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => window.open(`/chat/${currentBot.id}`, '_blank')}
            >
              <ExternalLink size={14} />
              <span>Open Chat</span>
            </button>
          </div>
        </div>

        {/* 2-Column: Left Embed Customizer / Right Live Website Widget Sandbox */}
        <div className="grid-12" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Customizer Controls (5 cols) */}
          <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <Sliders size={18} style={{ color: 'var(--primary)' }} />
                    Widget Customizer
                  </h3>
                  <p className="card-subtitle">Tune the floating website trigger</p>
                </div>
              </div>

              {/* Color Picker */}
              <div className="form-group">
                <label className="form-label">Widget Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Position Selector */}
              <div className="form-group">
                <label className="form-label">Position on Webpage</label>
                <div className="grid-2" style={{ gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${widgetPosition === 'bottom-right' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setWidgetPosition('bottom-right')}
                  >
                    Bottom Right
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${widgetPosition === 'bottom-left' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setWidgetPosition('bottom-left')}
                  >
                    Bottom Left
                  </button>
                </div>
              </div>

              {/* Launcher Icon Style */}
              <div className="form-group">
                <label className="form-label">Launcher Icon Style</label>
                <div className="grid-3" style={{ gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${bubbleIcon === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setBubbleIcon('chat')}
                  >
                    <MessageCircle size={14} />
                    <span>Chat</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${bubbleIcon === 'sparkle' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setBubbleIcon('sparkle')}
                  >
                    <Sparkles size={14} />
                    <span>AI</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${bubbleIcon === 'avatar' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setBubbleIcon('avatar')}
                  >
                    <span>{currentBot.avatar}</span>
                    <span>Avatar</span>
                  </button>
                </div>
              </div>

              {/* Auto Popup Greeting */}
              <div className="flex items-center justify-between" style={{ marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Auto-Greet Proactive Bubble
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Show popup teaser after 3 seconds
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={popupGreeting}
                    onChange={(e) => setPopupGreeting(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Embed Code Card */}
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <div className="flex items-center gap-1.5">
                  <Code size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Embed Snippet</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleCopyEmbed}>
                  {copiedEmbed ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                  <span>{copiedEmbed ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div 
                style={{
                  background: 'var(--bg-input)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  color: '#93c5fd',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {embedScript}
              </div>
            </div>
          </div>

          {/* Right Column: Live Webpage Simulation Sandbox (7 cols) */}
          <div style={{ gridColumn: 'span 7' }}>
            <div 
              className="card"
              style={{
                height: '520px',
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: '#090d16',
                border: '1px solid var(--border-default)'
              }}
            >
              {/* Simulated Browser Bar */}
              <div 
                style={{
                  padding: '0.5rem 0.85rem',
                  background: '#0f172a',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div className="flex gap-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                </div>
                <div 
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    textAlign: 'center'
                  }}
                >
                  https://prycoons.com/real-estate-ahmedabad
                </div>
              </div>

              {/* Simulated Webpage Content Area */}
              <div 
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '1.5rem',
                  background: 'linear-gradient(180deg, #0b1120 0%, #0f172a 100%)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ maxWidth: '380px' }}>
                  <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Prycoons Real Estate</span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                    Luxury Living in Ahmedabad & GIFT City
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    Discover ultra-luxury 3/4/5 BHK residences and Grade-A commercial spaces with world-class amenities.
                  </p>
                </div>

                {/* Floating Widget Sandbox Bubble */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    [widgetPosition === 'bottom-right' ? 'right' : 'left']: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: widgetPosition === 'bottom-right' ? 'flex-end' : 'flex-start',
                    gap: '0.5rem',
                    zIndex: 20
                  }}
                >
                  {/* Proactive Greeting Teaser Popup */}
                  {popupGreeting && !widgetOpen && (
                    <div 
                      style={{
                        background: '#1e293b',
                        color: '#ffffff',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.78rem',
                        maxWidth: '220px',
                        boxShadow: 'var(--shadow-lg)',
                        animation: 'fadeIn 0.3s ease-out'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: widgetColor, marginBottom: '0.15rem' }}>
                        {currentBot.name}
                      </div>
                      Looking for 3BHK or GIFT City properties? I can help! 🏙️
                    </div>
                  )}

                  {/* Expanded Mini Widget Simulation */}
                  {widgetOpen && (
                    <div 
                      style={{
                        width: '260px',
                        height: '240px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-xl)',
                        overflow: 'hidden',
                        marginBottom: '0.25rem'
                      }}
                    >
                      <div style={{ padding: '0.5rem 0.75rem', background: widgetColor, color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{currentBot.name}</span>
                        <span style={{ cursor: 'pointer' }} onClick={() => setWidgetOpen(false)}>✕</span>
                      </div>
                      <div style={{ flex: 1, padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {currentBot.welcomeMessage}
                      </div>
                      <div style={{ padding: '0.4rem 0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.35rem' }}>
                        <input type="text" className="form-input" placeholder="Ask a question..." style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} />
                        <button className="btn btn-primary btn-sm btn-icon" style={{ backgroundColor: widgetColor }}>
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Floating Action Button */}
                  <button
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: widgetColor,
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: `0 4px 20px ${widgetColor}66`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      transition: 'transform 0.2s'
                    }}
                    onClick={() => setWidgetOpen(!widgetOpen)}
                    title="Click to toggle widget preview"
                  >
                    {bubbleIcon === 'chat' && <MessageCircle size={24} />}
                    {bubbleIcon === 'sparkle' && <Sparkles size={24} />}
                    {bubbleIcon === 'avatar' && <span>{currentBot.avatar}</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code & Omnichannel Grid */}
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {/* QR Code Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <QrCode size={18} style={{ color: 'var(--accent-emerald)' }} />
                  QR Code for Site Visits & Print Media
                </h3>
                <p className="card-subtitle">Print on site billboards, brochures, and standees</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Simulated QR Box */}
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  <rect x="0" y="0" width="30" height="30" fill="#000" />
                  <rect x="5" y="5" width="20" height="20" fill="#fff" />
                  <rect x="10" y="10" width="10" height="10" fill="#000" />
                  
                  <rect x="70" y="0" width="30" height="30" fill="#000" />
                  <rect x="75" y="5" width="20" height="20" fill="#fff" />
                  <rect x="80" y="10" width="10" height="10" fill="#000" />

                  <rect x="0" y="70" width="30" height="30" fill="#000" />
                  <rect x="5" y="75" width="20" height="20" fill="#fff" />
                  <rect x="10" y="80" width="10" height="10" fill="#000" />

                  <rect x="40" y="40" width="20" height="20" fill="#000" />
                  <rect x="45" y="10" width="10" height="20" fill="#000" />
                  <rect x="70" y="50" width="20" height="15" fill="#000" />
                  <rect x="40" y="75" width="20" height="15" fill="#000" />
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Visitors can scan this QR code with any smartphone camera at your project site experience centers to launch the conversational AI without installing an app.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={handleDownloadQr}>
                  <Download size={14} />
                  <span>Download High-Res SVG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Omnichannel Sandbox */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Smartphone size={18} style={{ color: 'var(--accent-purple)' }} />
                  Omnichannel Messaging Integrations
                </h3>
                <p className="card-subtitle">Connect with messaging platforms</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between" style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>WhatsApp Business Cloud API</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Automate WhatsApp buyer leads</div>
                  </div>
                </div>
                <span className="badge badge-success">Connected</span>
              </div>

              <div className="flex items-center justify-between" style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.2rem' }}>✈️</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Telegram Bot Channel</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Direct community support channel</div>
                  </div>
                </div>
                <span className="badge badge-neutral">Ready to Link</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
