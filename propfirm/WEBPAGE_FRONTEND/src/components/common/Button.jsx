import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { TRADING_APP_URL } from '../../config/navigation';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  isSimulatorLaunch = false,
  target,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;
  const combinedClass = `btn ${variantClass} ${sizeClass} ${className}`;

  if (isSimulatorLaunch) {
    const destination = href || TRADING_APP_URL;
    return (
      <a
        href={destination}
        target={target || '_blank'}
        rel="noopener noreferrer"
        className={combinedClass}
        onClick={onClick}
        id="cta-trader-room"
        {...props}
      >
        {Icon ? <Icon size={size === 'lg' ? 18 : 16} /> : null}
        <span>{children || 'TRADER ROOM'}</span>
        <ArrowUpRight size={size === 'lg' ? 17 : 15} style={{ opacity: 0.85 }} />
      </a>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        className={combinedClass}
        onClick={onClick}
        {...props}
      >
        {Icon && <Icon size={size === 'lg' ? 18 : 16} />}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button type="button" className={combinedClass} onClick={onClick} {...props}>
      {Icon && <Icon size={size === 'lg' ? 18 : 16} />}
      <span>{children}</span>
    </button>
  );
}
