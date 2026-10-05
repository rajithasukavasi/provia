import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProfile, getResume } from '@/lib/data'
import { ResumeWorkflow } from '@/components/resume/resume-workflow'

export const metadata: Metadata = { title: 'Resume' }

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resume = await getResume(id)
  if (!resume) return <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6"><Button variant="ghost" render={<Link href="/dashboard"/>} nativeButton={false}><ArrowLeft data-icon="inline-start"/>Back to resumes</Button><h1 className="mt-6 font-serif text-3xl font-semibold">Resume not found</h1></main>
  const profile = await getProfile()
  return <ResumeWorkflow initialResume={resume} photoUrl={profile.photoUrl}/>
}
