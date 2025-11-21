'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PageStatus } from '@/lib/cms/types';

interface SearchablePage {
  id: string;
  title: string;
  path: string;
  status: PageStatus;
  breadcrumbs: string[];
}

interface PageSearchProps {
  pages: SearchablePage[];
}

export function PageSearch({ pages }: PageSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return pages.slice(0, 8);
    }
    return pages
      .filter((page) => {
        const haystack = `${page.title} ${page.path} ${page.breadcrumbs.join(' ')}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .slice(0, 8);
  }, [pages, query]);

  const handleSelect = (page: SearchablePage) => {
    setQuery('');
    setFocused(false);
    router.push(`/admin/pages/${page.id}`);
  };

  return (
    <div className="relative">
      <label htmlFor="page-search" className="block text-sm font-medium text-slate-700">
        Find a page
      </label>
      <input
        id="page-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Delay to let onClick fire on suggestions
          setTimeout(() => setFocused(false), 100);
        }}
        onKeyDown={(event) => {
          if (!suggestions.length) {
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter') {
            event.preventDefault();
            handleSelect(suggestions[activeIndex]);
          }
        }}
        placeholder="Search by title, path, or section"
        className="mt-1 block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
      />
      {isFocused && suggestions.length > 0 ? (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-ds-border bg-white shadow-xl">
          {suggestions.map((page, index) => (
            <li key={page.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(page)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm transition ${
                  index === activeIndex ? 'bg-ds-primary/10 text-ds-primary' : 'hover:bg-slate-100'
                }`}
              >
                <span className="font-medium">{page.title}</span>
                <span className="text-xs text-slate-500">
                  {page.breadcrumbs.length > 0 ? `${page.breadcrumbs.join(' › ')} · ` : ''}
                  {page.path}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
