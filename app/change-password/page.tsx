import { redirect } from 'next/navigation'
import ChangePasswordForm from '@/app/change-password/change-password-form'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const ChangePasswordPage = async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/sign-in')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_master_admin,must_change_password,is_disabled')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(`Failed to load profile for password change gate. user_id=${user.id} reason=${profileError?.message || 'missing_profile'}`)
  }
  if (profile.is_disabled) {
    redirect('/sign-in?authError=1&authReason=disabled')
  }
  if (!profile.must_change_password) {
    redirect(profile.is_master_admin ? '/admin' : '/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <ChangePasswordForm />
    </main>
  )
}

export default ChangePasswordPage
