import React, { useState } from 'react';

// Crisp Responsive SVG Area & Line Chart for Daily Volume & Leads
export const VolumeAreaChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => d.total), 250);
  const width = 500;
  const height = 180;
  const paddingX = 35;
  const paddingY = 25;

  const getX = (index) => paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
  const getY = (val) => height - paddingY - (val / maxTotal) * (height - 2 * paddingY);

  const totalPoints = data.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');
  const leadsPoints = data.map((d, i) => `${getX(i)},${getY(d.leads)}`).join(' ');

  const totalArea = `${getX(0)},${height - paddingY} ${totalPoints} ${getX(data.length - 1)},${height - paddingY}`;
  const leadsArea = `${getX(0)},${height - paddingY} ${leadsPoints} ${getX(data.length - 1)},${height - paddingY}`;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
        <div className="flex items-center gap-4" style={{ fontSize: '0.78rem' }}>
          <div className="flex items-center gap-2">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
            <span className="text-secondary">Total Conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
            <span className="text-secondary">Qualified Leads Captured</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - paddingY - ratio * (height - 2 * paddingY);
          return (
            <line
              key={i}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--border-subtle)"
              strokeDasharray="3,3"
            />
          );
        })}

        {/* Areas */}
        <polygon points={totalArea} fill="url(#totalGrad)" />
        <polygon points={leadsArea} fill="url(#leadsGrad)" />

        {/* Lines */}
        <polyline points={totalPoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={leadsPoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & Labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const yTotal = getY(d.total);
          const yLeads = getY(d.leads);
          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={yTotal} r={hoveredIdx === i ? 5 : 3.5} fill="#3b82f6" stroke="var(--bg-surface)" strokeWidth="2" />
              <circle cx={x} cy={yLeads} r={hoveredIdx === i ? 4.5 : 3} fill="#10b981" stroke="var(--bg-surface)" strokeWidth="2" />
              <text x={x} y={height - 6} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                {d.date}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: `${(hoveredIdx / (data.length - 1)) * 75 + 10}%`,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.6rem',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            zIndex: 10,
            fontSize: '0.75rem'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {data[hoveredIdx].date}
          </div>
          <div style={{ color: '#60a5fa' }}>Chats: {data[hoveredIdx].total}</div>
          <div style={{ color: '#34d399' }}>Leads: {data[hoveredIdx].leads}</div>
        </div>
      )}
    </div>
  );
};

// Distribution Horizontal Bar Chart
export const BhkBarChart = ({ distribution = [] }) => {
  return (
    <div className="flex flex-col gap-3" style={{ width: '100%' }}>
      {distribution.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <div className="flex items-center justify-between" style={{ fontSize: '0.8rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {item.count} inquiries ({item.percentage}%)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${item.percentage}%`,
                height: '100%',
                backgroundColor: item.color || 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// SVG Sentiment Donut Chart
export const SentimentDonutChart = ({ items = [] }) => {
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6" style={{ width: '100%' }}>
      <div style={{ width: '120px', height: '120px', position: 'relative', flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {items.map((item, index) => {
            const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
            const strokeDashoffset = -cumulativePercent;
            cumulativePercent += item.percentage;

            return (
              <circle
                key={index}
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="transparent"
                stroke={item.color}
                strokeWidth="3.8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>97%</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Positive</span>
        </div>
      </div>

      <div className="flex flex-col gap-2" style={{ flex: 1 }}>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between" style={{ fontSize: '0.8rem' }}>
            <div className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
              <span className="text-secondary">{item.sentiment}</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hourly Heatmap Load Grid
export const HourlyHeatmap = ({ heatmap = [] }) => {
  return (
    <div className="grid-4" style={{ gap: '0.5rem' }}>
      {heatmap.map((item, idx) => {
        const opacity = item.load / 100;
        return (
          <div
            key={idx}
            style={{
              padding: '0.6rem',
              borderRadius: 'var(--radius-md)',
              background: `rgba(59, 130, 246, ${Math.max(0.12, opacity * 0.8)})`,
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.hour}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: opacity > 0.6 ? '#ffffff' : 'var(--text-primary)' }}>
              {item.load}% Peak
            </div>
          </div>
        );
      })}
    </div>
  );
};
