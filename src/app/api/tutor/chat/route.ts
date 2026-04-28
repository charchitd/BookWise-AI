import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor-chat"
import { streamOpenRouter } from "@/lib/openrouter"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bookId, messages } = await req.json()
    if (!bookId || !messages?.length) {
      return NextResponse.json({ error: "Missing bookId or messages" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: book } = await admin.from("books").select("title").eq("id", bookId).eq("user_id", user.id).single()
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 })

    const { data: chapters } = await admin
      .from("chapters")
      .select("title, summary, num")
      .eq("book_id", bookId)
      .order("num")

    const context = (chapters ?? [])
      .map((c) => `Chapter ${c.num}: ${c.title}\n${c.summary ?? ""}`)
      .join("\n\n")

    const systemPrompt = buildTutorSystemPrompt(book.title ?? "this book", context)

    const openRouterMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ]

    const stream = await streamOpenRouter(openRouterMessages, "anthropic/claude-3.7-sonnet")

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error: any) {
    console.error("Tutor chat error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
