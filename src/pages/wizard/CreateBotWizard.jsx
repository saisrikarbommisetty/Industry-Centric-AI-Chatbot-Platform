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
  Sparkles, 
  Sliders, 
  MessageSquare, 
  Shield, 
  Play, 
  Trash2,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { INDUSTRIES, PRYCOONS_PROJECTS } from '../../data/mockData';

export const CreateBotWizard = () => {
  const navigate = useNavigate();
  const { createBot, addToast } = usePlatform();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State across steps
  const [formData, setFormData] = useState({
    name: 'Prycoons Luxury Advisory Bot',
    avatar: '🏙️',
    industryId: 'real-estate',
    industryName: 'Real Estate & Infrastructure',
    subNiche: 'Luxury High-Rise & NRI Investments',
    description: 'Autonomous property advisor assisting prospective buyers with 2/3/4 BHK floor plans, RERA approvals, and site visits.',
    primaryGoal: 'lead-generation',
    primaryColor: '#3b82f6',
    
    // Step 2: Knowledge Sources
    websiteUrl: 'https://prycoons.com',
    crawledPages: [
      { url: 'https://prycoons.com/projects/the-sovereign', title: 'The Sovereign Sky Villas (4 & 5 BHK)', status: 'ready', chunks: 28 },
      { url: 'https://prycoons.com/projects/gift-horizon', title: 'GIFT Horizon Towers Smart Homes', status: 'ready', chunks: 22 },
      { url: 'https://prycoons.com/projects/emerald-heights', title: 'Emerald Heights 3 BHK Living', status: 'ready', chunks: 18 }
    ],
    uploadedFiles: [
      { name: 'Prycoons_Master_Brochure_2026.pdf', size: '4.8 MB', chunks: 36, type: 'pdf' },
      { name: 'GIFT_City_NRI_Tax_Benefits.pdf', size: '2.1 MB', chunks: 19, type: 'pdf' }
    ],
    faqs: [
      { q: 'What are the possession dates for Emerald Heights?', a: 'Possession is scheduled for March 2027 with AUDA and RERA approvals.' },
      { q: 'Is financing available with major banks?', a: 'Yes, pre-approved home loans are offered via SBI, HDFC, and ICICI Bank.' }
    ],

    // Step 3: Persona & Prompt
    tone: 'Consultative, Professional & Prestigious',
    welcomeMessage: 'Hello and welcome to Prycoons Real Estate! 🏙️ How can I assist your luxury home or commercial investment search today?',
    promptGuidelines: 'Provide exact BHK carpet area, pricing ranges, amenities, and RERA registration numbers. Proactively encourage scheduling an on-site visit or private video tour.',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email', 'preferredBhk', 'budget'],
    suggestedQuestions: [
      'Show me 3 BHK options in Ahmedabad',
      'What are the details of The Sovereign Sky Villas?',
      'Tell me about GIFT City residential projects',
      'Schedule a weekend site visit'
    ]
  });

  // Step 4 Mini-chat simulation state
  const [testMessages, setTestMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your newly configured AI assistant. Send me a message to preview my responses before deployment.' }
  ]);
  const [testInput, setTestInput] = useState('');

  // Handle Industry Change & auto-populate relevant defaults
  const handleIndustrySelect = (ind) => {
    let defaultName = `${ind.name.split(' ')[0]} AI Assistant`;
    let defaultAvatar = '🤖';
    let defaultWelcome = `Hello! Welcome to our ${ind.name} service. How can I assist you?`;

    if (ind.id === 'real-estate') {
      defaultAvatar = '🏢';
      defaultName = 'Prycoons Property Concierge';
      defaultWelcome = 'Welcome to Prycoons! Are you exploring residential luxury apartments or commercial office investments?';
    } else if (ind.id === 'education') {
      defaultAvatar = '🎓';
      defaultName = 'EduNova Admissions AI';
      defaultWelcome = 'Welcome to EduNova! How can I help with admissions, scholarships, and degree programs?';
    } else if (ind.id === 'healthcare') {
      defaultAvatar = '🩺';
      defaultName = 'CarePoint Health Navigator';
      defaultWelcome = 'Hello, how may I assist you with clinic appointments, doctor schedules, or department guidance?';
    } else if (ind.id === 'hospitality') {
      defaultAvatar = '🛎️';
      defaultName = 'LuxeStay Hotel Concierge';
      defaultWelcome = 'Welcome to LuxeStay. How can I assist with suite bookings and dining reservations?';
    }

    setFormData((prev) => ({
      ...prev,
      industryId: ind.id,
      industryName: ind.name,
      name: defaultName,
      avatar: defaultAvatar,
      welcomeMessage: defaultWelcome
    }));
  };

  // Mock Upload Handler
  const handleSimulateFileUpload = () => {
    const mockFile = {
      name: `Document_Specs_${Date.now().toString().slice(-4)}.pdf`,
      size: '2.4 MB',
      chunks: 24,
      type: 'pdf'
    };
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, mockFile]
    }));
    addToast(`Uploaded and parsed ${mockFile.name} (24 vector chunks)`, 'success');
  };

  // Mock URL Crawl Handler
  const handleSimulateCrawl = () => {
    if (!formData.websiteUrl) return;
    addToast(`Crawling ${formData.websiteUrl}... Discovered 3 pages`, 'info');
  };

  // Send Test Message in Step 4 Sandbox
  const handleSendTestMessage = (e) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const userMsg = testInput;
    setTestMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setTestInput('');

    setTimeout(() => {
      let botReply = `Thank you for your question regarding "${userMsg}". `;
      if (formData.industryId === 'real-estate') {
        botReply += `Based on our indexed project database for Prycoons, we offer premium 2/3/4 BHK residences starting at ₹95 Lakhs up to ₹8.5 Cr with verified RERA documentation.`;
      } else {
        botReply += `I am trained on your uploaded documents and website sources to assist visitors accurately.`;
      }
      setTestMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 450);
  };

  // Final Deploy
  const handleCreateBot = () => {
    setLoading(true);
    setTimeout(() => {
      const newBot = createBot({
        name: formData.name,
        avatar: formData.avatar,
        industryId: formData.industryId,
        industryName: formData.industryName,
        description: formData.description,
        tone: formData.tone,
        welcomeMessage: formData.welcomeMessage,
        promptGuidelines: formData.promptGuidelines,
        leadCaptureEnabled: formData.leadCaptureEnabled,
        leadCaptureFields: formData.leadCaptureFields,
        primaryColor: formData.primaryColor,
        suggestedQuestions: formData.suggestedQuestions,
        initialSources: [
          ...formData.uploadedFiles.map((f) => ({ title: f.name, size: f.size, chunks: f.chunks, type: 'pdf' })),
          ...formData.crawledPages.map((p) => ({ title: p.title, url: p.url, chunks: p.chunks, type: 'url' }))
        ]
      });
      setLoading(false);
      navigate(`/bots/create/success/${newBot.id}`);
    }, 800);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      {/* Wizard Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Bot Creation Studio</span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create New Industry AI Assistant</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Configure, ingest domain knowledge, and deploy domain-tuned conversational AI in 4 steps.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div 
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {[
          { num: 1, title: 'Basic Info & Industry' },
          { num: 2, title: 'Knowledge Sources' },
          { num: 3, title: 'Persona & Instructions' },
          { num: 4, title: 'Review & Sandbox Test' }
        ].map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          return (
            <div 
              key={step.num}
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => {
                if (step.num < currentStep) setCurrentStep(step.num);
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: isDone ? 'var(--accent-emerald)' : isCurrent ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: isDone || isCurrent ? '#ffffff' : 'var(--text-muted)',
                  border: isCurrent ? '2px solid var(--primary-border)' : '1px solid var(--border-subtle)',
                  boxShadow: isCurrent ? 'var(--shadow-glow)' : 'none'
                }}
              >
                {isDone ? <Check size={16} /> : step.num}
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        {/* STEP 1: Basic Info & Industry Selector */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Step 1: Select Industry & Basic Information
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Choose the target industry vertical to pre-configure appropriate conversational personas and extraction schemas.
              </p>
            </div>

            {/* Industry Cards Grid */}
            <div className="form-group">
              <label className="form-label">Select Industry Vertical</label>
              <div className="grid-3" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                {INDUSTRIES.map((ind) => {
                  const isSelected = formData.industryId === ind.id;
                  return (
                    <div
                      key={ind.id}
                      className="card card-interactive"
                      style={{
                        padding: '1rem',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                        boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.25)' : 'none'
                      }}
                      onClick={() => handleIndustrySelect(ind)}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>
                          {ind.id === 'real-estate' && '🏢'}
                          {ind.id === 'education' && '🎓'}
                          {ind.id === 'healthcare' && '🩺'}
                          {ind.id === 'hospitality' && '🛎️'}
                          {ind.id === 'ecommerce' && '🛍️'}
                          {ind.id === 'legal' && '⚖️'}
                        </span>
                        {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {ind.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ind.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Assistant Name <span className="label-required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Prycoons Property Advisor"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Emoji / Icon</label>
                <div className="flex items-center gap-2">
                  <div 
                    style={{
                      width: '42px',
                      height: '42px',
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
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Type any emoji</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Domain Sub-Niche / Focus Area</label>
              <input
                type="text"
                className="form-input"
                value={formData.subNiche}
                onChange={(e) => setFormData({ ...formData, subNiche: e.target.value })}
                placeholder="e.g. Luxury 3/4 BHK Residential & Commercial SG Highway"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assistant Purpose & Description</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this AI assistant will do for visitors..."
              />
            </div>
          </div>
        )}

        {/* STEP 2: Knowledge Sources Hub */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Step 2: Connect Knowledge Sources & Ingestion Hub
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Ingest websites, PDF brochures, floor plans, and custom QA pairs to ground the AI in your domain facts.
              </p>
            </div>

            {/* Website Crawler Input */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <Globe size={16} style={{ color: 'var(--primary)' }} />
                  Crawl Website or Documentation URL
                </span>
                <span className="label-hint">Live simulated crawler</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://yourwebsite.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
                <button type="button" className="btn btn-secondary" onClick={handleSimulateCrawl}>
                  Crawl Pages
                </button>
              </div>

              {/* Crawled Subpages List */}
              <div className="flex flex-col gap-1.5" style={{ marginTop: '0.75rem' }}>
                {formData.crawledPages.map((page, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between"
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{page.chunks} Chunks</span>
                      <span style={{ fontWeight: 600 }}>{page.title}</span>
                      <span className="text-muted truncate">({page.url})</span>
                    </div>
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Document Upload Dropzone */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <UploadCloud size={16} style={{ color: 'var(--accent-purple)' }} />
                  Upload PDF Brochures, Specifications, Price Sheets
                </span>
              </label>

              <div
                style={{
                  border: '2px dashed var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  textAlign: 'center',
                  background: 'var(--bg-surface-elevated)',
                  cursor: 'pointer'
                }}
                onClick={handleSimulateFileUpload}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <UploadCloud size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Click to simulate uploading PDF / DOCX / CSV
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Supports real-estate project brochures, RERA disclosures, master plans up to 50MB
                </div>
              </div>

              {/* Uploaded Files Table */}
              <div className="flex flex-col gap-1.5" style={{ marginTop: '0.75rem' }}>
                {formData.uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between"
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600 }}>{file.name}</span>
                      <span className="text-muted">({file.size})</span>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{file.chunks} Chunks Vectorized</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-icon text-danger"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== idx)
                        }));
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI Persona, Tone & Lead Capture Form */}
        {currentStep === 3 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Step 3: Persona, Instructions & Lead Capture Setup
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Fine-tune the tone of voice, welcome greetings, and configure automatic lead qualification parameters.
              </p>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Conversational Tone</label>
                <select
                  className="form-select"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                >
                  <option value="Consultative, Professional & Prestigious">Consultative, Professional & Prestigious (Recommended for Real Estate)</option>
                  <option value="Friendly, Warm & Empathetic">Friendly, Warm & Empathetic</option>
                  <option value="Academic, Instructive & Precise">Academic, Instructive & Precise</option>
                  <option value="Luxury Concierge & Attentive">Luxury Concierge & Attentive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ width: '42px', height: '40px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Welcome Message (First Greeting)</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">System Prompt & Domain Guidelines</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={formData.promptGuidelines}
                onChange={(e) => setFormData({ ...formData, promptGuidelines: e.target.value })}
              />
            </div>

            {/* Lead Capture Configuration */}
            <div 
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem'
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Autonomous Lead Capture Trigger
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Automatically prompt visitors to leave contact details when high-intent questions (e.g. site visits, pricing) are detected.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={formData.leadCaptureEnabled}
                    onChange={(e) => setFormData({ ...formData, leadCaptureEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {formData.leadCaptureEnabled && (
                <div className="flex flex-wrap gap-2" style={{ marginTop: '0.75rem' }}>
                  {['Visitor Name', 'Phone Number', 'Email Address', 'Preferred BHK (2/3/4/5)', 'Budget Range', 'Site Visit Date'].map((field, i) => (
                    <span key={i} className="badge badge-success flex items-center gap-1" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                      <Check size={12} />
                      {field}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Live Sandbox Test */}
        {currentStep === 4 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Step 4: Review Configuration & Test Live Sandbox
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Verify all knowledge vectors and test live conversational responses in the preview sandbox before deployment.
              </p>
            </div>

            <div className="grid-2" style={{ gap: '1.5rem' }}>
              {/* Summary Review Card */}
              <div className="flex flex-col gap-3">
                <div 
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem'
                  }}
                >
                  <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>{formData.avatar}</div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formData.name}</h4>
                      <span className="badge badge-primary">{formData.industryName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2" style={{ fontSize: '0.825rem' }}>
                    <div><strong>Tone:</strong> {formData.tone}</div>
                    <div><strong>Focus:</strong> {formData.subNiche}</div>
                    <div><strong>Sources:</strong> {formData.uploadedFiles.length} PDF documents, {formData.crawledPages.length} Web pages ({formData.uploadedFiles.reduce((a, b) => a + b.chunks, 0) + formData.crawledPages.reduce((a, b) => a + b.chunks, 0)} Total Vector Chunks)</div>
                    <div><strong>Lead Capture:</strong> {formData.leadCaptureEnabled ? 'Enabled (Instant Webhooks)' : 'Disabled'}</div>
                  </div>
                </div>

                <div 
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: '#34d399'
                  }}
                >
                  <div className="flex items-center gap-1.5" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                    <Zap size={15} />
                    Ready for Instant Deployment
                  </div>
                  Knowledge vectors are compiled and validated. Once deployed, a public shareable URL and embed snippet will be generated.
                </div>
              </div>

              {/* Live Sandbox Mini-Chat */}
              <div 
                style={{
                  height: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Play size={14} style={{ color: 'var(--accent-emerald)' }} />
                  Live Sandbox Preview
                </div>

                {/* Messages stream */}
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {testMessages.map((msg, i) => (
                    <div key={i} className={`message-row ${msg.sender}`}>
                      <div className="message-bubble" style={{ fontSize: '0.8rem', padding: '0.65rem 0.85rem' }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick suggestions */}
                <div className="suggestion-pills-bar" style={{ padding: '0.35rem 0.75rem' }}>
                  <button 
                    type="button"
                    className="suggestion-pill" 
                    onClick={() => {
                      setTestInput('Show me 3BHK options');
                    }}
                  >
                    3 BHK Options?
                  </button>
                  <button 
                    type="button"
                    className="suggestion-pill" 
                    onClick={() => {
                      setTestInput('Tell me about The Sovereign');
                    }}
                  >
                    The Sovereign?
                  </button>
                </div>

                {/* Input form */}
                <form onSubmit={handleSendTestMessage} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-surface-elevated)', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type a test message..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div 
          className="flex items-center justify-between"
          style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/bots')}
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCurrentStep((prev) => prev + 1)}
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={loading}
              onClick={handleCreateBot}
              style={{ background: 'var(--grad-primary)', border: 'none' }}
            >
              {loading ? (
                'Deploying AI Assistant...'
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Deploy & Launch Assistant</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
