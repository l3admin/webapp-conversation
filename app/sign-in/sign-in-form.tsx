'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type SignInFormProps = {
  supabaseProjectUrl: string
  supabasePublishableKey: string
}

type AuthMode = 'password-sign-in' | 'password-sign-up' | 'magic-link'

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
  const supabase = useMemo(() => createBrowserClient(supabaseProjectUrl, supabasePublishableKey), [supabaseProjectUrl, supabasePublishableKey])
  const isPasswordMode = mode === 'password-sign-in' || mode === 'password-sign-up'

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

      if (mode === 'password-sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl.toString(),
          },
        })
        if (error) {
          throw error
        }

        if (data.session) {
          globalThis.location.assign(redirectTo)
          return
        }

        setMessage('Account created. Check your email to confirm your account before signing in.')
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
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-600">
          {isPasswordMode
            ? 'Use your email and password. You can still use magic link if needed.'
            : 'Enter your email and we will send a secure magic link.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setAuthMode('password-sign-in')}
          className={`rounded-md border px-2 py-1 text-xs ${mode === 'password-sign-in' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-600'}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('password-sign-up')}
          className={`rounded-md border px-2 py-1 text-xs ${mode === 'password-sign-up' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-600'}`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('magic-link')}
          className={`rounded-md border px-2 py-1 text-xs ${mode === 'magic-link' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-600'}`}
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            minLength={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="At least 8 characters"
          />
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {isSubmitting
          ? 'Working...'
          : mode === 'password-sign-in'
              ? 'Sign in'
              : mode === 'password-sign-up'
                  ? 'Create account'
                  : 'Send magic link'}
      </button>

      {isPasswordMode && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handlePasswordReset}
          className="w-full text-xs text-indigo-700 underline disabled:text-gray-400"
        >
          Forgot password? Send reset link
        </button>
      )}

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && authError && <p className="text-sm text-red-600">Authentication failed. Please try again.</p>}
    </form>
  )
}

export default SignInForm
