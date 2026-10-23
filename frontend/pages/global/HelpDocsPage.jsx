import React from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Share2, 
  Sparkles, 
  MessageSquare, 
  ExternalLink 
} from 'lucide-react';

export const HelpDocsPage = () => {
  return (
    <div className="page-container" style={{ maxWidth: '880px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Help & Documentation
          </h1>
          <p className="page-description">
            Quick guides on configuring knowledge bases, managing customer inquiries, and deploying assistants.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-start gap-3">
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-soft-surface)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. Connecting Knowledge Sources
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.55 }}>
                Add your project website URLs or upload PDF brochures. The assistant indexes the text so it can answer specific questions regarding unit sizes, amenities, RERA numbers, and pricing without guesswork.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-start gap-3">
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-soft-surface)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Sharing & Embedding
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.55 }}>
                Use the direct shareable link for email campaigns or social media. For your website, copy the one-line embed script and paste it into your website template.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-start gap-3">
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-soft-surface)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                3. Reviewing Customer Conversations
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.55 }}>
                All customer sessions are recorded in the Conversations tab. Review scheduled site visits, visitor phone numbers, and download full transcript logs whenever needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
