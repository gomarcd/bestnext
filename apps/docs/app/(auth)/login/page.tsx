import Image from 'next/image';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/auth/login-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata = {
  title: 'Admin Sign In — Renesas Design System'
};

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect('/admin');
  }

  const nextParam = searchParams?.next;
  const redirectTo =
    typeof nextParam === 'string' && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/admin';
  const editMode = searchParams?.edit === 'true';

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6 lg:px-10">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex items-center justify-center gap-3">
          <Image src="/Logo-renesas.svg" alt="Renesas" width={140} height={32} priority />
          <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-600">
            Design System
          </span>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
