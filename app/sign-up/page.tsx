import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" description="Build your profile once, tailor a resume for every role.">
      <AuthForm mode="sign-up" />
    </AuthShell>
  )
}
