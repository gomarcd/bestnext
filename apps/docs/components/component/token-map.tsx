import type { ComponentDoc } from 'contentlayer/generated';

import { CopyButton } from '@/components/ui/copy-button';

interface TokenMapProps {
  tokens?: ComponentDoc['tokens'];
}

export function TokenMap({ tokens }: TokenMapProps) {
  if (!tokens || tokens.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Design tokens</h2>
      <div className="overflow-hidden rounded-xl border border-ds-border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-ds-border">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Alias</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border bg-white text-sm text-slate-700">
            {tokens.map((token) => (
              <tr key={token.name}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-slate-800">{token.name}</code>
                    <CopyButton value={token.name} label={`Copy token ${token.name}`} />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{token.alias ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{token.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
