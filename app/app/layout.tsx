import Link from 'next/link';
import { Home, History, PlusCircle, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

const nav = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/visit/new', label: 'New Visit', icon: PlusCircle },
  { href: '/app/visits', label: 'History', icon: History },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export default function ChwLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">CHW workspace</p>
            <h1 className="text-xl font-semibold text-ink dark:text-white">Pahad field app</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24">{children}</div>
      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-full border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-slate-500 transition hover:text-brand dark:text-slate-400 dark:hover:text-emerald-300">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
