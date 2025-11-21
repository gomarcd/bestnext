'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';

interface CopyButtonProps {
  value: string;
  className?: string;
  label?: string;
}

export function CopyButton({ value, className, label = 'Copy code' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }, [value]);

  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center gap-2 rounded-md border border-ds-border bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary',
        copied && 'border-green-500 text-green-600',
        className
      )}
      aria-label={label}
      onClick={handleCopy}
    >
      <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </span>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
