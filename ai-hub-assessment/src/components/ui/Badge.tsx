import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, className = '', ...props }) => {
  return (
    <span className={`badge-container badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
};
