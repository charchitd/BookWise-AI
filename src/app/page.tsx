import { createServerClient } from "@/lib/supabase-server"
import LandingPageClient from "@/components/landing-page-client"

export default async function Home() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  return <LandingPageClient isAuthenticated={!!user} />
}
