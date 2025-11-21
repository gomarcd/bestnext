import type { ComponentDoc } from 'contentlayer/generated';

import { CopyButton } from '@/components/ui/copy-button';

const LABELS: Record<string, string> = {
  html: 'HTML',
  ts: 'TypeScript',
  twig: 'Twig',
  css: 'CSS'
};

interface CodeSamplesProps {
  code?: ComponentDoc['code'];
}

export function CodeSamples({ code }: CodeSamplesProps) {
  if (!code) return null;

  const entries = Object.entries(code).filter(([, snippet]) => Boolean(snippet)) as [keyof ComponentDoc['code'], string][];
  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Code samples</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {entries.map(([key, snippet]) => (
          <article key={key} className="relative rounded-xl border border-ds-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{LABELS[key as string] ?? key.toUpperCase()}</span>
              <CopyButton value={snippet.trim()} label={`Copy ${LABELS[key as string] ?? key}`} />
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950/95 p-4 text-xs text-slate-100">
              <code>{snippet}</code>
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}
