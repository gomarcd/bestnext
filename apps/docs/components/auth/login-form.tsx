'use client';

import { useFormState, useFormStatus } from 'react-dom';

import type { LoginFormState } from '@/app/(auth)/actions';
import { loginAction } from '@/app/(auth)/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex w-full justify-center rounded-md bg-[#2a289d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#232186] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2a289d] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/admin' }: LoginFormProps) {
  const [state, formAction] = useFormState<LoginFormState | undefined, FormData>(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-slate-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
        />
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}
