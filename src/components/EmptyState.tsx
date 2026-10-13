import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-card border border-dashed border-border-subtle p-10 flex flex-col items-center justify-center text-center bg-bg-surface/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
