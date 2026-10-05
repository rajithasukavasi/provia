import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProfileCompleteness } from '@/components/dashboard/profile-completeness'
import { ResumeList } from '@/components/dashboard/resume-list'
import { Button } from '@/components/ui/button'
import { getProfile, listResumes } from '@/lib/data'

export const metadata: Metadata = { title: 'Resumes' }

export default async function DashboardPage() {
  const [profile, resumes] = await Promise.all([getProfile(), listResumes()])
  const firstName = profile.data.personal.fullName.split(' ')[0]

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance">
            {firstName ? `Welcome back, ${firstName}` : 'Your resumes'}
          </h1>
          <p className="text-muted-foreground">Every resume here is tailored to one specific role.</p>
        </div>
        <Button size="lg" render={<Link href="/resume/new" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          New tailored resume
        </Button>
      </div>
      <ProfileCompleteness profile={profile.data} />
      <ResumeList resumes={resumes} />
    </main>
  )
}
