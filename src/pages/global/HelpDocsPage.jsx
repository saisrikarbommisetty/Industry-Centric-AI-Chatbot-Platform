import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  HeartPulse, 
  ExternalLink 
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

export const HelpDocsPage = () => {
  const { addToast } = usePlatform();
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'How does the Real Estate (Prycoons) RAG knowledge grounding work?',
      a: 'The platform ingests project brochures, master layouts, price sheets, and RERA registration documents into high-dimensional vector chunks. When a user asks about 2/3/4 BHK properties, price ranges, or amenities, the model matches against exact chunk embeddings and generates factually verified answers with source citations.'
    },
    {
      q: 'How does autonomous lead capture work during conversations?',
      a: 'When high-intent buyer behaviors (such as asking for a site visit, downloading brochures, or requesting custom pricing) are detected, the chatbot triggers an inline VIP Consultation form to collect their contact details, which are automatically posted to your CRM webhook.'
    },
    {
      q: 'Can I embed the chatbot on an existing WordPress, Next.js, or Webflow website?',
      a: 'Yes. Simply copy the lightweight 1-line `<script>` tag from the Share & Embed tab and paste it into your website header or footer. It renders a modern, responsive floating widget that inherits your brand color.'
    },
    {
      q: 'How do I add or update project brochures and pricing sheets?',
      a: 'Navigate to the bot\'s "Knowledge Base" tab, click "Add Knowledge Source", and upload your latest PDF documents or URL links. The system vectorizes the new files within seconds without taking your bot offline.'
    }
  ];

  return (
    <div className="page-container" style={{ maxWidth: '950px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <HelpCircle size={24} style={{ color: 'var(--primary)' }} />
            Documentation & Industry Blueprints
          </h1>
          <p className="page-description">
            Comprehensive guides on orchestrating domain-aware AI chatbots across Real Estate, Healthcare, Education, and Hospitality.
          </p>
        </div>
      </div>

      {/* Flagship Case Study Architecture Guide */}
      <div 
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          marginBottom: '2rem'
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
          <span className="badge badge-primary">Flagship Blueprint</span>
          <span className="badge badge-success">Prycoons Real Estate</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Real Estate Conversational Intelligence Architecture
        </h2>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Real estate customer journeys require high trust, exact specification accuracy, and rapid VIP consultation scheduling. The Prycoons blueprint establishes 4 pillars:
        </p>

        <div className="grid-2" style={{ gap: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              1. Exact BHK & Carpet Area Disclosures
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Grounds unit specifications (e.g. 1,950 sq.ft for 3 BHK vs 6,800 sq.ft for Sky Villas) with verified RERA registration numbers.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              2. Interactive Property Feature Cards
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Attaches rich cards with high-res property images, price ranges, location tags, and direct brochure download triggers.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              3. NRI & GIFT City Investment Advisory
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Explains tax exemptions, projected rental yields (6.8%–7.5%), and remote Zoom consultation booking for international buyers.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              4. High-Intent Lead Qualification
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Captures visitor requirements (preferred budget, timeline, site visit date) and dispatches real-time webhooks to property managers.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Frequently Asked Questions & Architecture
        </h3>

        <div className="flex flex-col gap-2.5">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  style={{ padding: '1rem 1.25rem' }}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {item.q}
                  </span>
                  {isOpen ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
                </div>

                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
