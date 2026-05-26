import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { chapterId } = await req.json()
    if (!chapterId) return NextResponse.json({ error: "Missing chapterId" }, { status: 400 })

    const admin = createAdminClient()

    // Get the chapter to find bookId
    const { data: chapter } = await admin
      .from("chapters")
      .select("book_id")
      .eq("id", chapterId)
      .single()

    // Mark all concepts in this chapter as mastered
    const { error } = await admin
      .from("concepts")
      .update({ mastery_state: "mastered" })
      .eq("chapter_id", chapterId)

    if (error) {
      console.error("Failed to complete session:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Check if entire course is now complete → issue certificate
    let certificateIssued = false
    if (chapter?.book_id) {
      const { data: allConcepts } = await admin
        .from("concepts")
        .select("mastery_state")
        .eq("book_id", chapter.book_id)

      const allMastered = allConcepts && allConcepts.length > 0 && allConcepts.every(c => c.mastery_state === "mastered")

      if (allMastered) {
        const { data: existing } = await admin
          .from("certificates")
          .select("id")
          .eq("user_id", user.id)
          .eq("book_id", chapter.book_id)
          .single()

        if (!existing) {
          const [{ data: book }, { data: profile }, { data: topConcepts }] = await Promise.all([
            admin.from("books").select("title").eq("id", chapter.book_id).single(),
            admin.from("profiles").select("display_name").eq("id", user.id).single(),
            admin.from("concepts").select("name").eq("book_id", chapter.book_id).limit(5),
          ])

          const { error: certError } = await admin.from("certificates").upsert({
            user_id: user.id,
            book_id: chapter.book_id,
            book_title: book?.title ?? "Untitled",
            display_name: profile?.display_name ?? "Scholar",
            top_concepts: topConcepts?.map(c => c.name) ?? [],
          }, { onConflict: "user_id,book_id", ignoreDuplicates: true })

          // Only award XP when a new certificate was actually inserted
          if (!certError) {
            await admin.rpc("increment_learning_minutes", {
              user_uuid: user.id,
              minutes_to_add: 100,
            })
            certificateIssued = true
          }
        }
      }
    }

    return NextResponse.json({ success: true, certificateIssued })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
