import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-semibold uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={generatedId}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150',
              'bg-chalk-100 dark:bg-graphite-800 text-graphite-900 dark:text-graphite-100',
              'border border-chalk-300 dark:border-graphite-700',
              'focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta',
              'placeholder:text-graphite-400 dark:placeholder:text-graphite-500 min-h-[44px]',
              error && 'border-red-500 focus:ring-red-500/40 focus:border-red-500',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-graphite-500 dark:text-graphite-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
