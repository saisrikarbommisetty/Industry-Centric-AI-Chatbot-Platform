import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  BookOpen, 
  Plus, 
  RefreshCw, 
  FileText, 
  Globe, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  UploadCloud,
  Share2,
  Video,
  MessageCircle,
  Sparkles,
  Link2,
  X,
  Clock,
  Layers
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotKnowledge = () => {
  const { botId } = useParams();
  const { 
    bots, 
    knowledgeSources, 
    fetchBotKnowledgeSources, 
    addKnowledgeSource, 
    removeKnowledgeSource, 
    syncKnowledgeSource, 
    addSocialMediaSource,
    refreshSocialMediaSource,
    deleteSocialMediaSource,
    addToast 
  } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const botSources = knowledgeSources.filter((k) => k.botId === currentBot?.id);

  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Social Media Integration State
  const [socialUrl, setSocialUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [isFetchingSocial, setIsFetchingSocial] = useState(false);
  const [socialStatusMessage, setSocialStatusMessage] = useState('');
  const [socialStatusType, setSocialStatusType] = useState(''); // 'info' | 'success' | 'warning' | 'error'
  const [showManualContentInput, setShowManualContentInput] = useState(false);
  const [manualPostContent, setManualPostContent] = useState('');
  const [socialPostTitle, setSocialPostTitle] = useState('');

  // Sync real crawled sources from backend API on mount or bot change
  React.useEffect(() => {
    if (currentBot?.id && fetchBotKnowledgeSources) {
      fetchBotKnowledgeSources(currentBot.id);
    }
  }, [currentBot?.id]);

  // Real-time automatic platform detection from URL
  const detectPlatformFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const lower = url.toLowerCase().trim();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { id: 'youtube', name: 'YouTube', badgeColor: '#ef4444', icon: '🔴' };
    }
    if (lower.includes('twitter.com') || lower.includes('x.com')) {
      return { id: 'twitter', name: 'X (Twitter)', badgeColor: '#0f1419', icon: '✖️' };
    }
    if (lower.includes('linkedin.com')) {
      return { id: 'linkedin', name: 'LinkedIn', badgeColor: '#0a66c2', icon: '💼' };
    }
    if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
      return { id: 'instagram', name: 'Instagram', badgeColor: '#e1306c', icon: '📸' };
    }
    if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
      return { id: 'facebook', name: 'Facebook', badgeColor: '#1877f2', icon: '👥' };
    }
    if (lower.includes('tiktok.com')) {
      return { id: 'tiktok', name: 'TikTok', badgeColor: '#000000', icon: '🎵' };
    }
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return { id: 'other', name: 'Web Source', badgeColor: '#6366f1', icon: '🌐' };
    }
    return null;
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setSocialUrl(val);
    const detected = detectPlatformFromUrl(val);
    setDetectedPlatform(detected);
    if (detected && selectedPlatform === 'all') {
      // Keep selectedPlatform on 'all' or show detection feedback
    }
    if (!val) {
      setSocialStatusMessage('');
      setSocialStatusType('');
      setShowManualContentInput(false);
    }
  };

  // Handle Social Media Form Submission
  const handleFetchSocialContent = async (e) => {
    e.preventDefault();
    if (!socialUrl.trim()) {
      addToast('Please enter a valid social media URL.', 'error');
      return;
    }

    setIsFetchingSocial(true);
    setSocialStatusMessage('Detecting platform and fetching public content...');
    setSocialStatusType('info');

    try {
      const res = await addSocialMediaSource(currentBot.id, {
        url: socialUrl.trim(),
        title: socialPostTitle.trim() || undefined,
        platform: selectedPlatform !== 'all' ? selectedPlatform : (detectedPlatform?.id || undefined),
        manualContent: manualPostContent.trim() || undefined,
      });

      if (res?.isDuplicate) {
        setSocialStatusMessage('Duplicate post detected: This social media URL is already indexed for this assistant. You can refresh it below.');
        setSocialStatusType('warning');
        setIsFetchingSocial(false);
        return;
      }

      if (res?.success) {
        setSocialStatusMessage('Post content extracted, embeddings generated, and successfully indexed into knowledge base!');
        setSocialStatusType('success');
        setSocialUrl('');
        setSocialPostTitle('');
        setManualPostContent('');
        setShowManualContentInput(false);
        setDetectedPlatform(null);
      } else {
        const errMsg = res?.extraction?.error?.message || 'Content could not be automatically extracted from this platform.';
        setSocialStatusMessage(errMsg);
        setSocialStatusType('warning');
        // If content unavailable or restricted, allow manual supply
        if (res?.extraction?.error?.userActionRequired || !manualPostContent) {
          setShowManualContentInput(true);
        }
      }
    } catch (err) {
      setSocialStatusMessage(`Error: ${err.message || 'Failed to process social media content.'}`);
      setSocialStatusType('error');
    } finally {
      setIsFetchingSocial(false);
    }
  };

  // Add Source Form State (General Modal)
  const [newSourceType, setNewSourceType] = useState('url');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const filteredSources = botSources.filter((s) => {
    if (filterType === 'all') return true;
    if (filterType === 'url') return s.type === 'url';
    if (filterType === 'pdf') return s.type === 'pdf' || s.type === 'document';
    if (filterType === 'social') return s.type === 'social_media';
    return s.type === filterType;
  });

  const socialSources = botSources.filter((s) => s.type === 'social_media');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (newSourceType === 'social_media') {
      addSocialMediaSource(currentBot.id, {
        url: newUrl || `https://social-${Date.now()}.local`,
        title: newTitle,
        manualContent: newSummary,
      });
    } else {
      addKnowledgeSource(currentBot.id, {
        title: newTitle,
        type: newSourceType,
        url: newUrl || '#',
        size: newSourceType === 'pdf' ? '2.8 MB' : '180 KB',
        summary: newSummary || 'Content indexed for instant customer query resolution.'
      });
    }

    setShowAddModal(false);
    setNewTitle('');
    setNewUrl('');
    setNewSummary('');
  };

  const handleReindexAll = () => {
    botSources.forEach((s) => {
      if (s.type === 'social_media') {
        refreshSocialMediaSource(currentBot.id, s.id);
      } else {
        syncKnowledgeSource(s.id);
      }
    });
    if (fetchBotKnowledgeSources && currentBot?.id) {
      setTimeout(() => fetchBotKnowledgeSources(currentBot.id), 1200);
    }
    addToast('All knowledge sources refreshed and synced!', 'success');
  };

  // Helper for platform styling & badges
  const getPlatformMeta = (source) => {
    const url = (source.url || '').toLowerCase();
    const title = (source.title || '').toLowerCase();
    const summary = (source.extractedSummary || '').toLowerCase();

    if (url.includes('youtube.com') || url.includes('youtu.be') || title.includes('youtube') || summary.includes('youtube')) {
      return { name: 'YouTube', color: '#ef4444', icon: '🔴' };
    }
    if (url.includes('twitter.com') || url.includes('x.com') || title.includes('twitter') || title.includes(' x ')) {
      return { name: 'X (Twitter)', color: '#0f1419', icon: '✖️' };
    }
    if (url.includes('linkedin.com') || title.includes('linkedin') || summary.includes('linkedin')) {
      return { name: 'LinkedIn', color: '#0a66c2', icon: '💼' };
    }
    if (url.includes('instagram.com') || url.includes('instagr.am') || title.includes('instagram')) {
      return { name: 'Instagram', color: '#e1306c', icon: '📸' };
    }
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com') || title.includes('facebook')) {
      return { name: 'Facebook', color: '#1877f2', icon: '👥' };
    }
    if (url.includes('tiktok.com') || title.includes('tiktok')) {
      return { name: 'TikTok', color: '#000000', icon: '🎵' };
    }
    return { name: 'Social Post', color: '#6366f1', icon: '🌐' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Knowledge Header Overview Banner */}
        <div 
          className="card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            marginBottom: '1.75rem',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
                <span className="badge badge-primary">Knowledge Hub</span>
                <span className="badge badge-success">
                  <span className="status-dot active" style={{ width: 6, height: 6 }} />
                  Synced & Ready
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Knowledge Sources
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '640px' }}>
                Your assistant references verified website pages, uploaded documents, and social media content to answer customer queries with complete factual grounding.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm" onClick={handleReindexAll}>
                <RefreshCw size={14} />
                <span>Re-sync All</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} />
                <span>Add Knowledge Source</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── NEW SECTION: Social Media Content Integration ── */}
        <div
          className="card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            marginBottom: '1.75rem',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
            <div className="flex items-center gap-2.5">
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Share2 size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Social Media Content Integration
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    <Sparkles size={11} style={{ marginRight: 3 }} />
                    RAG Pipeline Connected
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Paste any public post URL from Instagram, Facebook, LinkedIn, X (Twitter), YouTube, or TikTok to ingest and index its content into this bot's knowledge base.
                </p>
              </div>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
              {socialSources.length} Social Post{socialSources.length === 1 ? '' : 's'} Active
            </span>
          </div>

          {/* Social Ingestion Form */}
          <form onSubmit={handleFetchSocialContent}>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 240px) 1fr auto',
                gap: '0.75rem',
                alignItems: 'center',
              }}
              className="social-input-row"
            >
              {/* Platform Dropdown */}
              <div>
                <select
                  className="form-input"
                  style={{ height: '42px', fontSize: '0.85rem' }}
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                >
                  <option value="all">All Social Media Platforms</option>
                  <option value="youtube">YouTube (Videos & Shorts)</option>
                  <option value="twitter">X / Twitter (Posts & Threads)</option>
                  <option value="linkedin">LinkedIn (Posts & Articles)</option>
                  <option value="instagram">Instagram (Posts & Reels)</option>
                  <option value="facebook">Facebook (Public Posts)</option>
                  <option value="tiktok">TikTok (Videos)</option>
                  <option value="other">Other Public Platform</option>
                </select>
              </div>

              {/* URL Input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  required
                  className="form-input"
                  style={{ height: '42px', paddingRight: detectedPlatform ? '120px' : '14px', fontSize: '0.85rem' }}
                  placeholder="Paste social media post URL (e.g. https://www.linkedin.com/posts/... or https://youtu.be/...)"
                  value={socialUrl}
                  onChange={handleUrlChange}
                />
                {detectedPlatform && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-default)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>{detectedPlatform.icon}</span>
                    <span>{detectedPlatform.name}</span>
                  </div>
                )}
              </div>

              {/* Add / Fetch Button */}
              <button
                type="submit"
                disabled={isFetchingSocial || !socialUrl.trim()}
                className="btn btn-primary"
                style={{ height: '42px', minWidth: '150px', whiteSpace: 'nowrap' }}
              >
                {isFetchingSocial ? (
                  <>
                    <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Add URL / Fetch Content</span>
                  </>
                )}
              </button>
            </div>

            {/* Optional Manual Post Text Field (Revealed on restriction or request) */}
            {showManualContentInput && (
              <div 
                style={{
                  marginTop: '0.85rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-default)'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, fontSize: '0.82rem' }}>
                    Post Caption / Content (Manual Supply)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Paste the visible caption or summary if direct automated platform access is restricted
                  </span>
                </div>
                <textarea
                  rows={3}
                  className="form-textarea"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Paste the caption, text, or service description from this post here..."
                  value={manualPostContent}
                  onChange={(e) => setManualPostContent(e.target.value)}
                />
                <div className="flex justify-end" style={{ marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={isFetchingSocial || !manualPostContent.trim()}
                    className="btn btn-secondary btn-sm"
                  >
                    <CheckCircle2 size={13} />
                    <span>Index Post With Provided Content</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status & Feedback Alert Banner */}
            {socialStatusMessage && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  backgroundColor:
                    socialStatusType === 'success'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : socialStatusType === 'error'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : socialStatusType === 'warning'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'var(--bg-app)',
                  border: `1px solid ${
                    socialStatusType === 'success'
                      ? 'rgba(34, 197, 94, 0.3)'
                      : socialStatusType === 'error'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : socialStatusType === 'warning'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'var(--border-default)'
                  }`,
                  color:
                    socialStatusType === 'success'
                      ? 'var(--success)'
                      : socialStatusType === 'error'
                      ? 'var(--danger)'
                      : socialStatusType === 'warning'
                      ? '#b45309'
                      : 'var(--text-primary)',
                }}
              >
                {socialStatusType === 'success' ? (
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                ) : socialStatusType === 'error' || socialStatusType === 'warning' ? (
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                ) : (
                  <RefreshCw size={16} className="spin" style={{ flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, lineHeight: 1.4 }}>{socialStatusMessage}</div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ width: 22, height: 22 }}
                  onClick={() => setSocialStatusMessage('')}
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </form>

          {/* Social Sources List */}
          {socialSources.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div 
                style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: 700, 
                  color: 'var(--text-secondary)', 
                  marginBottom: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Active Social Media Knowledge ({socialSources.length})</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Indexed into assistant RAG context
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {socialSources.map((source) => {
                  const meta = getPlatformMeta(source);
                  return (
                    <div
                      key={source.id}
                      style={{
                        padding: '0.85rem 1.15rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div className="flex items-start gap-3" style={{ flex: 1, minWidth: '260px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            flexShrink: 0
                          }}
                        >
                          {meta.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              style={{ 
                                fontSize: '0.88rem', 
                                fontWeight: 700, 
                                color: 'var(--text-primary)' 
                              }}
                            >
                              {source.title}
                            </span>
                            <span 
                              className="badge badge-neutral" 
                              style={{ 
                                fontSize: '0.65rem',
                                borderLeft: `3px solid ${meta.color}`
                              }}
                            >
                              {meta.name}
                            </span>
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                              <CheckCircle2 size={10} style={{ marginRight: 2 }} />
                              Indexed
                            </span>
                          </div>

                          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                            {source.extractedSummary}
                          </p>

                          <div className="flex items-center gap-3" style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                            >
                              <span>Original Post</span>
                              <ExternalLink size={10} />
                            </a>
                            <span>•</span>
                            <span>Chunks: {source.chunks || 2}</span>
                            <span>•</span>
                            <span>Last indexed: {source.lastSync}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ height: '30px', fontSize: '0.75rem' }}
                          onClick={() => refreshSocialMediaSource(currentBot.id, source.id)}
                          title="Re-fetch and update embeddings"
                        >
                          <RefreshCw size={12} />
                          <span>Refresh</span>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon text-muted"
                          style={{ height: '30px', width: '30px' }}
                          onClick={() => deleteSocialMediaSource(currentBot.id, source.id)}
                          title="Delete social media source"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2" style={{ marginBottom: '1.25rem' }}>
          <button
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('all')}
          >
            All Sources ({botSources.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'url' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('url')}
          >
            Websites ({botSources.filter((s) => s.type === 'url').length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'pdf' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('pdf')}
          >
            Documents ({botSources.filter((s) => s.type === 'pdf' || s.type === 'document').length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'social' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('social')}
          >
            Social Media ({socialSources.length})
          </button>
        </div>

        {/* Knowledge Sources Grid */}
        <div className="flex flex-col gap-3">
          {filteredSources.map((source) => {
            const isSocial = source.type === 'social_media';
            const meta = isSocial ? getPlatformMeta(source) : null;

            return (
              <div 
                key={source.id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div className="flex items-start gap-3.5" style={{ flex: 1, minWidth: '280px' }}>
                  <div 
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-soft-surface)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isSocial ? (
                      <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
                    ) : source.type === 'url' ? (
                      <Globe size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {source.title}
                      </h3>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {isSocial ? meta.name : source.type}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        Synced
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {source.extractedSummary}
                    </p>

                    <div className="flex items-center gap-3" style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Size: {source.size}</span>
                      <span>•</span>
                      {source.url && source.url !== '#' && (
                        <>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <span>Link</span>
                            <ExternalLink size={10} />
                          </a>
                          <span>•</span>
                        </>
                      )}
                      <span>Last synced: {source.lastSync}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (isSocial) {
                        refreshSocialMediaSource(currentBot.id, source.id);
                      } else {
                        syncKnowledgeSource(source.id);
                      }
                    }}
                    title="Re-sync this source"
                  >
                    <RefreshCw size={13} />
                    <span>Re-sync</span>
                  </button>

                  <button 
                    className="btn btn-ghost btn-sm btn-icon text-muted"
                    onClick={() => {
                      if (isSocial) {
                        deleteSocialMediaSource(currentBot.id, source.id);
                      } else {
                        removeKnowledgeSource(source.id);
                      }
                    }}
                    title="Delete knowledge source"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Knowledge Source Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="card-title">Add Knowledge Source</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Source Type</label>
                  <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('url')}
                    >
                      <Globe size={13} />
                      <span>Website</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('pdf')}
                    >
                      <FileText size={13} />
                      <span>Document</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'social_media' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('social_media')}
                    >
                      <Share2 size={13} />
                      <span>Social Media</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Source Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Instagram Service Showcase / LinkedIn Announcement"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {newSourceType === 'url' || newSourceType === 'social_media' ? (
                  <div className="form-group">
                    <label className="form-label">
                      {newSourceType === 'social_media' ? 'Social Media Post URL' : 'Web URL'}
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder={
                        newSourceType === 'social_media'
                          ? 'https://www.linkedin.com/posts/... or https://youtube.com/watch?v=...'
                          : 'https://example.com/project-specs'
                      }
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Upload File</label>
                    <div 
                      style={{
                        border: '2px dashed var(--border-default)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-app)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setNewTitle('Project_Brochure_2026.pdf');
                        addToast('Document selected: Project_Brochure_2026.pdf', 'info');
                      }}
                    >
                      <UploadCloud size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.25rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Click to select PDF or brochure</div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description / Summary (Optional)</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Briefly describe what information this source provides..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
