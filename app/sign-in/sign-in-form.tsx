'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type SignInFormProps = {
  supabaseProjectUrl: string
  supabasePublishableKey: string
}

type AuthMode = 'password-sign-in' | 'magic-link'

const SignInForm = ({ supabaseProjectUrl, supabasePublishableKey }: SignInFormProps) => {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<AuthMode>('password-sign-in')
  const redirectTo = useMemo(() => {
    const value = searchParams.get('redirectTo')
    if (!value || !value.startsWith('/')) {
      return '/'
    }
    return value
  }, [searchParams])
  const authError = searchParams.get('authError')
  const authReason = searchParams.get('authReason')
  const supabase = useMemo(() => createBrowserClient(supabaseProjectUrl, supabasePublishableKey), [supabaseProjectUrl, supabasePublishableKey])
  const isPasswordMode = mode === 'password-sign-in'

  const resetFeedback = () => {
    setMessage('')
    setError('')
  }

  const setAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    resetFeedback()
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetFeedback()
    setIsSubmitting(true)

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('redirectTo', redirectTo)
      if (mode === 'password-sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          throw error
        }
        globalThis.location.assign(redirectTo)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        throw error
      }

      setMessage('Check your email for a magic link to sign in.')
    }
    catch (error: any) {
      setError(error?.message || 'Failed to send sign-in link.')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    resetFeedback()
    if (!email) {
      setError('Enter your email first to send a reset link.')
      return
    }

    setIsSubmitting(true)
    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('redirectTo', redirectTo)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl.toString(),
      })
      if (error) {
        throw error
      }
      setMessage('Password reset link sent. Check your email.')
    }
    catch (error: any) {
      setError(error?.message || 'Failed to send password reset link.')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parzley Workspace</p>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Sign in</h1>
        <p className="text-sm font-medium leading-relaxed text-gray-700">
          {isPasswordMode
            ? 'Use your email and password. You can still use magic link if needed.'
            : 'Enter your invited email and we will send a secure magic link.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAuthMode('password-sign-in')}
          className={`rounded-md border px-2 py-1 text-xs font-bold transition-colors ${mode === 'password-sign-in' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('magic-link')}
          className={`rounded-md border px-2 py-1 text-xs font-bold transition-colors ${mode === 'magic-link' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          Magic link
        </button>
      </div>

      <label className="block text-sm font-medium text-gray-700" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        placeholder="you@example.com"
      />

      {isPasswordMode && (
        <>
          <label className="block text-sm font-medium text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required={isPasswordMode}
            minLength={6}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
            placeholder="At least 6 characters"
          />
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {isSubmitting
          ? 'Working...'
          : mode === 'password-sign-in'
              ? 'Sign in'
              : 'Send magic link'}
      </button>

      {isPasswordMode && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handlePasswordReset}
          className="w-full text-xs font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 disabled:text-gray-400"
        >
          Forgot password? Send reset link
        </button>
      )}

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && authError && (
        <p className="text-sm text-red-600">
          Authentication failed. {authReason ? `Reason: ${authReason}` : 'Please try again.'}
        </p>
      )}
    </form>
  )
}

export default SignInForm
