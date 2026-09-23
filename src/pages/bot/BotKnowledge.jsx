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
  Eye, 
  CheckCircle2, 
  Database, 
  Layers,
  X,
  UploadCloud
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotKnowledge = () => {
  const { botId } = useParams();
  const { bots, knowledgeSources, addKnowledgeSource, removeKnowledgeSource, syncKnowledgeSource, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];
  const botSources = knowledgeSources.filter((k) => k.botId === currentBot?.id);

  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectSource, setInspectSource] = useState(null);

  // Add Source Form State
  const [newSourceType, setNewSourceType] = useState('url');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const filteredSources = botSources.filter((s) => filterType === 'all' || s.type === filterType);
  const totalChunks = botSources.reduce((acc, curr) => acc + (curr.chunks || 0), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addKnowledgeSource(currentBot.id, {
      title: newTitle,
      type: newSourceType,
      url: newUrl || '#',
      size: newSourceType === 'pdf' ? '3.2 MB' : '190 KB',
      summary: newSummary || 'Ingested document vectorized into high-dimensional semantic space.'
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewUrl('');
    setNewSummary('');
  };

  const handleReindexAll = () => {
    botSources.forEach((s) => syncKnowledgeSource(s.id));
    addToast('All knowledge sources re-crawled and re-indexed!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Knowledge Header Overview Banner */}
        <div 
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--border-default)',
            marginBottom: '1.75rem',
            padding: '1.5rem'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
                <span className="badge badge-purple">RAG Vector Hub</span>
                <span className="badge badge-success">100% Synced</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Domain Knowledge Base & Vector Index</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '600px' }}>
                The assistant retrieves contextual information strictly from these validated documents and URLs to answer questions accurately without hallucinations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm" onClick={handleReindexAll}>
                <RefreshCw size={14} />
                <span>Re-index All</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} />
                <span>Add Knowledge Source</span>
              </button>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Sources</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{botSources.length} Documents & URLs</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vector Embeddings</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a855f7' }}>{totalChunks} Chunks (768-dim)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search Precision</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>99.8% Grounded</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-1.5">
            <button
              className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterType('all')}
            >
              All Sources ({botSources.length})
            </button>
            <button
              className={`btn btn-sm ${filterType === 'pdf' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterType('pdf')}
            >
              PDF Brochures
            </button>
            <button
              className={`btn btn-sm ${filterType === 'url' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterType('url')}
            >
              Web URLs
            </button>
            <button
              className={`btn btn-sm ${filterType === 'faq' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterType('faq')}
            >
              FAQ Tables
            </button>
          </div>
        </div>

        {/* Knowledge Sources Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source Document / URL</th>
                  <th>Type</th>
                  <th>Vector Chunks</th>
                  <th>Status</th>
                  <th>Last Ingested</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: source.type === 'pdf' ? 'rgba(244, 63, 94, 0.12)' : 'var(--primary-subtle)',
                            color: source.type === 'pdf' ? 'var(--accent-rose)' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {source.type === 'pdf' ? <FileText size={16} /> : <Globe size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {source.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {source.url} • {source.size}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        {source.type}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                        {source.chunks} Chunks
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="status-dot active" />
                        <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>Synced</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {source.lastSync}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Inspect Extracted Chunks"
                          onClick={() => setInspectSource(source)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Re-sync"
                          onClick={() => syncKnowledgeSource(source.id)}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon text-danger"
                          title="Delete Source"
                          onClick={() => removeKnowledgeSource(source.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Knowledge Source Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                Add New Knowledge Source
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Source Format</label>
                  <div className="grid-3" style={{ gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('url')}
                    >
                      <Globe size={14} />
                      <span>Web URL</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('pdf')}
                    >
                      <FileText size={14} />
                      <span>PDF Brochure</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${newSourceType === 'faq' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewSourceType('faq')}
                    >
                      <Database size={14} />
                      <span>FAQ Pairs</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Document Title or Project Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Prycoons Emerald Heights Brochure 2026"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {newSourceType === 'url' ? (
                  <div className="form-group">
                    <label className="form-label">Web URL Address</label>
                    <input
                      type="url"
                      required
                      className="form-input"
                      placeholder="https://prycoons.com/projects/emerald-heights"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Document File Upload</label>
                    <div 
                      style={{
                        border: '2px dashed var(--border-default)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        background: 'var(--bg-surface-elevated)'
                      }}
                    >
                      <UploadCloud size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Click to select PDF or Drag & Drop</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Files up to 50MB</div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Summary Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Brief description of project specifications, floor plans or RERA info..."
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
                  Vectorize & Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Chunks Modal */}
      {inspectSource && (
        <div className="modal-overlay" onClick={() => setInspectSource(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="card-title" style={{ fontSize: '1rem' }}>
                  <Layers size={18} style={{ color: 'var(--accent-purple)' }} />
                  Vector Chunks: {inspectSource.title}
                </h3>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {inspectSource.chunks} semantic text chunks generated for RAG
                </span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setInspectSource(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '420px' }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <strong>Ingestion Summary:</strong> {inspectSource.extractedSummary}
              </div>

              <div className="flex flex-col gap-2.5">
                {[1, 2, 3].map((chunkNum) => (
                  <div 
                    key={chunkNum}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem'
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Chunk #{chunkNum}</span>
                      <span className="text-muted font-mono">Similarity: 0.94 • 248 Tokens</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {chunkNum === 1 && `Project: ${inspectSource.title}. RERA registered under Gujarat Real Estate Regulatory Authority. All units feature Italian marble flooring, 11-foot clear ceiling heights, and double-glazed soundproof glass.`}
                      {chunkNum === 2 && `Amenities include a 30,000 sq.ft. clubhouse, private temperature-controlled plunge pool for penthouses, 4-tier biometric security, EV fast charging, and landscaped meditation deck.`}
                      {chunkNum === 3 && `Payment schedule: 10% on booking, 20% on completion of plinth, balance staggered across milestone casting slabs. Bank loan approvals with SBI, HDFC, and ICICI.`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setInspectSource(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
