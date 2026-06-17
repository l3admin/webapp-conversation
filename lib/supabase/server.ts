import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseServerConfig } from '@/config/server'

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabaseServerConfig()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        }
        catch {
          // Cookies can be immutable in some server render contexts.
        }
      },
    },
  })
}
