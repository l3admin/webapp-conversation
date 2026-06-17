import 'server-only'

export const DIFY_API_BASE_URL = process.env.DIFY_API_BASE_URL || ''
export const DIFY_APP_API_KEY_KN_COLD = process.env.DIFY_APP_API_KEY_KN_COLD || ''

export const getSupabaseServerConfig = () => {
  const url = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL || ''
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

  if (!url || !publishableKey) {
    throw new Error('Missing Supabase configuration: set SUPABASE_PROJECT_URL and SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_PROJECT_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).')
  }

  return { url, publishableKey }
}
