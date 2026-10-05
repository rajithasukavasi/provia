import Link from 'next/link'
import { ArrowRight, Check, FileText, Sparkles, Target, WandSparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const steps = [
  { icon: Target, title: 'Add the target role', text: 'Paste the company, role and job description you actually want to apply for.' },
  { icon: Sparkles, title: 'Match your profile', text: 'Provia identifies relevant skills, projects and experience without inventing credentials.' },
  { icon: FileText, title: 'Build the resume', text: 'Choose a professional template and create a focused, print-ready resume.' },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>Sign in</Button>
          <Button render={<Link href="/sign-up" />} nativeButton={false}>Get started</Button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-24">
        <div className="flex max-w-2xl flex-col gap-7">
          <div className="flex w-fit items-center gap-2 rounded-full border bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
            <WandSparkles className="size-4 text-primary" />
            Tailored, evidence-first resumes
          </div>
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your profile. Your potential. Precisely presented.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Provia turns your real experience into a resume shaped around the role you want, so every application feels intentional instead of generic.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/sign-up" />} nativeButton={false}>
              Build your resume
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />} nativeButton={false}>Explore the demo</Button>
          </div>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {['No invented achievements', 'Five professional templates', 'A4-ready output', 'Job-specific focus'].map((item) => (
              <li key={item} className="flex items-center gap-2"><Check className="size-4 text-primary" />{item}</li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl" />
          <div className="rounded-2xl border bg-card p-3 shadow-2xl">
            <div className="rounded-xl border bg-white p-7 text-neutral-900 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b pb-5">
                <div>
                  <p className="text-2xl font-bold tracking-tight">Jordan Lee</p>
                  <p className="mt-1 text-sm font-medium text-primary">Frontend Developer</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">PROVIA</span>
              </div>
              <div className="mt-5 grid gap-5 text-xs">
                <div><p className="font-bold uppercase tracking-widest text-neutral-400">Profile match</p><div className="mt-2 h-2 rounded-full bg-neutral-100"><div className="h-full w-[86%] rounded-full bg-primary" /></div><p className="mt-1 text-neutral-500">86% of role requirements supported by your profile</p></div>
                <div><p className="font-bold uppercase tracking-widest text-neutral-400">Professional summary</p><p className="mt-2 leading-5 text-neutral-600">Computer Science student focused on building responsive, accessible web experiences with modern frontend technologies.</p></div>
                <div className="grid grid-cols-2 gap-4"><div><p className="font-bold uppercase tracking-widest text-neutral-400">Skills</p><p className="mt-2 text-neutral-600">React · TypeScript · HTML · CSS · Git</p></div><div><p className="font-bold uppercase tracking-widest text-neutral-400">Focus</p><p className="mt-2 text-neutral-600">Projects · Education · Technical skills</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-card/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">0{index + 1}</p><h2 className="mt-1 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <Logo href="/" />
        <p>Build once. Tailor with purpose.</p>
      </footer>
    </main>
  )
}
