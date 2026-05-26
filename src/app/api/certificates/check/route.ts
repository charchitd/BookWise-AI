import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bookId } = await req.json()
    if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 })

    const admin = createAdminClient()

    // Check if all concepts for the book are mastered
    const { data: concepts } = await admin
      .from("concepts")
      .select("mastery_state")
      .eq("book_id", bookId)

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ issued: false, reason: "no_concepts" })
    }

    const allMastered = concepts.every(c => c.mastery_state === "mastered")
    if (!allMastered) {
      return NextResponse.json({ issued: false, reason: "incomplete" })
    }

    // Check if already issued
    const { data: existing } = await admin
      .from("certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .single()

    if (existing) {
      return NextResponse.json({ issued: false, reason: "already_exists" })
    }

    // Fetch book + profile + top concepts
    const [{ data: book }, { data: profile }, { data: topConcepts }] = await Promise.all([
      admin.from("books").select("title").eq("id", bookId).single(),
      admin.from("profiles").select("display_name").eq("id", user.id).single(),
      admin.from("concepts").select("name").eq("book_id", bookId).limit(5),
    ])

    const { data: cert, error } = await admin
      .from("certificates")
      .upsert({
        user_id: user.id,
        book_id: bookId,
        book_title: book?.title ?? "Untitled",
        display_name: profile?.display_name ?? "Scholar",
        top_concepts: topConcepts?.map(c => c.name) ?? [],
      }, { onConflict: "user_id,book_id", ignoreDuplicates: false })
      .select()
      .single()

    if (error) {
      console.error("Certificate issue error:", error)
      return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 })
    }

    // Award 200 bonus XP only after confirmed certificate insert
    await admin.rpc("increment_learning_minutes", {
      user_uuid: user.id,
      minutes_to_add: 100, // 200 XP bonus
    })

    return NextResponse.json({ issued: true, certificate: cert })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
