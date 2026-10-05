'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { signInDemo } from '@/app/actions/auth'

type Mode = 'login' | 'sign-up'

function describeAuthError(mode: Mode, error: { message?: string; code?: string }) {
  const code = error.code ?? ''
  if (code.includes('email-already-in-use') || code === 'user_already_exists') return 'An account with this email already exists. Try signing in instead.'
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Invalid email or password.'
  if (code.includes('invalid-email')) return 'Please use a valid email address.'
  if (code.includes('weak-password')) return 'That password is too weak. Use at least 8 characters.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a minute and try again.'
  if (mode === 'login') return 'Could not sign in. Please check your email and password.'
  return error.message || 'Could not create the account. Please try again.'
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const fullName = String(form.get('fullName') ?? '').trim()
    if (mode === 'sign-up' && password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError(null); setResetMessage(null)

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const firebase = createClient()
      if (mode === 'login') {
        const result = await firebase.auth.signInWithPassword({ email, password })
        if (result.error) { setError(describeAuthError(mode, result.error)); setLoading(false); return }
      } else {
        const result = await firebase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (result.error) { setError(describeAuthError(mode, result.error)); setLoading(false); return }
      }
      router.push('/dashboard'); router.refresh(); return
    }

    await signInDemo()
  }

  async function handleForgotPassword() {
    const email = String((document.getElementById('email') as HTMLInputElement | null)?.value ?? '').trim()
    setError(null); setResetMessage(null)
    if (!email) {
      setError('Enter your email address first, then choose Forgot password.')
      return
    }
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      setError('Password reset is available when Firebase authentication is enabled.')
      return
    }
    setResetLoading(true)
    const result = await createClient().auth.resetPassword(email)
    setResetLoading(false)
    if (result.error) {
      const code = result.error.code ?? ''
      if (code.includes('invalid-email')) setError('Please use a valid email address.')
      else if (code.includes('user-not-found')) setError('No account was found with that email address.')
      else setError('Could not send the reset email. Please try again.')
      return
    }
    setResetMessage('Password reset email sent. Check your inbox.')
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate={false}>
      <FieldGroup>
        {mode === 'sign-up' && <Field><FieldLabel htmlFor="fullName">Full name</FieldLabel><Input id="fullName" name="fullName" autoComplete="name" required placeholder="Your full name" /></Field>}
        <Field><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></Field>
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            {mode === 'login' && (
              <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50">
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            )}
          </div>
          <div className="relative">
            <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'sign-up' ? 8 : undefined} className="pr-10" />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground" tabIndex={0}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {error && <FieldError role="alert">{error}</FieldError>}
        {resetMessage && <p role="status" className="text-sm text-emerald-700">{resetMessage}</p>}
      </FieldGroup>
      {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && <p className="rounded-lg border bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">Local demo mode is active.</p>}
      <Button type="submit" size="lg" disabled={loading} className="w-full">{loading && <Spinner />}{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      <p className="text-center text-sm text-muted-foreground">{mode === 'login' ? 'New to Provia? ' : 'Already have an account? '}<Link href={mode === 'login' ? '/sign-up' : '/login'} className="font-medium text-primary underline-offset-4 hover:underline">{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p>
    </form>
  )
}
