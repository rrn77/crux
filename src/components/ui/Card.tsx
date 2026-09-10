import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  activeBorder?: boolean;
}

export function Card({
  className,
  hoverable = false,
  activeBorder = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white dark:bg-graphite-900 border border-chalk-300 dark:border-graphite-800 rounded-2xl p-4 shadow-sm transition-all duration-150',
          hoverable && 'hover:border-chalk-400 dark:hover:border-graphite-700 cursor-pointer active:scale-[0.99]',
          activeBorder && 'border-terracotta dark:border-terracotta ring-1 ring-terracotta/30',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
