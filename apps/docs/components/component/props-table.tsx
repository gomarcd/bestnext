import type { ComponentDoc } from 'contentlayer/generated';

interface PropsTableProps {
  props?: ComponentDoc['props'];
}

export function PropsTable({ props }: PropsTableProps) {
  if (!props || props.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Props</h2>
      <div className="overflow-hidden rounded-xl border border-ds-border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-ds-border">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Default</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border bg-white text-sm text-slate-700">
            {props.map((prop) => (
              <tr key={prop.name}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-800">
                  {prop.name}
                  {prop.required ? <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600">Required</span> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{prop.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{prop.default ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{prop.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
