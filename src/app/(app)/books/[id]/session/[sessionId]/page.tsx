import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import SessionViewer from "@/components/session-viewer"

export default async function SessionPage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
  const { id, sessionId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const admin = createAdminClient()

  const { data: book } = await admin
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!book) return notFound()

  const { data: chapter } = await admin
    .from("chapters")
    .select("*, concepts(*)")
    .eq("id", sessionId)
    .eq("book_id", id)
    .single()

  if (!chapter) return notFound()

  const { data: allChapters } = await admin
    .from("chapters")
    .select("id")
    .eq("book_id", id)
    .order("num")

  let prevChapterId = null
  let nextChapterId = null

  if (allChapters) {
    const currentIndex = allChapters.findIndex(c => c.id === sessionId)
    if (currentIndex > 0) prevChapterId = allChapters[currentIndex - 1].id
    if (currentIndex < allChapters.length - 1) nextChapterId = allChapters[currentIndex + 1].id
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <SessionViewer 
        book={book} 
        chapter={chapter} 
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
      />
    </div>
  )
}
