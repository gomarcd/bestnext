import type { ComponentDoc } from 'contentlayer/generated';

interface AccessibilityPanelProps {
  a11y?: ComponentDoc['a11y'];
}

export function AccessibilityPanel({ a11y }: AccessibilityPanelProps) {
  if (!a11y) return null;

  const hasContent = (a11y.aria?.length ?? 0) + (a11y.keyboard?.length ?? 0) + (a11y.notes?.length ?? 0) > 0;
  if (!hasContent) return null;

  const sections: Array<{ title: string; items?: string[] }> = [
    { title: 'ARIA', items: a11y.aria },
    { title: 'Keyboard', items: a11y.keyboard },
    { title: 'Notes', items: a11y.notes }
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Accessibility</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-ds-border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{section.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {section.items && section.items.length > 0 ? (
                section.items.map((item, index) => <li key={`${section.title}-${index}`}>{item}</li>)
              ) : (
                <li className="text-slate-400">No guidance provided yet.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
