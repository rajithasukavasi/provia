import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Sign in to continue tailoring your resumes.">
      <AuthForm mode="login" />
    </AuthShell>
  )
}
