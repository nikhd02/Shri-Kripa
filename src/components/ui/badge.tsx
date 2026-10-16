/**
 * src/components/ui/badge.tsx
 * Badge component for status labels (pure CSS, no Radix dependency).
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none border',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent shadow-2xs',
        secondary:
          'bg-[var(--color-muted)] text-[var(--color-text-primary)] border-[var(--color-border)]',
        outline:
          'border-[var(--color-border-strong)] text-[var(--color-text-primary)] bg-white/80',
        accent:
          'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] border-transparent font-bold shadow-2xs',
        success:
          'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/25',
        warning:
          'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/25',
        error:
          'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]/25',
        info:
          'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
