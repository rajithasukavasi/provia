import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserProfileData } from '@/lib/types'
import { cn } from '@/lib/utils'

export function profileChecklist(p: UserProfileData) {
  const skillCount = Object.values(p.skills).flat().length
  return [
    { label: 'Contact details', done: Boolean(p.personal.fullName && p.personal.email) },
    { label: 'Work experience', done: p.experience.length > 0 },
    { label: 'Education', done: p.education.length > 0 },
    { label: 'Projects', done: p.projects.length > 0 },
    { label: 'At least 5 skills', done: skillCount >= 5 },
    { label: 'Achievements or certifications', done: p.achievements.length + p.certifications.length > 0 },
  ]
}

export function ProfileCompleteness({ profile }: { profile: UserProfileData }) {
  const items = profileChecklist(profile)
  const done = items.filter((i) => i.done).length
  const pct = Math.round((done / items.length) * 100)
  if (pct === 100) return null

  return (
    <section aria-labelledby="completeness" className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="completeness" className="font-medium">
            Your profile is {pct}% complete
          </h2>
          <span className="text-sm text-muted-foreground">{`${done}/${items.length}`}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-labelledby="completeness">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          Provia only uses what is in your profile. The more you add, the better each tailored resume gets.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {items.map((i) => (
            <li key={i.label} className={cn('flex items-center gap-1.5 text-sm', i.done ? 'text-foreground' : 'text-muted-foreground')}>
              <span className={cn('flex size-4 items-center justify-center rounded-full border', i.done && 'border-primary bg-primary text-primary-foreground')}>
                {i.done && <Check className="size-3" aria-hidden />}
              </span>
              {i.label}
            </li>
          ))}
        </ul>
      </div>
      <Button variant="outline" render={<Link href="/profile" />} nativeButton={false}>
        Complete profile
        <ArrowRight data-icon="inline-end" />
      </Button>
    </section>
  )
}
