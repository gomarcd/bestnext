'use client';

import type { HTMLAttributes, ReactElement } from 'react';
import { isValidElement } from 'react';
import clsx from 'clsx';

import { CopyButton } from '@/components/ui/copy-button';

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  children: ReactElement;
}

export function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  let code = '';

  if (isValidElement(children)) {
    const child = children as ReactElement<{ children?: unknown; className?: string }>;
    const text = child.props.children;
    if (typeof text === 'string') {
      code = text.trim();
    } else if (Array.isArray(text)) {
      code = text
        .map((segment) => (typeof segment === 'string' ? segment : ''))
        .join('')
        .trim();
    }
  }

  return (
    <div className="group relative">
      <CopyButton value={code} className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100" />
      <pre className={clsx('overflow-auto rounded-lg bg-slate-950/95 p-4 text-sm text-slate-100', className)} {...rest}>
        {children}
      </pre>
    </div>
  );
}
