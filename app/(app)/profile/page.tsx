import type { Metadata } from 'next'
import { getProfile } from '@/lib/data'
import { ProfileEditor } from '@/components/profile/profile-editor'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium text-primary">Your source of truth</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Build your professional profile</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Keep your information accurate and evidence-based. Provia uses this profile to tailor each resume to the role without inventing qualifications or achievements.</p>
      </div>
      <ProfileEditor initial={profile.data} initialPhotoUrl={profile.photoUrl} />
    </main>
  )
}
