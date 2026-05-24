import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"
import { buildQuizPrompt } from "@/lib/prompts/quiz-gen"
import { callOpenRouter } from "@/lib/openrouter"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bookId, chapterId } = await req.json()
    if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 })

    const admin = createAdminClient()

    const { data: book } = await admin.from("books").select("id").eq("id", bookId).eq("user_id", user.id).single()
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 })

    let conceptQuery = admin
      .from("concepts")
      .select("id, name, mastery_state, chapter_id")
      .eq("book_id", bookId)
      .order("mastery_state")

    if (chapterId) conceptQuery = conceptQuery.eq("chapter_id", chapterId)

    const { data: concepts } = await conceptQuery.limit(15)

    if (!concepts?.length) {
      return NextResponse.json({ error: "No concepts found for this book" }, { status: 404 })
    }

    let chapQuery = admin.from("chapters").select("title, summary, num").eq("book_id", bookId)
    if (chapterId) chapQuery = chapQuery.eq("id", chapterId)
    const { data: chapters } = await chapQuery

    const chapterSummaries = (chapters ?? [])
      .map((c) => `Chapter ${c.num}: ${c.title}\n${c.summary ?? ""}`)
      .join("\n\n")

    const conceptNames = concepts.map((c) => c.name ?? "").filter(Boolean)
    const { systemPrompt, userPrompt } = buildQuizPrompt(conceptNames, chapterSummaries)

    // Use gemini-flash via OpenRouter for fast, cheap quiz generation
    const raw = await callOpenRouter(systemPrompt, userPrompt, "google/gemini-2.5-flash")

    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const questions = JSON.parse(cleaned)

    return NextResponse.json({ questions, conceptIds: concepts.map((c) => c.id) })
  } catch (error: any) {
    console.error("Quiz generate error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
