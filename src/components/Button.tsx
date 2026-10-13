import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', disabled, children, ...props },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-control focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    const variantStyles = {
      primary:
        'bg-accent-primary text-white hover:bg-accent-primary-hover active:scale-[0.98]',
      secondary:
        'bg-bg-elevated text-text-primary hover:bg-bg-surface border border-border-subtle active:scale-[0.98]',
      outline:
        'border border-border-subtle text-text-primary hover:bg-bg-elevated active:scale-[0.98]',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-[0.98]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
