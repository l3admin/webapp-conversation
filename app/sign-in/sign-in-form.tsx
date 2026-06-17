'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const SignInForm = () => {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectTo = useMemo(() => {
    const value = searchParams.get('redirectTo')
    if (!value || !value.startsWith('/')) {
      return '/'
    }
    return value
  }, [searchParams])
  const authError = searchParams.get('authError')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('redirectTo', redirectTo)

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

  return (
    <form className="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-600">Enter your email and we will send a secure magic link.</p>
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {isSubmitting ? 'Sending...' : 'Send magic link'}
      </button>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && authError && <p className="text-sm text-red-600">Authentication failed. Please try again.</p>}
    </form>
  )
}

export default SignInForm
