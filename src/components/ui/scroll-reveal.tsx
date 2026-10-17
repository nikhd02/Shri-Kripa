/**
 * src/components/ui/scroll-reveal.tsx
 * Scroll-triggered entrance animation wrapper.
 * Respects prefers-reduced-motion.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useInView } from './use-in-view';

type RevealVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'fade-in';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
  threshold?: number;
  as?: 'div' | 'section' | 'article' | 'span';
}

const variantClasses: Record<RevealVariant, { hidden: string; visible: string }> = {
  'fade-up': {
    hidden: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    hidden: 'opacity-0 translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    hidden: 'opacity-0 -translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'scale-in': {
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
  'fade-in': {
    hidden: 'opacity-0',
    visible: 'opacity-100',
  },
};

const delayClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'delay-0',
  1: 'delay-100',
  2: 'delay-200',
  3: 'delay-300',
  4: 'delay-400',
};

export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  className,
  threshold = 0.15,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold, once: true });
  const v = variantClasses[variant];

  return (
    <Tag
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:translate-x-0 motion-reduce:scale-100',
        inView ? v.visible : v.hidden,
        delayClasses[delay],
        className
      )}
    >
      {children}
    </Tag>
  );
}
