import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <AuthShell
      title="That link didn't work"
      description="The confirmation link may have expired or already been used. Try signing in, or create your account again."
    >
      <Button size="lg" render={<Link href="/login" />} nativeButton={false}>
        Go to sign in
      </Button>
    </AuthShell>
  )
}
