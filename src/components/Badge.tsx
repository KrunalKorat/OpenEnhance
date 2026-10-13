import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-bg-elevated text-text-secondary border-border-subtle',
    success: 'bg-status-success/15 text-status-success border-status-success/30',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    error: 'bg-status-error/15 text-status-error border-status-error/30',
    accent: 'bg-accent-primary/15 text-accent-primary border-accent-primary/30',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
