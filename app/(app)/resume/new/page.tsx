'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createResume } from '@/app/actions/resumes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewResumePage() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function submit(formData: FormData) {
    const input = {
      companyName: String(formData.get('companyName') || ''),
      jobTitle: String(formData.get('jobTitle') || ''),
      jobDescription: String(formData.get('jobDescription') || ''),
      requiredSkills: String(formData.get('requiredSkills') || ''),
      preferredSkills: String(formData.get('preferredSkills') || ''),
      companyWebsite: String(formData.get('companyWebsite') || ''),
    }
    startTransition(async () => {
      setError('')
      const result = await createResume(input)
      if (!result.ok) return setError(result.error)
      router.push(`/resume/${result.data.id}`)
    })
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8"><p className="text-sm font-medium text-primary">New tailored resume</p><h1 className="mt-1 font-serif text-3xl font-semibold">Tell Provia about the role</h1><p className="mt-2 text-muted-foreground">Paste the real job requirements. We will use your profile as the source of truth.</p></div>
      <form action={submit} className="flex flex-col gap-6 rounded-xl border bg-card p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Company<Input name="companyName" required placeholder="Acme Labs" /></label><label className="grid gap-2 text-sm font-medium">Job title<Input name="jobTitle" required placeholder="Frontend Developer" /></label></div>
        <label className="grid gap-2 text-sm font-medium">Job description<Textarea name="jobDescription" required className="min-h-48" placeholder="Paste the complete job description here..." /></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Required skills<Input name="requiredSkills" placeholder="React, TypeScript, CSS" /></label><label className="grid gap-2 text-sm font-medium">Preferred skills<Input name="preferredSkills" placeholder="Next.js, Git, testing" /></label></div>
        <label className="grid gap-2 text-sm font-medium">Company website <span className="font-normal text-muted-foreground">(optional)</span><Input name="companyWebsite" type="url" placeholder="https://example.com" /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end"><Button type="submit" size="lg" disabled={pending}>{pending ? 'Creating…' : 'Continue'} <ArrowRight data-icon="inline-end" /></Button></div>
      </form>
    </main>
  )
}
