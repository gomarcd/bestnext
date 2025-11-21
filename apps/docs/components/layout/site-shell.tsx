'use client';

import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { logoutAction } from '@/app/(auth)/actions';
import { DocSearch } from '@/components/navigation/search';
import { PageContentManager } from '@/components/page-editor/page-content-manager';
import type { AuthUser } from '@/lib/auth/types';
import type { NavSection } from '@/lib/navigation';
import { Sidebar } from './sidebar';

interface SiteShellProps {
  children: ReactNode;
  navigation: NavSection[];
  currentUser: AuthUser | null;
}

export function SiteShell({ children, navigation, currentUser }: SiteShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hideChrome = pathname === '/login';

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
    });
  };

  if (hideChrome) {
    return <>{children}</>;
  }

  const currentPath = pathname ?? '/';
  const editMode = searchParams.get('edit') === 'true';

  const makeHref = (setEdit: boolean): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (setEdit) {
      params.set('edit', 'true');
    } else {
      params.delete('edit');
    }
    const query = params.toString();
    return query ? `${currentPath}?${query}` : currentPath;
  };

  const editHref = makeHref(true);
  const viewHref = makeHref(false);
  const adminFocusHref = `/admin/pages?focus=${encodeURIComponent(currentPath)}`;
  const isCmsManaged = Boolean(pathname && !pathname.startsWith('/admin'));
  const showEditLink = Boolean(currentUser && isCmsManaged);
  const showSidebar = isCmsManaged && !editMode;
  const renderedContent = isCmsManaged ? (
    <PageContentManager
      path={currentPath}
      editMode={Boolean(currentUser && editMode)}
      exitHref={viewHref}
      settingsHref={adminFocusHref}
    >
      {children}
    </PageContentManager>
  ) : (
    <>{children}</>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-ds-background">
      <header className="sticky top-0 z-40 border-b border-ds-border bg-ds-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1920px] flex-col items-stretch gap-4 px-6 py-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3 sm:order-1 sm:flex-none">
            {showSidebar ? (
              <button
                type="button"
                aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="inline-flex items-center rounded-md border border-ds-border bg-white p-2 text-slate-600 shadow-sm transition hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary lg:hidden"
              >
                {sidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </button>
            ) : null}
            <Link href="/" className="flex items-end gap-3 text-sm font-semibold text-slate-700">
              <Image
                src="/Logo-renesas.svg"
                alt="Renesas logo"
                width={120}
                height={29}
                className="block h-auto w-[120px]"
                priority
              />
              <span className="leading-none">Design System</span>
            </Link>
          </div>
          <div className="flex w-full sm:order-3 sm:flex-1 sm:justify-end lg:order-2 lg:ml-0 lg:justify-center">
            <div className="w-full lg:max-w-[600px]">
              <DocSearch />
            </div>
          </div>
          <div
            className={clsx(
              'flex items-center justify-end gap-2 sm:order-2',
              currentUser ? 'sm:flex-none sm:w-44' : 'sm:flex-none sm:w-auto'
            )}
          >
            {currentUser ? (
              <>
                <Link
                  href="/admin"
                  className="inline-flex items-center rounded-md border border-ds-border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center whitespace-nowrap rounded-md bg-ds-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ds-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        {showSidebar ? (
          <Sidebar navigation={navigation} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : null}
        <div className={clsx('flex flex-1 flex-col', showSidebar ? 'lg:ml-80' : '')}>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1920px] px-4 py-10 sm:px-6">
              {showEditLink && !editMode ? (
                <div className="mb-6 flex justify-end">
                  <Link
                    href={editHref}
                    className="inline-flex items-center gap-2 rounded-full border border-ds-primary bg-white px-4 py-1.5 text-sm font-medium text-ds-primary shadow-sm transition hover:bg-ds-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
                  >
                    Edit this page
                  </Link>
                </div>
              ) : null}
              {renderedContent}
            </div>
          </main>
          <footer className="border-t border-ds-border bg-ds-surface/70">
            <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-6 text-xs text-slate-500 sm:px-6">
              <p>&copy; {new Date().getFullYear()} Renesas Design System</p>
              <p>Built with Next.js, Contentlayer, and Lit components.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
