'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, WandSparkles } from 'lucide-react'
import { analyzeResume, generateResume } from '@/app/actions/resumes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResumeDocument } from '@/components/resume/templates'
import type { Resume } from '@/lib/types'

export function ResumeWorkflow({ initialResume }: { initialResume: Resume }) {
  const router = useRouter()
  const [resume, setResume] = useState(initialResume)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  useEffect(() => setResume(initialResume), [initialResume])

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setMessage('')
      const result = await action()
      if (!result.ok) return setMessage(result.error || 'Something went wrong.')
      setMessage('Saved. Refreshing preview…')
      router.refresh()
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-7 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><Button variant="ghost" render={<Link href="/dashboard" />} nativeButton={false}><ArrowLeft data-icon="inline-start" />Back</Button><h1 className="mt-2 font-serif text-3xl font-semibold">{resume.jobTarget.jobTitle}</h1><p className="text-muted-foreground">{resume.jobTarget.companyName}</p></div><Badge>{resume.status === 'generated' ? 'Ready' : resume.status}</Badge></div>
      <div className="grid gap-7 lg:grid-cols-[340px_1fr] lg:items-start">
        <aside className="flex flex-col gap-4 rounded-xl border bg-card p-5 lg:sticky lg:top-20"><h2 className="font-semibold">Resume workflow</h2><p className="text-sm leading-6 text-muted-foreground">Start with a job analysis, then generate a resume from the information already in your profile.</p><Button onClick={() => run(() => analyzeResume(resume.id))} disabled={pending}><Sparkles data-icon="inline-start" />Analyze requirements</Button><Button variant="outline" onClick={() => run(() => generateResume(resume.id, 'ai'))} disabled={pending}><WandSparkles data-icon="inline-start" />Generate from profile</Button>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}{resume.analysis && <div className="rounded-lg bg-secondary p-4 text-sm"><p className="font-medium">Strong matches</p><p className="mt-1 text-muted-foreground">{resume.analysis.strongMatches.map((m) => m.skill).join(', ') || 'None yet'}</p><p className="mt-3 font-medium">Recommended focus</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{resume.analysis.recommendedFocus.map((item) => <li key={item}>{item}</li>)}</ul></div>}</aside>
        <div className="overflow-auto rounded-xl border bg-neutral-100 p-4 sm:p-8"><div className="mx-auto w-[794px] shadow-xl">{resume.content ? <ResumeDocument template={resume.template} content={resume.content} photoUrl={null} /> : <div className="flex min-h-[1123px] items-center justify-center bg-white text-center text-sm text-neutral-500"><div><p className="font-medium text-neutral-800">Your resume preview will appear here</p><p className="mt-1">Generate it from your profile to create the first draft.</p></div></div>}</div></div>
      </div>
    </main>
  )
}
