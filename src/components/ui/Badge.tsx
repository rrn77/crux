import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'terracotta' | 'moss' | 'neutral' | 'outline' | 'warning';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1 font-semibold rounded-full select-none';

  const variants = {
    terracotta: 'bg-terracotta-100 text-terracotta-800 dark:bg-terracotta-900/40 dark:text-terracotta-300',
    moss: 'bg-moss-100 text-moss-800 dark:bg-moss-900/40 dark:text-moss-300',
    neutral: 'bg-chalk-200 text-graphite-800 dark:bg-graphite-800 dark:text-graphite-200',
    outline: 'border border-chalk-300 dark:border-graphite-700 text-graphite-700 dark:text-graphite-300',
    warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
}
