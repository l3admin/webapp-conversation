'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '@/lib/supabase/shared'

let browserClient: SupabaseClient | null = null

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient
  }

  const { url, anonKey } = getSupabaseConfig()
  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}
