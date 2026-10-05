import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      title="Check your inbox"
      description="We sent a confirmation link to your email. Open it to activate your account, then sign in."
    >
      <Button variant="outline" size="lg" render={<Link href="/login" />} nativeButton={false}>
        Back to sign in
      </Button>
    </AuthShell>
  )
}
