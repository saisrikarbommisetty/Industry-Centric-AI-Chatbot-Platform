import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  Settings, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Sliders, 
  Cpu, 
  Mail, 
  Webhook, 
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const BotSettings = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { bots, updateBot, deleteBot, addToast } = usePlatform();

  const currentBot = bots.find((b) => b.id === botId) || bots[0];

  const [formData, setFormData] = useState({
    name: currentBot?.name || '',
    avatar: currentBot?.avatar || '🏢',
    tone: currentBot?.tone || 'Consultative, Professional & Prestigious',
    model: currentBot?.model || 'Gemini 1.5 Pro (Domain-Tuned)',
    temperature: 0.2,
    welcomeMessage: currentBot?.welcomeMessage || '',
    promptGuidelines: currentBot?.promptGuidelines || '',
    webhookUrl: 'https://api.prycoons.com/webhooks/ai-leads',
    notificationEmail: 'sales-leads@prycoons.com',
    leadCaptureEnabled: currentBot?.leadCaptureEnabled !== undefined ? currentBot?.leadCaptureEnabled : true
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateBot(currentBot.id, {
      name: formData.name,
      avatar: formData.avatar,
      tone: formData.tone,
      model: formData.model,
      welcomeMessage: formData.welcomeMessage,
      promptGuidelines: formData.promptGuidelines,
      leadCaptureEnabled: formData.leadCaptureEnabled
    });
  };

  const handleDelete = () => {
    deleteBot(currentBot.id);
    navigate('/bots');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0, maxWidth: '900px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Assistant Settings & Governance</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Configure model intelligence parameters, behavioral guardrails, lead webhook integration, and lifecycle controls.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Configuration Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">General Identity</h3>
                <p className="card-subtitle">Assistant name, avatar, and branding</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Assistant Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Emoji</label>
                <div className="flex items-center gap-2">
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    {formData.avatar}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    style={{ width: '80px', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Welcome Message</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              />
            </div>
          </div>

          {/* Model & Persona Tuning */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Cpu size={18} style={{ color: 'var(--accent-purple)' }} />
                  LLM Model & Persona Tuning
                </h3>
                <p className="card-subtitle">Control response creativity and precision</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Underlying Foundation Model</label>
                <select
                  className="form-select"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                >
                  <option value="Gemini 1.5 Pro (Domain-Tuned)">Gemini 1.5 Pro (High Reasoning & Knowledge Grounding)</option>
                  <option value="Gemini 1.5 Flash (Fast)">Gemini 1.5 Flash (Ultra-Low Latency 0.4s)</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Nuanced Dialogue)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Temperature (Hallucination Control): {formData.temperature}</span>
                  <span className="label-hint">Lower is more factual</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '0.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">System Behavioral Prompt Guidelines</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={formData.promptGuidelines}
                onChange={(e) => setFormData({ ...formData, promptGuidelines: e.target.value })}
              />
            </div>
          </div>

          {/* Lead Capture Webhooks & Notification Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Webhook size={18} style={{ color: 'var(--accent-emerald)' }} />
                  CRM Webhooks & Lead Routing
                </h3>
                <p className="card-subtitle">Dispatch visitor leads directly to your sales pipeline</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Webhook Endpoint (POST JSON)</label>
                <input
                  type="url"
                  className="form-input font-mono"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lead Notification Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.notificationEmail}
                  onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Save Button Bar */}
          <div className="flex items-center justify-end" style={{ marginBottom: '2.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg">
              <Save size={16} />
              <span>Save Assistant Settings</span>
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div 
          className="card"
          style={{
            border: '1px solid rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.04)',
            padding: '1.5rem'
          }}
        >
          <div className="flex items-center gap-2 text-danger" style={{ marginBottom: '0.5rem', fontWeight: 700 }}>
            <ShieldAlert size={18} />
            <span>Danger Zone</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Delete this AI Assistant
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Permanently destroy all {currentBot.sourcesCount || 0} vectorized knowledge sources and conversation archives.
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={14} />
              <span>Delete Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title text-danger" style={{ fontSize: '1.1rem' }}>
                <AlertTriangle size={18} />
                Confirm Assistant Deletion
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{currentBot.name}</strong>?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                This action cannot be undone. All active embed widgets on your website will immediately cease functioning.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
