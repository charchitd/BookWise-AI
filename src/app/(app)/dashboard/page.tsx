"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { UploadDropzone } from "@/components/book/UploadDropzone"
import { Book } from "@/types"
import { BookOpen, Trash2, RefreshCw, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

function StatusBadge({ status }: { status: Book["status"] }) {
  if (status === "ready")
    return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Ready</span>
  if (status === "failed")
    return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" /> Failed</span>
  return <span className="flex items-center gap-1 text-xs text-amber-400"><Clock className="w-3 h-3 animate-spin" /> Processing</span>
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  const fetchBooks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setBooks((data as Book[]) ?? [])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchBooks()
    // Poll for processing books every 5 seconds
    const interval = setInterval(fetchBooks, 5000)
    return () => clearInterval(interval)
  }, [fetchBooks])

  const handleUpload = async (_url: string, bookId: string) => {
    toast.success("Book uploaded! Processing has started.")
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
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
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
    toast.info("Retrying ingestion...")
    fetchBooks()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-1">My Library</h1>
        <p className="text-gray-400">Upload a book PDF and let AI turn it into an interactive learning experience.</p>
      </div>

      <div className="mb-10">
        <UploadDropzone onUpload={handleUpload} />
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading your library...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No books yet. Upload your first PDF above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Your Books</h2>
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => book.status === "ready" && router.push(`/books/${book.id}`)}
              className={`group flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4 transition-colors ${
                book.status === "ready" ? "hover:bg-white/10 cursor-pointer" : "opacity-70"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-12 bg-[#C8502A]/20 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#C8502A]" />
                </div>
                <div>
                  <p className="text-white font-medium">{book.title ?? "Untitled Book"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <StatusBadge status={book.status} />
                    {book.total_pages && (
                      <span className="text-xs text-gray-500">{book.total_pages} pages</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {book.status === "failed" && (
                  <button
                    onClick={(e) => handleRetry(book.id, e)}
                    className="p-2 text-gray-400 hover:text-amber-400 transition-colors"
                    title="Retry ingestion"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(book.id, e)}
                  disabled={deletingId === book.id}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete book"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {book.status === "ready" && (
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
