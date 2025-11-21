'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

interface SearchResult {
  title: string;
  url: string;
  description?: string;
  type: 'component' | 'guide';
  status?: string;
  tags?: string[];
  score: number;
}

export function DocSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (debounce.current) {
      clearTimeout(debounce.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounce.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
      } catch (error) {
        console.error('Search failed', error);
        setResults([]);
      }
    }, 200);

    return () => {
      if (debounce.current) {
        clearTimeout(debounce.current);
      }
    };
  }, [query]);

  const hasResults = results.length > 0;

  useEffect(() => {
    if (!hasResults) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hasResults]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="search"
        placeholder="Search Design System"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-full border border-ds-border bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20 focus:bg-white"
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {hasResults ? (
        <ul className="absolute z-30 mt-2 w-full rounded-xl border border-ds-border bg-white shadow-xl">
          {results.map((result) => (
            <li key={result.url}>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  router.push(result.url);
                }}
                className="flex w-full flex-col items-start gap-1 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{result.title}</span>
                  <span className={clsx('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide', result.type === 'component' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500')}>
                    {result.type}
                  </span>
                  {result.status ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-600">
                      {result.status}
                    </span>
                  ) : null}
                </span>
                {result.description ? (
                  <span className="text-xs text-slate-500">{result.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
