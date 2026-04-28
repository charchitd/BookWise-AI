import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bookId, chapterId, questionJson, selectedIndex, correctIndex, conceptIds } = await req.json()
    const isCorrect = selectedIndex === correctIndex

    const admin = createAdminClient()

    // Record quiz attempt
    await admin.from("quiz_attempts").insert({
      user_id: user.id,
      book_id: bookId,
      chapter_id: chapterId ?? null,
      question_json: questionJson,
      selected_index: selectedIndex,
      correct_index: correctIndex,
      is_correct: isCorrect,
    })

    // Update mastery state for a sampled concept if answer was correct
    if (isCorrect && conceptIds?.length) {
      const conceptId = conceptIds[Math.floor(Math.random() * conceptIds.length)]
      const { data: concept } = await admin
        .from("concepts")
        .select("mastery_state, correct_attempts")
        .eq("id", conceptId)
        .single()

      if (concept) {
        const newAttempts = (concept.correct_attempts ?? 0) + 1
        const newState =
          newAttempts >= 3 ? "mastered" : newAttempts >= 1 ? "learning" : "new"

        await admin.from("concepts").update({
          mastery_state: newState,
          correct_attempts: newAttempts,
          last_tested: new Date().toISOString(),
        }).eq("id", conceptId)
      }
    }

    return NextResponse.json({ isCorrect })
  } catch (error: any) {
    console.error("Quiz answer error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
