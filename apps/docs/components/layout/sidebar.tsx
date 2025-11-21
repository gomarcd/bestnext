'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

import type { NavSection } from '@/lib/navigation';

interface SidebarProps {
  navigation: NavSection[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ navigation, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(() =>
    navigation.filter((section) => section.items.some((item) => item.href === pathname)).map((section) => section.id)
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const activeSections = navigation
      .filter((section) => section.items.some((item) => item.href === pathname))
      .map((section) => section.id);
    setOpenSections((prev) => {
      const next = new Set(prev);
      let changed = false;
      activeSections.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? Array.from(next) : prev;
    });
  }, [pathname, navigation]);

  const toggleSection = (sectionId: string) => {
    const targetSection = navigation.find((section) => section.id === sectionId);
    if (!targetSection || targetSection.items.length === 0) {
      return;
    }
    setOpenSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  return (
    <>
      <aside
        className={clsx(
          'fixed left-0 top-[4.5rem] z-40 flex h-[calc(100vh-4.5rem)] w-72 flex-col overflow-hidden border-r border-ds-border bg-ds-surface shadow-xl transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:w-80 lg:translate-x-0 lg:transition-none'
        )}
      >
        <nav className="flex-1 px-4 py-5 text-sm text-slate-600">
          <ul className="flex flex-col">
            <li className="mt-0">
              <Link
                href="/"
                onClick={onClose}
                className={clsx(
                  'flex items-center rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wide text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary/40',
                  pathname === '/'
                    ? 'bg-ds-primary/10 text-ds-primary'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                <span className="flex flex-1 items-center gap-2">
                  <span className="h-4 w-[3px] rounded-full bg-transparent" aria-hidden />
                  <span>Home</span>
                </span>
              </Link>
            </li>
            {navigation.map((section) => (
              <li key={section.id} className="mt-5">
                {section.items.length === 0 && section.href ? (
                  <Link
                    href={section.href}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wide text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary/40',
                      pathname === section.href
                        ? 'bg-ds-primary/10 text-ds-primary'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    )}
                  >
                    <span className="flex flex-1 items-center gap-2">
                      <span className="h-4 w-[3px] rounded-full bg-transparent" aria-hidden />
                      <span>{section.title}</span>
                    </span>
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={clsx(
                        'relative flex w-full items-center rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 text-left transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-ds-primary/40 border border-transparent',
                        openSections.includes(section.id)
                          ? 'border border-[#89a8ff] bg-ds-primary/5 text-ds-primary'
                          : 'border border-transparent'
                      )}
                      aria-expanded={openSections.includes(section.id)}
                      aria-controls={`sidebar-section-${section.id}`}
                    >
                      <span className="flex flex-1 items-center gap-2 text-left">
                        <span
                          className={clsx(
                            'h-4 w-[3px] rounded-full transition-colors',
                            openSections.includes(section.id) ? 'bg-[#2a289d]' : 'bg-transparent'
                          )}
                          aria-hidden="true"
                        />
                        <span>{section.title}</span>
                      </span>
                      <svg
                        className={clsx(
                          'ml-3 h-3 w-3 shrink-0 transform text-slate-400 transition-transform duration-200',
                          openSections.includes(section.id) ? 'rotate-90 text-ds-primary' : ''
                        )}
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 2.5L8 6L4 9.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </button>
                    {openSections.includes(section.id) ? (
                      <ul id={`sidebar-section-${section.id}`} className="mt-2 space-y-1.5 pl-4">
                        {section.items.map((item) => {
                          const active = pathname === item.href;
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                  'flex items-center rounded-md px-3 py-2 transition',
                                  active ? 'bg-ds-primary/10 text-ds-primary' : 'hover:bg-slate-100'
                                )}
                              >
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t border-ds-border px-5 py-5 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Version 1.0.0-preview</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center text-xs font-semibold text-ds-primary transition hover:text-ds-primary-dark"
          >
            GitHub Repository
          </a>
        </div>
      </aside>
      {isOpen && isMounted ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          role="presentation"
          onClick={onClose}
        />
      ) : null}
    </>
  );
}
