"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"
import { Book, Chapter, Concept } from "@/types"
import {
  BookOpen, MessageSquare, Brain, ChevronLeft,
  ChevronDown, ChevronUp, Star, Zap, Target
} from "lucide-react"

function DifficultyDots({ level }: { level: number | null }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= (level ?? 0) ? "bg-[#C8502A]" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  )
}

function MasteryBadge({ state }: { state: Concept["mastery_state"] }) {
  const styles: Record<string, string> = {
    mastered: "bg-emerald-500/20 text-emerald-400",
    learning: "bg-amber-500/20 text-amber-400",
    new: "bg-white/10 text-gray-400",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[state ?? "new"]}`}>
      {state ?? "new"}
    </span>
  )
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const [bookRes, chapterRes, conceptRes] = await Promise.all([
        supabase.from("books").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase.from("chapters").select("*").eq("book_id", id).order("num"),
        supabase.from("concepts").select("*").eq("book_id", id),
      ])

      if (!bookRes.data) { router.push("/dashboard"); return }
      setBook(bookRes.data as Book)
      setChapters((chapterRes.data ?? []) as Chapter[])
      setConcepts((conceptRes.data ?? []) as Concept[])
      setLoading(false)
    }
    load()
  }, [id, supabase, router])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-500">Loading book details...</div>
      </div>
    )
  }

  if (!book) return null

  const masteredCount = concepts.filter((c) => c.mastery_state === "mastered").length
  const masteryPct = concepts.length > 0 ? Math.round((masteredCount / concepts.length) * 100) : 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Library
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-20 bg-[#C8502A]/20 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-8 h-8 text-[#C8502A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{book.title}</h1>
            {book.author && <p className="text-gray-400 text-sm mb-2">{book.author}</p>}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {book.total_pages && <span>{book.total_pages} pages</span>}
              <span>{chapters.length} chapters</span>
              <span>{concepts.length} concepts</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 shrink-0">
          <Link
            href={`/tutor?bookId=${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> Study with Tutor
          </Link>
          <Link
            href={`/quiz?bookId=${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8502A] text-white text-sm rounded-lg hover:bg-[#b04523] transition-colors"
          >
            <Brain className="w-4 h-4" /> Take a Quiz
          </Link>
        </div>
      </div>

      {/* Mastery progress */}
      {concepts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Target className="w-4 h-4 text-[#C8502A]" /> Knowledge Mastery
            </div>
            <span className="text-sm text-gray-400">{masteredCount}/{concepts.length} mastered</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8502A] rounded-full transition-all"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{masteryPct}% complete</p>
        </div>
      )}

      {/* Chapters */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Chapters</h2>
        <div className="space-y-2">
          {chapters.map((ch) => {
            const chapterConcepts = concepts.filter((c) => c.chapter_id === ch.id)
            const isOpen = expandedChapter === ch.id
            return (
              <div key={ch.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedChapter(isOpen ? null : ch.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 w-6 text-center font-mono">{ch.num}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{ch.title ?? `Chapter ${ch.num}`}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <DifficultyDots level={ch.difficulty} />
                        {chapterConcepts.length > 0 && (
                          <span className="text-xs text-gray-500">{chapterConcepts.length} concepts</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    {ch.summary && (
                      <p className="text-sm text-gray-300 leading-relaxed">{ch.summary}</p>
                    )}
                    {chapterConcepts.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Concepts</p>
                        <div className="flex flex-wrap gap-2">
                          {chapterConcepts.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                              <span className="text-sm text-gray-200">{c.name}</span>
                              <MasteryBadge state={c.mastery_state} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* All Concepts */}
      {concepts.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">All Concepts</h2>
          <div className="flex flex-wrap gap-2">
            {concepts.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-gray-200">{c.name}</span>
                <MasteryBadge state={c.mastery_state} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
