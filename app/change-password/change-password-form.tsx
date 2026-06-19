'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Toast from '@/app/components/base/toast'
import { updateMyPassword } from '@/service'

const getPasswordValidationError = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Password is required.'
  }
  if (trimmed.length < 6) {
    return 'Password must be at least 6 characters.'
  }
  const hasLetter = /[a-zA-Z]/.test(trimmed)
  const hasNumber = /\d/.test(trimmed)
  if (!hasLetter || !hasNumber) {
    return 'Password must contain at least one letter and one number.'
  }
  return null
}

const getRequestErrorMessage = async (error: any, fallback: string) => {
  if (!error) {
    return fallback
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }
  if (typeof error?.json === 'function') {
    try {
      const payload = await error.json()
      if (typeof payload?.received === 'string' && payload.received.trim()) {
        return payload.received
      }
      if (typeof payload?.error === 'string' && payload.error.trim()) {
        return payload.error
      }
      if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message
      }
    }
    catch {
      return fallback
    }
  }
  return fallback
}

const ChangePasswordForm = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }
    const passwordValidationError = getPasswordValidationError(password)
    if (passwordValidationError) {
      Toast.notify({ type: 'error', message: passwordValidationError })
      return
    }
    if (password !== confirmPassword) {
      Toast.notify({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setIsSubmitting(true)
    try {
      await updateMyPassword({ password })
      Toast.notify({ type: 'success', message: 'Password updated. Redirecting...' })
      globalThis.location.assign('/')
    }
    catch (error: any) {
      const message = await getRequestErrorMessage(error, 'Failed to update password.')
      Toast.notify({ type: 'error', message })
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parzley Workspace</p>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Change password</h1>
        <p className="text-sm font-medium leading-relaxed text-gray-700">
          Your account requires a password change before you can continue.
        </p>
      </div>
      <label className="block text-sm font-medium text-gray-700" htmlFor="new-password">
        New password
      </label>
      <div className="relative">
        <input
          id="new-password"
          type={isPasswordVisible ? 'text' : 'password'}
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm font-medium text-gray-900 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          placeholder="At least 6 characters"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-gray-500 hover:text-gray-700"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <label className="block text-sm font-medium text-gray-700" htmlFor="confirm-password">
        Confirm new password
      </label>
      <div className="relative">
        <input
          id="confirm-password"
          type={isConfirmPasswordVisible ? 'text' : 'password'}
          value={confirmPassword}
          onChange={event => setConfirmPassword(event.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm font-medium text-gray-900 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
          placeholder="Re-enter password"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-gray-500 hover:text-gray-700"
          onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          aria-label={isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
        >
          {isConfirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <p className="text-xs text-gray-600">Password must be at least 6 characters and include at least one letter and one number.</p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {isSubmitting ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}

export default ChangePasswordForm
