import React from 'react';

export default function Badge({ children, variant = 'neutral', icon: Icon, className = '' }) {
  const variantClass = {
    live: 'badge-live',
    coming: 'badge-coming',
    cyan: 'badge-cyan',
    neutral: 'badge-neutral',
  }[variant] || 'badge-neutral';

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {variant === 'live' && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
}
