import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config'

export const getSupabaseConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.')
  }

  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  }
}
