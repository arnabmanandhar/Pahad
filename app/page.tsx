import Link from 'next/link';
import { ArrowRight, BadgeCheck, BrainCircuit, Languages, MountainSnow } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConsentBanner } from '@/components/shared/ConsentBanner';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

const features = [
  { title: 'Early Detection', copy: 'Spot worsening patterns before they become emergencies, with household-level follow-up built in.', icon: MountainSnow },
  { title: 'AI-Powered Scoring', copy: 'Gemini-first scoring with deterministic fallback keeps the experience fast, explainable, and resilient.', icon: BrainCircuit },
  { title: 'Bilingual Support', copy: 'English and Nepali UI copy helps CHWs and supervisors work in the language that fits the moment.', icon: Languages },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-topo bg-[length:240px_240px]">
      <section className="border-b border-brand/10 bg-gradient-to-br from-brand via-brand-dark to-slate-900 px-6 py-8 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Hackathon-ready PWA</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">Pahad <span className="text-emerald-300">पहाड</span></h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">Community mental health screening designed for Nepal's frontline health workers and supervisors.</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
            <BadgeCheck className="h-4 w-4" /> WHO mhGAP aligned
          </div>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-ink dark:text-white md:text-6xl">A stunning ward-level risk map with explainable screening built for real community workflows.</h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Pahad gives CHWs a calm, mobile-first visit flow and gives supervisors a sharp view of where distress is clustering so they can act quickly.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login"><Button className="px-6 py-3 text-base">Launch Pahad <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/supervisor"><Button variant="secondary" className="px-6 py-3 text-base">View dashboard preview</Button></Link>
          </div>
          <div className="mt-8 max-w-3xl">
            <ConsentBanner />
          </div>
        </div>
        <Card className="overflow-hidden border-none bg-slate-950 p-0 shadow-2xl">
          <div className="bg-gradient-to-br from-brand via-teal-700 to-emerald-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/70">Supervisor view</p>
                <h3 className="mt-2 text-2xl font-semibold">Live Nepal Risk Heatmap</h3>
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Live demo</div>
            </div>
          </div>
          <div className="grid gap-4 bg-slate-950 p-6 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.3),_transparent_40%),linear-gradient(180deg,_rgba(15,23,42,1),_rgba(3,7,18,1))] p-5">
              <div className="grid h-72 place-items-center rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,118,110,0.35),rgba(15,23,42,0.2))]">
                <div className="relative h-56 w-full">
                  <div className="absolute left-[24%] top-[22%] h-24 w-24 rounded-full bg-amber-400/35 shadow-[0_0_0_28px_rgba(245,158,11,0.08)]" />
                  <div className="absolute left-[46%] top-[30%] h-32 w-32 rounded-full bg-red-500/40 shadow-[0_0_0_32px_rgba(239,68,68,0.14)]" />
                  <div className="absolute left-[60%] top-[54%] h-28 w-28 rounded-full bg-orange-500/35 shadow-[0_0_0_28px_rgba(249,115,22,0.12)]" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {['Ward 5 - Critical', 'Ward 3 - High', 'Ward 7 - Elevated'].map((item, index) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">Area signal {index + 1}</p>
                  <p className="mt-2 text-lg font-semibold">{item}</p>
                  <p className="mt-1 text-sm text-white/60">Explainable scoring with CHW observations attached to every risk change.</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-white/90 backdrop-blur dark:bg-slate-900/80">
              <feature.icon className="h-10 w-10 text-brand" />
              <h3 className="mt-5 text-2xl font-semibold text-ink dark:text-white">{feature.title}</h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">{feature.copy}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}