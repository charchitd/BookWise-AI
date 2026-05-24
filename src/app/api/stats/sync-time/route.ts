import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { minutes } = await req.json()
    if (!minutes || typeof minutes !== "number" || minutes <= 0) {
      return NextResponse.json({ error: "Invalid minutes" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.rpc("increment_learning_minutes", {
      user_uuid: user.id,
      minutes_to_add: minutes,
    })

    if (error) {
      console.error("RPC Error:", error)
      return NextResponse.json({ error: "Failed to update stats" }, { status: 500 })
    }

    // data is the jsonb returned: { xp_earned, streak, total_xp }
    return NextResponse.json({ success: true, added: minutes, ...data })
  } catch (error: any) {
    console.error("Sync time error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
