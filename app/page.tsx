import React from 'react'
import { redirect } from 'next/navigation'

import Main from '@/app/components'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const App = async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/sign-in')
  }

  return <Main params={{}} />
}

export default App
