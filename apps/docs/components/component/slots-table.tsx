import type { ComponentDoc } from 'contentlayer/generated';

interface SlotsTableProps {
  slots?: ComponentDoc['slots'];
}

export function SlotsTable({ slots }: SlotsTableProps) {
  if (!slots || slots.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Slots</h2>
      <div className="overflow-hidden rounded-xl border border-ds-border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-ds-border">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border bg-white text-sm text-slate-700">
            {slots.map((slot) => (
              <tr key={slot.name}>
                <td className="px-4 py-3 font-mono text-xs text-slate-800">{slot.name}</td>
                <td className="px-4 py-3 text-slate-600">{slot.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
