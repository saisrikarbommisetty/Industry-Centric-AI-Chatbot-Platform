import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  X
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { PRICING_PLANS } from '../../data/mockData';

export const PricingPage = () => {
  const { currentUser, upgradePlan, addToast } = usePlatform();
  const [billingCycle, setBillingCycle] = useState('monthly');
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
    <div className="page-container" style={{ maxWidth: '1060px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.6rem' }}>BRIM Workspace Plans</span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Simple, Transparent Pricing</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0.4rem auto 1.5rem' }}>
          Select the subscription tier that matches your customer conversation volume.
        </p>

        {/* Monthly / Annual Switch */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-surface-elevated)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            gap: '0.25rem'
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem' }}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`btn btn-sm ${billingCycle === 'annual' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem' }}
            onClick={() => setBillingCycle('annual')}
          >
            <span>Annual (Save 20%)</span>
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
                backgroundColor: '#FFFFFF',
                boxShadow: plan.popular ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                padding: '2rem 1.75rem',
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
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.name}</h2>
                  <span className={`badge ${plan.popular ? 'badge-primary' : 'badge-neutral'}`}>
                    {plan.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', minHeight: '38px' }}>
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1" style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    ${price}
                  </span>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>

                <div className="flex flex-col gap-2.5" style={{ marginBottom: '2rem' }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5" style={{ fontSize: '0.825rem' }}>
                      <Check size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={`btn w-full btn-lg ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center' }}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan)}
              >
                {isCurrent ? 'Current Subscription' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Upgrade Modal */}
      {upgradeModalPlan && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="card-title">Confirm Plan Change</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setUpgradeModalPlan(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Are you sure you want to switch your workspace to <strong>{upgradeModalPlan.name}</strong> (${billingCycle === 'annual' ? upgradeModalPlan.priceAnnual : upgradeModalPlan.priceMonthly}/mo)?
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setUpgradeModalPlan(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmUpgrade}>
                Confirm Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
