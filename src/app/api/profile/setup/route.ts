import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { display_name, daily_goal_minutes } = await req.json()

    if (!display_name?.trim()) {
      return NextResponse.json({ error: "Display name required" }, { status: 400 })
    }
    if (!daily_goal_minutes || daily_goal_minutes < 15) {
      return NextResponse.json({ error: "Invalid daily goal" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: display_name.trim(),
        daily_goal_minutes,
        onboarding_completed: true,
      }, { onConflict: "id" })

    if (error) {
      console.error("Profile setup error:", error)
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
