import type { ComponentDoc } from 'contentlayer/generated';

interface EventsTableProps {
  events?: ComponentDoc['events'];
}

export function EventsTable({ events }: EventsTableProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Events</h2>
      <div className="overflow-hidden rounded-xl border border-ds-border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-ds-border">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border bg-white text-sm text-slate-700">
            {events.map((event) => (
              <tr key={event.name}>
                <td className="px-4 py-3 font-mono text-xs text-slate-800">{event.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{event.type}</td>
                <td className="px-4 py-3 text-slate-600">{event.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
