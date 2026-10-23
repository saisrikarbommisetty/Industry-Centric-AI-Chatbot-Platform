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
  UploadCloud,
  X
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotKnowledge = () => {
  const { botId } = useParams();
  const { bots, knowledgeSources, addKnowledgeSource, removeKnowledgeSource, syncKnowledgeSource, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const botSources = knowledgeSources.filter((k) => k.botId === currentBot?.id);

  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Source Form State
  const [newSourceType, setNewSourceType] = useState('url');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const filteredSources = botSources.filter((s) => filterType === 'all' || s.type === filterType);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addKnowledgeSource(currentBot.id, {
      title: newTitle,
      type: newSourceType,
      url: newUrl || '#',
      size: newSourceType === 'pdf' ? '2.8 MB' : '180 KB',
      summary: newSummary || 'Content indexed for instant customer query resolution.'
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewUrl('');
    setNewSummary('');
  };

  const handleReindexAll = () => {
    botSources.forEach((s) => syncKnowledgeSource(s.id));
    addToast('All knowledge sources refreshed and synced!', 'success');
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
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '620px' }}>
                Your assistant references these verified website pages and documents to answer customer questions accurately.
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
            Websites
          </button>
          <button
            className={`btn btn-sm ${filterType === 'pdf' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('pdf')}
          >
            Documents
          </button>
        </div>

        {/* Knowledge Sources Grid */}
        <div className="flex flex-col gap-3">
          {filteredSources.map((source) => (
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
                  {source.type === 'url' ? <Globe size={18} /> : <FileText size={18} />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {source.title}
                    </h3>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {source.type}
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
                    <span>Last synced: {source.lastSync}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => syncKnowledgeSource(source.id)}
                  title="Re-sync this source"
                >
                  <RefreshCw size={13} />
                  <span>Re-sync</span>
                </button>

                <button 
                  className="btn btn-ghost btn-sm btn-icon text-muted"
                  onClick={() => removeKnowledgeSource(source.id)}
                  title="Delete knowledge source"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
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
                  <div className="grid-2" style={{ gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('url')}
                    >
                      <Globe size={14} />
                      <span>Website URL</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('pdf')}
                    >
                      <FileText size={14} />
                      <span>Document (PDF)</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Source Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Project FAQ & Specifications"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {newSourceType === 'url' ? (
                  <div className="form-group">
                    <label className="form-label">Web URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/project-specs"
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
