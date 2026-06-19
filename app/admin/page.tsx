import { redirect } from 'next/navigation'
import AdminConsole from '@/app/admin/ui/admin-console'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const AdminPage = async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/sign-in')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_master_admin,must_change_password')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(`Failed to resolve admin access. user_id=${user.id} reason=${profileError?.message || 'missing_profile'}`)
  }

  if (!profile.is_master_admin) {
    redirect('/')
  }
  if (profile.must_change_password) {
    redirect('/change-password')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <AdminConsole />
    </main>
  )
}

export default AdminPage
