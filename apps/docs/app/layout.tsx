import './globals.css';
import '@virtual-ds/tokens/css';
import type { ReactNode } from 'react';

import { Analytics } from '@/components/analytics/ga';
import { SiteShell } from '@/components/layout/site-shell';
import { getCurrentUser } from '@/lib/auth/session';
import { getNavigation } from '@/lib/navigation';

export const metadata = {
  title: 'Renesas Design System',
  description: 'Documentation, tokens, and implementation guidance for the Renesas Design System.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const navigation = getNavigation();
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <Analytics />
        <SiteShell navigation={navigation} currentUser={currentUser}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
