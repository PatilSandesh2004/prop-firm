import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '../../../context/NavigationContext';

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
  const { isAuthenticated } = useAuth();
  const { navigate, openAuth } = useNavigation();
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;
  const combinedClass = `btn ${variantClass} ${sizeClass} ${className}`;

  if (isSimulatorLaunch) {
    // The terminal now lives inside this same app -- launching it means
    // switching to the 'terminal' page (if already signed in) or opening
    // the sign-in modal (if not), never navigating to an external URL.
    const handleLaunch = (event) => {
      event.preventDefault();
      onClick?.(event);
      if (isAuthenticated) {
        navigate('terminal');
      } else {
        openAuth('login');
      }
    };
    return (
      <a
        href="#terminal"
        className={combinedClass}
        onClick={handleLaunch}
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
