import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-terracotta select-none';

    const variants = {
      primary: 'bg-terracotta hover:bg-terracotta-600 active:bg-terracotta-700 text-white shadow-sm',
      secondary: 'bg-chalk-200 dark:bg-graphite-800 hover:bg-chalk-300 dark:hover:bg-graphite-700 text-graphite-900 dark:text-graphite-100',
      success: 'bg-moss hover:bg-moss-600 active:bg-moss-700 text-white shadow-sm',
      outline: 'border-2 border-chalk-300 dark:border-graphite-700 hover:bg-chalk-100 dark:hover:bg-graphite-800 text-graphite-800 dark:text-graphite-200',
      ghost: 'hover:bg-chalk-200/60 dark:hover:bg-graphite-800/60 text-graphite-700 dark:text-graphite-300',
      danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px]',
      md: 'text-sm px-4 py-2.5 min-h-[44px]',
      lg: 'text-base px-6 py-3 min-h-[50px]',
      xl: 'text-lg px-8 py-4 min-h-[58px] font-semibold tracking-wide',
      icon: 'p-2.5 min-h-[44px] min-w-[44px]',
    };

    return (
      <button
        ref={ref}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className))}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
