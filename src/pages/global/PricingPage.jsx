import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PRICING_PLANS } from '../../data/mockData';

export const PricingPage = () => {
  const { currentUser, upgradePlan, addToast } = usePlatform();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [upgradeModalPlan, setUpgradeModalPlan] = useState(null);

  const handleSelectPlan = (plan) => {
    if (currentUser.plan.toLowerCase().includes(plan.id)) {
      addToast(`You are currently on the ${plan.name}`, 'info');
      return;
    }
    setUpgradeModalPlan(plan);
  };

  const handleConfirmUpgrade = () => {
    if (upgradeModalPlan) {
      upgradePlan(upgradeModalPlan.id);
      setUpgradeModalPlan(null);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Scalable Infrastructure</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Simple, Transparent Enterprise Plans</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0.4rem auto 1.5rem' }}>
          Deploy autonomous domain AI assistants for your organization with predictable conversation and vector volume pricing.
        </p>

        {/* Monthly / Annual Billing Switch */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-surface-elevated)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            gap: '0.25rem'
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem' }}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`btn btn-sm ${billingCycle === 'annual' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem' }}
            onClick={() => setBillingCycle('annual')}
          >
            <span>Annual (Save 20%)</span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>-20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
        {PRICING_PLANS.map((plan) => {
          const isCurrent = currentUser.plan.toLowerCase().includes(plan.id);
          const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className="card flex flex-col justify-between"
              style={{
                borderRadius: 'var(--radius-xl)',
                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                background: plan.popular 
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.12) 0%, var(--bg-surface) 100%)' 
                  : 'var(--bg-card)',
                boxShadow: plan.popular ? 'var(--shadow-lg)' : 'none',
                padding: '2rem 1.5rem',
                position: 'relative'
              }}
            >
              {plan.popular && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--grad-primary)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  MOST POPULAR FOR DEVELOPERS
                </div>
              )}

              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{plan.name}</h3>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{plan.badge}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', minHeight: '38px' }}>
                  {plan.description}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: 'var(--text-primary)' }}>
                    ${price}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    / month {billingCycle === 'annual' ? '(billed yearly)' : ''}
                  </span>
                </div>

                {/* Feature Checklist */}
                <div className="flex flex-col gap-2.5" style={{ marginBottom: '1.75rem' }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5" style={{ fontSize: '0.825rem' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className={`btn w-full ${isCurrent ? 'btn-secondary' : plan.popular ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'center' }}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan)}
              >
                {isCurrent ? 'Current Active Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Detailed Feature Comparison Matrix
        </h3>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature Capability</th>
                <th>Starter Plan</th>
                <th>Growth Pro</th>
                <th>Enterprise Ultra</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Active AI Assistants</td>
                <td>1 Bot</td>
                <td>5 Bots</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Monthly Conversations</td>
                <td>1,500 / mo</td>
                <td>10,000 / mo</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>RAG Vector Storage</td>
                <td>500 Chunks</td>
                <td>5,000 Chunks</td>
                <td>50,000+ Chunks</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Real-Estate Property Cards</td>
                <td>Basic Text</td>
                <td>Interactive Rich Cards</td>
                <td>Custom Interactive 3D & Tours</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Lead Webhooks & CRM Sync</td>
                <td>Email Digest</td>
                <td>Real-time Webhook POST</td>
                <td>Salesforce & HubSpot Native Sync</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Support SLA</td>
                <td>Community</td>
                <td>24/7 Priority Email</td>
                <td>Dedicated Account Engineer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Upgrade Confirmation Modal */}
      {upgradeModalPlan && (
        <div className="modal-overlay" onClick={() => setUpgradeModalPlan(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                Upgrade Subscription to {upgradeModalPlan.name}
              </h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setUpgradeModalPlan(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontWeight: 600 }}>Selected Plan:</span>
                  <span className="badge badge-primary">{upgradeModalPlan.name}</span>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Price ({billingCycle}):</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>${billingCycle === 'annual' ? upgradeModalPlan.priceAnnual : upgradeModalPlan.priceMonthly} / mo</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Upgrading unlocks additional active industry chatbots, increased RAG vector quotas, and priority webhook routing immediately.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setUpgradeModalPlan(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmUpgrade}>
                Confirm & Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
