import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

let browserClient: ReturnType<typeof createBrowserClientSSR> | null = null

export function createBrowserClient() {
  // On the server, create a new client per request to avoid session leaks
  if (typeof window === 'undefined') {
    return createBrowserClientSSR(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // On the browser, reuse a single instance to prevent duplicate event listeners,
  // redundant token refresh loops, and multiple concurrent network requests.
  if (!browserClient) {
    browserClient = createBrowserClientSSR(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return browserClient
}

// Server-only admin client that bypasses RLS
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
