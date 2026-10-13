import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, children, elevated, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-panel border border-border-subtle p-5 transition-colors',
          elevated ? 'bg-bg-elevated' : 'bg-bg-surface',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
