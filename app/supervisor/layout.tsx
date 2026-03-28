import Link from 'next/link';
import { LayoutDashboard, Settings, Users } from 'lucide-react';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

const nav = [
  { href: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/supervisor/workers', label: 'CHW Activity', icon: Users },
  { href: '/supervisor/settings', label: 'Settings', icon: Settings },
];

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist dark:bg-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-950 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Supervisor</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink dark:text-white">Pahad Command</h1>
          </div>
          <div className="hidden gap-3 lg:flex lg:flex-col lg:pt-6">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <nav className="mt-6 grid gap-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-brand-soft/50 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-900">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
