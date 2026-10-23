import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BotNav } from '../../components/common/BotNav';
import { 
  Settings, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Mail, 
  CheckCircle2,
  Sliders,
  Palette
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
    description: currentBot?.description || '',
    welcomeMessage: currentBot?.welcomeMessage || '',
    promptGuidelines: currentBot?.promptGuidelines || '',
    primaryColor: currentBot?.primaryColor || '#C85C4A',
    notificationEmail: 'sales-leads@prycoons.com'
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateBot(currentBot.id, {
      name: formData.name,
      avatar: formData.avatar,
      description: formData.description,
      welcomeMessage: formData.welcomeMessage,
      promptGuidelines: formData.promptGuidelines,
      primaryColor: formData.primaryColor
    });
  };

  const handleDelete = () => {
    deleteBot(currentBot.id);
    navigate('/bots');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <BotNav />

      <div className="page-container" style={{ paddingTop: 0, maxWidth: '840px' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Assistant Settings
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Configure assistant details, welcome message, behavioral instructions, and notifications.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Section */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">General Details</h3>
                <p className="card-subtitle">Assistant name and description</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
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
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-soft-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem',
                      border: '1px solid var(--border-default)',
                      flexShrink: 0
                    }}
                  >
                    {formData.avatar}
                  </div>
                  <input
                    type="text"
                    maxLength={3}
                    className="form-input"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                rows={2}
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Appearance & Greeting */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Appearance & Greeting</h3>
                <p className="card-subtitle">First message shown to customers</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Welcome Message</label>
              <textarea
                rows={3}
                required
                className="form-textarea"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  style={{ width: '42px', height: '36px', padding: 0, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                />
                <span className="font-mono text-secondary" style={{ fontSize: '0.85rem' }}>{formData.primaryColor}</span>
              </div>
            </div>
          </div>

          {/* Behaviour & Instructions */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Behaviour & Instructions</h3>
                <p className="card-subtitle">Guidelines the assistant follows when answering questions</p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assistant Instructions</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={formData.promptGuidelines}
                onChange={(e) => setFormData({ ...formData, promptGuidelines: e.target.value })}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end" style={{ marginBottom: '2rem' }}>
            <button type="submit" className="btn btn-primary btn-lg">
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div 
          className="card"
          style={{
            borderColor: 'rgba(220, 38, 38, 0.25)',
            background: 'var(--bg-surface)',
            padding: '1.5rem 1.75rem',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#DC2626' }}>
                Delete Assistant
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Permanently removes this assistant and its conversation records.
              </p>
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
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h3 className="card-title">Confirm Deletion</h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong>{currentBot.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
