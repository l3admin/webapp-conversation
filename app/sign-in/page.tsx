import { redirect } from 'next/navigation'
import SignInForm from '@/app/sign-in/sign-in-form'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const SignInPage = async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <SignInForm />
    </main>
  )
}

export default SignInPage
