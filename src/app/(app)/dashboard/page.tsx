"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { UploadDropzone } from "@/components/book/UploadDropzone"
import { Book } from "@/types"
import {
  BookOpen, Trash2, RefreshCw, ChevronRight, Clock,
  CheckCircle2, XCircle, PlayCircle, Award, Plus,
  Sparkles, Library, GraduationCap, X
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

/* ── Helpers ─────────────────────────────────────── */
function getBookCoverClass(title: string) {
  const classes = ["book-cover-0","book-cover-1","book-cover-2","book-cover-3","book-cover-4","book-cover-5"]
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0
  return classes[hash % classes.length]
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function StatusBadge({ status }: { status: Book["status"] }) {
  if (status === "ready")
    return <span className="flex items-center gap-1 text-xs" style={{ color: "#34D399" }}><CheckCircle2 className="w-3 h-3" /> Ready</span>
  if (status === "failed")
    return <span className="flex items-center gap-1 text-xs" style={{ color: "#F87171" }}><XCircle className="w-3 h-3" /> Failed</span>
  return <span className="flex items-center gap-1 text-xs" style={{ color: "#F5A623" }}><Clock className="w-3 h-3 animate-spin" /> Processing…</span>
}

interface BookProgress { total: number; mastered: number; hasCert: boolean }

/* ── BookCard ─────────────────────────────────────── */
function BookCard({
  book, prog, onDelete, onRetry, deletingId
}: {
  book: Book
  prog?: BookProgress
  onDelete: (id: string, e: React.MouseEvent) => void
  onRetry:  (id: string, e: React.MouseEvent) => void
  deletingId: string | null
}) {
  const router = useRouter()
  const coverClass = getBookCoverClass(book.title ?? "book")
  const pct      = prog && prog.total > 0 ? Math.round((prog.mastered / prog.total) * 100) : 0
  const started  = !!prog && prog.mastered > 0
  const complete = pct === 100 && !!prog?.total

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-200 ${
        book.status === "ready" ? "cursor-pointer hover:-translate-y-0.5" : "opacity-70"
      }`}
      style={{
        background: "#13161E",
        border: complete ? "1px solid rgba(245,166,35,0.35)" : "1px solid #2A2F42",
        boxShadow: complete ? "0 0 20px rgba(245,166,35,0.08)" : "none",
      }}
      onClick={() => book.status === "ready" && router.push(`/books/${book.id}`)}
    >
      {/* Cover strip */}
      <div className={`h-2 w-full ${coverClass}`} />

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: "#F0F2F8" }}>
              {book.title ?? "Untitled Book"}
            </p>
            {book.total_pages && (
              <p className="text-xs mt-0.5" style={{ color: "#5C6480" }}>{book.total_pages} pages</p>
            )}
          </div>

          {complete && (
            <span
              className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
            >
              <Award className="w-3 h-3" /> Certified
            </span>
          )}
        </div>

        {/* Status */}
        <div className="mb-3">
          <StatusBadge status={book.status} />
        </div>

        {/* Progress bar */}
        {book.status === "ready" && prog && prog.total > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: "#5C6480" }}>
              <span>{prog.mastered}/{prog.total} concepts</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#252A3A" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: complete
                    ? "linear-gradient(90deg, #F5A623, #FF6B35)"
                    : "linear-gradient(90deg, #7C6FE0, #60A5FA)",
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
          {book.status === "ready" && (
            <Link
              href={`/books/${book.id}/course`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center"
              style={{
                background: complete ? "rgba(245,166,35,0.15)" : started ? "rgba(124,111,224,0.15)" : "rgba(255,255,255,0.06)",
                color:      complete ? "#F5A623"               : started ? "#A78BFA"               : "#9BA3BE",
                border:     complete ? "1px solid rgba(245,166,35,0.3)" : started ? "1px solid rgba(124,111,224,0.3)" : "1px solid #2A2F42",
              }}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              {complete ? "Review" : started ? `Continue ${pct}%` : "Start Course"}
            </Link>
          )}
          {book.status === "failed" && (
            <button
              onClick={e => onRetry(book.id, e)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#5C6480" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F5A623"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#5C6480"}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={e => onDelete(book.id, e)}
            disabled={deletingId === book.id}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "#5C6480" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F87171"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#5C6480"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {book.status === "ready" && (
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: "#9BA3BE" }} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── StatCard ─────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background: "#13161E", border: "1px solid #2A2F42" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "#F0F2F8" }}>{value}</p>
        <p className="text-xs" style={{ color: "#5C6480" }}>{label}</p>
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────── */
function BookSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#13161E", border: "1px solid #2A2F42" }}>
      <div className="h-2 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded shimmer" />
        <div className="h-3 w-1/4 rounded shimmer" />
        <div className="h-1 w-full rounded shimmer" />
        <div className="h-7 w-full rounded-lg shimmer" />
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────── */
export default function DashboardPage() {
  const [books,      setBooks]      = useState<Book[]>([])
  const [progress,   setProgress]   = useState<Record<string, BookProgress>>({})
  const [loading,    setLoading]    = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [displayName, setDisplayName] = useState("Scholar")
  const router  = useRouter()
  const supabase = createBrowserClient()

  const fetchBooks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const [profileRes, booksRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ])

    if (profileRes.data?.display_name) setDisplayName(profileRes.data.display_name)

    const bookList = (booksRes.data as Book[]) ?? []
    setBooks(bookList)
    setLoading(false)

    const readyIds = bookList.filter(b => b.status === "ready").map(b => b.id)
    if (readyIds.length === 0) return

    const [conceptsRes, certsRes] = await Promise.all([
      supabase.from("concepts").select("book_id, mastery_state").in("book_id", readyIds),
      supabase.from("certificates").select("book_id").eq("user_id", user.id).in("book_id", readyIds),
    ])

    const prog: Record<string, BookProgress> = {}
    for (const id of readyIds) {
      const bc = (conceptsRes.data ?? []).filter(c => c.book_id === id)
      prog[id] = {
        total:    bc.length,
        mastered: bc.filter(c => c.mastery_state === "mastered").length,
        hasCert:  (certsRes.data ?? []).some(c => c.book_id === id),
      }
    }
    setProgress(prog)
  }, [supabase, router])

  useEffect(() => {
    fetchBooks()
    const interval = setInterval(fetchBooks, 5000)
    return () => clearInterval(interval)
  }, [fetchBooks])

  const handleUpload = async (_url: string, bookId: string) => {
    toast.success("Book uploaded! Processing has started.")
    setShowUpload(false)
    await fetch("/api/books/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    })
    fetchBooks()
  }

  const handleDelete = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(bookId)
    const res = await fetch(`/api/books?id=${bookId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Book removed.")
      setBooks(prev => prev.filter(b => b.id !== bookId))
    } else {
      toast.error("Failed to delete book.")
    }
    setDeletingId(null)
  }

  const handleRetry = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch("/api/books/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    })
    toast.info("Retrying ingestion…")
    fetchBooks()
  }

  const readyBooks      = books.filter(b => b.status === "ready")
  const conceptsMastered = Object.values(progress).reduce((a, p) => a + p.mastered, 0)
  const certCount        = Object.values(progress).filter(p => p.hasCert).length

  return (
    <div className="min-h-full p-8 animate-fade-up" style={{ maxWidth: 960, margin: "0 auto" }}>

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm mb-1" style={{ color: "#5C6480" }}>
            <Sparkles className="inline w-3.5 h-3.5 mr-1" style={{ color: "#F5A623" }} />
            {getTimeOfDay()}, {displayName}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#F0F2F8", fontFamily: "'Playfair Display', serif" }}>
            Your Library
          </h1>
        </div>

        <button
          onClick={() => setShowUpload(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: showUpload ? "#3D2E10" : "linear-gradient(135deg, #F5A623, #FF6B35)",
            color:      showUpload ? "#F5A623" : "#0D0F14",
            boxShadow:  showUpload ? "none" : "0 0 20px rgba(245,166,35,0.3)",
          }}
        >
          {showUpload ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUpload ? "Cancel" : "Add Book"}
        </button>
      </div>

      {/* ── Stats ────────────────────────────────── */}
      {!loading && books.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Books in Library"     value={books.length}      icon={Library}        color="#7C6FE0" />
          <StatCard label="Concepts Mastered"    value={conceptsMastered}  icon={BookOpen}       color="#34D399" />
          <StatCard label="Certificates Earned"  value={certCount}         icon={GraduationCap}  color="#F5A623" />
        </div>
      )}

      {/* ── Upload panel ─────────────────────────── */}
      {showUpload && (
        <div
          className="mb-8 p-5 rounded-2xl"
          style={{ background: "#13161E", border: "1px solid #2A2F42" }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: "#F0F2F8" }}>Upload a PDF book</p>
          <UploadDropzone onUpload={handleUpload} />
        </div>
      )}

      {/* ── Books grid ───────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <BookSkeleton key={i} />)}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}
          >
            <BookOpen className="w-9 h-9" style={{ color: "#F5A623", opacity: 0.7 }} />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: "#F0F2F8" }}>Your library awaits</p>
          <p className="text-sm mb-6" style={{ color: "#5C6480" }}>Upload a PDF and let AI turn it into an interactive course.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #F5A623, #FF6B35)", color: "#0D0F14", boxShadow: "0 0 20px rgba(245,166,35,0.3)" }}
          >
            <Plus className="w-4 h-4" /> Add your first book
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#5C6480" }}>
            {books.length} {books.length === 1 ? "Course" : "Courses"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => (
              <BookCard
                key={book.id}
                book={book}
                prog={progress[book.id]}
                onDelete={handleDelete}
                onRetry={handleRetry}
                deletingId={deletingId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
