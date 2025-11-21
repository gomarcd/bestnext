interface DependenciesListProps {
  dependencies?: string[];
}

export function DependenciesList({ dependencies }: DependenciesListProps) {
  if (!dependencies || dependencies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Dependencies</h2>
      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
        {dependencies.map((dependency) => (
          <li key={dependency}>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{dependency}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
