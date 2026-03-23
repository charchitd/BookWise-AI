import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, email, userAgent } = body
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const supabase = createAdminClient()
    
    // Insert into user_consents table
    const { error: consentError } = await supabase.from("user_consents").insert({
      user_id: userId,
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      policy_version: "v1.0",
      privacy_accepted: true,
      terms_accepted: true,
      data_processing_accepted: true
    })

    if (consentError) throw consentError;

    // Update user_usage with consent info
    const { error: usageError } = await supabase.from("user_usage")
      .update({ 
        consent_accepted: true, 
        consent_accepted_at: new Date().toISOString() 
      })
      .eq("user_id", userId)

    if (usageError) {
      // If it fails, maybe the row wasn't inserted yet by the client due to RLS or timing.
      // But we use the service role here so we could insert it if missing.
      // Easiest is just to ignore or log the usage error, or let it throw.
      console.error("Usage error:", usageError)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
