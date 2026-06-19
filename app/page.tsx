import React from 'react'
import { redirect } from 'next/navigation'

import Main from '@/app/components'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type AppPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const App = async ({ searchParams }: AppPageProps) => {
  const resolvedSearchParams = await searchParams
  const requestedView = Array.isArray(resolvedSearchParams?.view)
    ? resolvedSearchParams?.view[0]
    : resolvedSearchParams?.view
  const allowAdminChatView = requestedView === 'chat'

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/sign-in')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_master_admin,must_change_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Failed to load user profile for app routing. user_id=${user.id} reason=${profileError.message}`)
  }

  let isMasterAdmin = Boolean(profile?.is_master_admin)
  let mustChangePassword = Boolean(profile?.must_change_password)
  if (!profile) {
    const metadata = (user.user_metadata as Record<string, any> | null) || null
    const metadataFullName = typeof metadata?.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : ''
    const firstName = typeof metadata?.first_name === 'string' && metadata.first_name.trim()
      ? metadata.first_name.trim()
      : metadataFullName.split(/\s+/).filter(Boolean)[0] || null
    const lastNameParts = metadataFullName.split(/\s+/).filter(Boolean).slice(1)
    const derivedLastName = lastNameParts.join(' ').trim()
    const lastName = typeof metadata?.last_name === 'string' && metadata.last_name.trim()
      ? metadata.last_name.trim()
      : derivedLastName || null

    const { data: createdProfile, error: createProfileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        display_name: null,
        initials_override: null,
        avatar_url: null,
        is_master_admin: false,
        is_disabled: false,
        must_change_password: false,
        password_changed_at: null,
      })
      .select('is_master_admin,must_change_password')
      .single()

    if (createProfileError || !createdProfile) {
      throw new Error(`Failed to create missing user profile for app routing. user_id=${user.id} reason=${createProfileError?.message || 'empty_insert_result'}`)
    }
    isMasterAdmin = Boolean(createdProfile.is_master_admin)
    mustChangePassword = Boolean(createdProfile.must_change_password)
  }

  if (mustChangePassword) {
    redirect('/change-password')
  }

  if (isMasterAdmin && !allowAdminChatView) {
    redirect('/admin')
  }

  return <Main params={{}} />
}

export default App
