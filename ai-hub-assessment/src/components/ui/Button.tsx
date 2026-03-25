import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  let btnClass = 'btn-primary';
  if (variant === 'secondary' || variant === 'ghost') {
    btnClass = 'btn-secondary';
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5',
    lg: 'px-8 py-3.5 text-lg'
  };

  return (
    <button className={`${btnClass} ${sizeClasses[size]} ${className}`} {...props}>
      <span>{children}</span>
    </button>
  );
};
