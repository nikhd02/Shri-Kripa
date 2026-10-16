/**
 * src/components/ui/button.tsx
 * Reusable Button component using class-variance-authority.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-light)] active:bg-[var(--color-primary-dark)] shadow-sm font-semibold',
        outline:
          'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] font-semibold',
        ghost:
          'text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)]/10 font-medium',
        accent:
          'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-light)] active:bg-[var(--color-accent-dark)] shadow-sm font-bold',
        destructive:
          'bg-[var(--color-error)] text-white hover:bg-red-800 shadow-sm font-semibold',
        link:
          'text-[var(--color-primary)] underline-offset-4 hover:underline hover:text-[var(--color-primary-light)] p-0 h-auto font-medium',
        secondary:
          'bg-[var(--color-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-muted-dark)] border border-[var(--color-border)] font-semibold',
      },
      size: {
        sm:   'h-8 px-3 text-xs',
        md:   'h-10 px-4 py-2',
        lg:   'h-12 px-8 text-base',
        xl:   'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
