import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  GraduationCap, 
  HeartPulse, 
  Hotel, 
  ShoppingBag, 
  Scale, 
  UploadCloud, 
  Globe, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { INDUSTRIES } from '../../data/mockData';

export const CreateBotWizard = () => {
  const navigate = useNavigate();
  const { createBot, addToast } = usePlatform();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State across the 3 simple steps
  const [formData, setFormData] = useState({
    // Step 1: Details
    name: '',
    businessName: '',
    industryId: 'healthcare',
    industryName: 'Healthcare & Medical',
    avatar: '🩺',
    description: '',
    
    // Step 2: Knowledge
    websiteUrl: '',
    crawledPages: [],
    uploadedFiles: [],
    customLink: '',
    optionalLinks: []
  });

  const [isNameCustom, setIsNameCustom] = useState(false);
  const [isBusinessCustom, setIsBusinessCustom] = useState(false);
  const [isDescCustom, setIsDescCustom] = useState(false);

  const handleIndustrySelect = (ind) => {
    let defaultAvatar = ind.id === 'healthcare' ? '🩺' : ind.id === 'education' ? '🎓' : ind.id === 'ecommerce' ? '🛍️' : ind.id === 'legal' ? '⚖️' : ind.id === 'hospitality' ? '🛎️' : '🏢';
    let defaultName = `${ind.name.split(' ')[0]} Assistant`;
    let defaultBusiness = `${ind.name.split(' ')[0]} Services`;
    let defaultDesc = `Conversational assistant tailored to help visitors with questions about ${ind.name}.`;

    if (ind.id === 'education') {
      defaultAvatar = '🎓';
      defaultName = 'Admissions & Campus Assistant';
      defaultBusiness = 'Metropolitan University';
      defaultDesc = 'Answers student queries regarding degree programs, admissions criteria, scholarships, tuition, and campus life.';
    } else if (ind.id === 'healthcare') {
      defaultAvatar = '🩺';
      defaultName = 'Clinical & Patient Care Assistant';
      defaultBusiness = 'CityCare Medical Clinic';
      defaultDesc = 'Assists patients with clinic services, consulting physicians, consultation hours, and appointment guidelines.';
    } else if (ind.id === 'ecommerce') {
      defaultAvatar = '🛍️';
      defaultName = 'Customer Support & Sales Assistant';
      defaultBusiness = 'UrbanStyle Lifestyle';
      defaultDesc = 'Assists shoppers with product recommendations, order tracking, shipping, and return policies.';
    } else if (ind.id === 'legal') {
      defaultAvatar = '⚖️';
      defaultName = 'Legal Advisory Assistant';
      defaultBusiness = 'Vanguard Legal Partners';
      defaultDesc = 'Assists clients with practice areas, consultation booking, attorney profiles, and legal intake.';
    } else if (ind.id === 'hospitality') {
      defaultAvatar = '🛎️';
      defaultName = 'Guest Concierge Assistant';
      defaultBusiness = 'Grand Horizon Hotel';
      defaultDesc = 'Assists guests with room bookings, amenities, dining reservations, and check-in information.';
    } else if (ind.id === 'real-estate') {
      defaultAvatar = '🏢';
      defaultName = 'Real Estate Assistant';
      defaultBusiness = 'Prime Realty Properties';
      defaultDesc = 'Guides property buyers through apartments, BHK configurations, project pricing, brochures, and site visits.';
    }

    setFormData((prev) => ({
      ...prev,
      industryId: ind.id,
      industryName: ind.name,
      avatar: defaultAvatar,
      name: isNameCustom && prev.name.trim() ? prev.name : defaultName,
      businessName: isBusinessCustom && prev.businessName.trim() ? prev.businessName : defaultBusiness,
      description: isDescCustom && prev.description.trim() ? prev.description : defaultDesc,
      crawledPages: [],
      uploadedFiles: prev.uploadedFiles || [],
      optionalLinks: prev.optionalLinks || []
    }));
  };

  const handleSimulateFileUpload = () => {
    const org = (formData.businessName || formData.name || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
    const newFile = {
      name: `${org}_Brochure_Documentation_${Date.now().toString().slice(-4)}.pdf`,
      size: '2.4 MB',
      type: 'pdf'
    };
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, newFile]
    }));
    addToast(`Added document: ${newFile.name}`, 'success');
  };

  const handleAddLink = () => {
    if (!formData.customLink.trim()) return;
    setFormData((prev) => ({
      ...prev,
      optionalLinks: [...prev.optionalLinks, prev.customLink.trim()],
      customLink: ''
    }));
    addToast('Link added to knowledge sources', 'success');
  };

  const handleRemoveLink = (idx) => {
    setFormData((prev) => ({
      ...prev,
      optionalLinks: prev.optionalLinks.filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveFile = (idx) => {
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== idx)
    }));
  };

  const handleFinalCreate = async () => {
    setLoading(true);
    try {
      const allSources = [];
      const trimmedUrl = formData.websiteUrl?.trim();
      const botDisplayName = formData.name.trim() || 'AI Assistant';
      const botBusinessName = formData.businessName.trim() || botDisplayName;

      if (trimmedUrl) {
        allSources.push({
          title: `${botBusinessName} Official Website Knowledge`,
          url: trimmedUrl,
          type: 'url',
          summary: `Indexed official website domain knowledge for ${botDisplayName}.`
        });
      }

      if (formData.optionalLinks && formData.optionalLinks.length > 0) {
        formData.optionalLinks.forEach((link, idx) => {
          if (link.trim()) {
            allSources.push({
              title: `Reference Source ${idx + 1}`,
              url: link.trim(),
              type: 'url',
              summary: `Indexed reference link for ${botDisplayName}.`
            });
          }
        });
      }

      if (formData.crawledPages && formData.crawledPages.length > 0) {
        formData.crawledPages.forEach((p) => {
          allSources.push({
            title: p.title,
            url: p.url,
            type: 'url',
            summary: `Crawled page content for ${botDisplayName}.`
          });
        });
      }

      if (formData.uploadedFiles && formData.uploadedFiles.length > 0) {
        formData.uploadedFiles.forEach((f) => {
          allSources.push({
            title: f.name,
            size: f.size || '2.4 MB',
            type: 'pdf',
            summary: `Uploaded documentation for ${botDisplayName}.`
          });
        });
      }

      const created = await createBot({
        name: botDisplayName,
        businessName: botBusinessName,
        avatar: formData.avatar,
        industryId: formData.industryId,
        industryName: formData.industryName,
        description: formData.description || `Specialized conversational assistant for ${botBusinessName}.`,
        websiteUrl: trimmedUrl || '',
        initialSources: allSources
      });
      setLoading(false);
      navigate(`/bots/create/success/${created.id}`);
    } catch (err) {
      setLoading(false);
      addToast('Error creating assistant: ' + err.message, 'error');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '840px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Create Assistant
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Follow 3 simple steps to configure and launch your conversational assistant.
        </p>
      </div>

      {/* 3-Step Wizard Indicator */}
      <div className="wizard-steps-container">
        {/* Step 1 */}
        <div 
          className={`wizard-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="wizard-step-num">
            {currentStep > 1 ? <Check size={16} /> : '01'}
          </div>
          <span className="wizard-step-title">Details</span>
        </div>

        <div className={`wizard-step-line ${currentStep > 1 ? 'completed' : ''}`} />

        {/* Step 2 */}
        <div 
          className={`wizard-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(2)}
        >
          <div className="wizard-step-num">
            {currentStep > 2 ? <Check size={16} /> : '02'}
          </div>
          <span className="wizard-step-title">Knowledge</span>
        </div>

        <div className={`wizard-step-line ${currentStep > 2 ? 'completed' : ''}`} />

        {/* Step 3 */}
        <div 
          className={`wizard-step-item ${currentStep === 3 ? 'active' : ''}`}
          onClick={() => setCurrentStep(3)}
        >
          <div className="wizard-step-num">03</div>
          <span className="wizard-step-title">Review</span>
        </div>
      </div>

      {/* STEP 1: Details */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">01. Assistant Details</h2>
              <p className="card-subtitle">Define the identity and business focus of your assistant</p>
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
                onChange={(e) => {
                  setIsNameCustom(true);
                  setFormData({ ...formData, name: e.target.value });
                }}
                placeholder="e.g. CityCare Health Assistant"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business / Project Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.businessName}
                onChange={(e) => {
                  setIsBusinessCustom(true);
                  setFormData({ ...formData, businessName: e.target.value });
                }}
                placeholder="e.g. CityCare Medical Clinic"
              />
            </div>
          </div>

          {/* Industry Selection */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Industry Vertical</label>
            <div className="grid-3" style={{ gap: '0.75rem', marginTop: '0.25rem' }}>
              {INDUSTRIES.map((ind) => (
                <div
                  key={ind.id}
                  className="card card-interactive"
                  style={{
                    padding: '0.85rem 1rem',
                    border: formData.industryId === ind.id ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                    backgroundColor: formData.industryId === ind.id ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onClick={() => handleIndustrySelect(ind)}
                >
                  <span style={{ fontSize: '1.25rem' }}>
                    {ind.id === 'real-estate' ? '🏢' : ind.id === 'education' ? '🎓' : ind.id === 'healthcare' ? '🩺' : ind.id === 'hospitality' ? '🛎️' : ind.id === 'ecommerce' ? '🛍️' : '⚖️'}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ind.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Short Description</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={formData.description}
              onChange={(e) => {
                setIsDescCustom(true);
                setFormData({ ...formData, description: e.target.value });
              }}
              placeholder="Briefly describe what questions your assistant will answer for customers..."
            />
          </div>

          <div className="flex justify-end">
            <button 
              type="button" 
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentStep(2)}
            >
              <span>Continue to Knowledge</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Knowledge */}
      {currentStep === 2 && (
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">02. Knowledge Sources</h2>
              <p className="card-subtitle">Connect website URLs and upload documents for accurate answers</p>
            </div>
          </div>

          {/* Website URL */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Website URL</label>
            <div className="input-wrapper">
              <Globe size={16} className="input-icon-left" />
              <input
                type="url"
                className="form-input has-left-icon"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <span className="form-hint">Pages from this URL will be indexed for answering visitor inquiries.</span>
          </div>

          {/* Upload Documents Box */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Documents & Brochures (PDF / DOCX)</label>
            <div 
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={handleSimulateFileUpload}
            >
              <UploadCloud size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Click to upload brochures or specifications
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                PDF, DOCX, CSV up to 25 MB
              </div>
            </div>

            {/* List of uploaded files */}
            {formData.uploadedFiles.length > 0 && (
              <div className="flex flex-col gap-2" style={{ marginTop: '0.75rem' }}>
                {formData.uploadedFiles.map((file, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between"
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-default)',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{file.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>({file.size})</span>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm btn-icon text-muted"
                      onClick={() => handleRemoveFile(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Links */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Optional Reference Links</label>
            <div className="flex gap-2">
              <input
                type="url"
                className="form-input"
                value={formData.customLink}
                onChange={(e) => setFormData({ ...formData, customLink: e.target.value })}
                placeholder="https://example.com/faq"
                style={{ fontSize: '0.825rem' }}
              />
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleAddLink}
              >
                <Plus size={14} />
                <span>Add Link</span>
              </button>
            </div>

            {formData.optionalLinks.length > 0 && (
              <div className="flex flex-col gap-1.5" style={{ marginTop: '0.5rem' }}>
                {formData.optionalLinks.map((link, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between"
                    style={{
                      background: 'var(--bg-app)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{link}</span>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm btn-icon text-muted"
                      onClick={() => handleRemoveLink(idx)}
                      style={{ padding: '0.2rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentStep(3)}
            >
              <span>Continue to Review</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review */}
      {currentStep === 3 && (
        <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">03. Review & Create</h2>
              <p className="card-subtitle">Confirm details before launching your assistant</p>
            </div>
          </div>

          {/* Summary Box */}
          <div 
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <div className="flex items-center gap-3" style={{ marginBottom: '1.25rem' }}>
              <div 
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-soft-surface)',
                  border: '1px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}
              >
                {formData.avatar}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formData.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formData.businessName} • {formData.industryName}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
              <strong>Description:</strong> {formData.description}
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Configured Knowledge Base ({formData.uploadedFiles.length + (formData.websiteUrl ? 1 : 0) + formData.optionalLinks.length} items):
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {formData.websiteUrl && <li>Website: <strong>{formData.websiteUrl}</strong></li>}
                {formData.uploadedFiles.map((f, i) => (
                  <li key={i}>Document: <strong>{f.name}</strong> ({f.size})</li>
                ))}
                {formData.optionalLinks.map((l, i) => (
                  <li key={i}>Link: {l}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-between">
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentStep(2)}
              disabled={loading}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-lg"
              onClick={handleFinalCreate}
              disabled={loading}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Creating Assistant...' : 'Create Assistant'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
