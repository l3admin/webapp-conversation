'use client'
import type { FC } from 'react'
import React, { useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface IAppUnavailableProps {
  isUnknownReason: boolean
  errMessage?: string
}

const AppUnavailable: FC<IAppUnavailableProps> = ({
  isUnknownReason,
  errMessage,
}) => {
  const { t } = useTranslation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  let message = errMessage
  if (!errMessage) { message = (isUnknownReason ? t('app.common.appUnkonwError') : t('app.common.appUnavailable')) as string }
  const supabaseClient = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    if (!url || !key) {
      return null
    }
    return createBrowserClient(url, key)
  }, [])

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut()
      }
      globalThis.location.assign('/sign-in')
    }
    finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className='flex h-screen w-screen items-center justify-center px-4'>
      <div className='w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-start gap-4'>
          <h1 className='h-[50px] pr-4 text-[24px] font-semibold leading-[50px] text-gray-900'
            style={{
              borderRight: '1px solid rgba(0,0,0,.2)',
            }}
          >
            {(errMessage || isUnknownReason) ? 500 : 404}
          </h1>
          <div className='flex-1'>
            <div className='text-sm text-gray-700'>{message}</div>
            <button
              type='button'
              disabled={isSigningOut}
              onClick={handleSignOut}
              className='mt-4 inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400'
            >
              <LogOut className='h-4 w-4' />
              {isSigningOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default React.memo(AppUnavailable)
