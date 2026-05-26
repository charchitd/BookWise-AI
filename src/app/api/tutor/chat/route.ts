import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"
import { buildTutorSystemPrompt } from "@/lib/prompts/tutor-chat"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bookId, messages, persona, chapterContext } = await req.json()
    if (!bookId || !messages?.length) {
      return NextResponse.json({ error: "Missing bookId or messages" }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch book data including title and storage_url
    const { data: book } = await admin
      .from("books")
      .select("title")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single()
      
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 })

    // 2. Fetch chapter contexts as a text fallback if PDF is missing or fails
    const { data: chapters } = await admin
      .from("chapters")
      .select("title, summary, num")
      .eq("book_id", bookId)
      .order("num")

    const chapterTextContext = (chapters ?? [])
      .map((c) => `Chapter ${c.num}: ${c.title}\n${c.summary ?? ""}`)
      .join("\n\n")

    // 3. Build system instructions combining book details and extensive domain knowledge
    const neoPersona = persona === "neo"
      ? `\n\nYou are "Neo", an enthusiastic anime-style study companion. Be highly conversational, concise, friendly, and energetic. Limit responses to 2-3 sentences so they sound natural when spoken aloud.`
      : ""
    const chapterFocus = chapterContext
      ? `\n\nThe user is currently studying Session ${chapterContext.num}: "${chapterContext.title}". Focus your answers on this topic.`
      : ""
    const systemPrompt = buildTutorSystemPrompt(book.title ?? "this book", chapterTextContext) + neoPersona + chapterFocus

    // 5. Initialize the official Gemini SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
    // Using gemini-2.5-flash which is extremely fast and natively multimodal (processes text & images inside PDFs!)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    })

    // 6. Map standard conversation history into Gemini SDK parts
    const geminiContents: any[] = []

    // Filter out any legacy fake-system messages injected as user role by old clients
    const cleanMessages = messages.filter(
      (m: { role: string; content: string }) => !m.content.startsWith("Note to AI:")
    )

    // Map remaining messages (role "assistant" -> "model", others -> "user")
    cleanMessages.forEach((m: { role: string; content: string }) => {
      geminiContents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })
    })

    // 7. Call model streaming content
    const result = await model.generateContentStream({
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7, // slightly creative and educational
      }
    })

    // 8. Stream the results back to the browser
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText))
            }
          }
        } catch (streamError) {
          console.error("Gemini stream reading error:", streamError)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error: any) {
    console.error("Tutor chat error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
