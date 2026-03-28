'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient, hasSupabaseEnv } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConsentBanner } from '@/components/shared/ConsentBanner';

export default function LoginPage() {
  const router = useRouter();
  const supabase = hasSupabaseEnv() ? createSupabaseBrowserClient() : null;
  const [email, setEmail] = useState('supervisor@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!supabase) {
      router.push('/supervisor');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push('/supervisor');
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      router.push('/supervisor');
      return;
    }

    const url = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: url } });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand/5 via-mist to-emerald-50 px-6 py-12 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Secure sign-in</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink dark:text-white">Welcome to Pahad</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Sign in to continue to your screening workspace.</p>
        <form className="mt-8 space-y-4" onSubmit={signIn}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email address
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-brand/20 transition focus:ring-4 dark:border-slate-700 dark:bg-slate-950" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-brand/20 transition focus:ring-4 dark:border-slate-700 dark:bg-slate-950" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{error}</p> : null}
          <Button type="submit" loading={loading} className="w-full py-3">Sign in</Button>
          <Button type="button" variant="secondary" className="w-full py-3" onClick={signInWithGoogle}>Sign in with Google</Button>
        </form>
        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          <ConsentBanner compact />
        </div>
      </Card>
    </main>
  );
}
