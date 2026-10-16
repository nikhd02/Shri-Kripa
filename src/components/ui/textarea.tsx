/**
 * src/components/ui/textarea.tsx
 * Reusable Textarea component styled with design tokens.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--color-error)]" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-[var(--color-surface)] px-3 py-2 text-sm font-medium',
            'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-primary)]',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="text-xs font-medium text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
