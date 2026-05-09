import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Supabase credentials missing in client.ts')
    // Return a dummy client or null to prevent hard crash
    return null as any
  }

  return createBrowserClient(url, key)
}

export const supabase = createClient()
