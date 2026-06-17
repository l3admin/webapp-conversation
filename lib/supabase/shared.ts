import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from '@/config'

export const getSupabaseConfig = () => {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_PROJECT_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.')
  }

  return {
    url: SUPABASE_PROJECT_URL,
    anonKey: SUPABASE_PUBLISHABLE_KEY,
  }
}
