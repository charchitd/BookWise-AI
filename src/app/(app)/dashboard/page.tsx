"use client"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UploadDropzone } from "@/components/book/UploadDropzone"
import { Loader2, Library, AlertCircle, Trash2 } from "lucide-react"

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [books, setBooks] = useState<any[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [isRetrying, setIsRetrying] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? null)
        const { data: userBooks } = await supabase.from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          
        if (userBooks) {
          setBooks(userBooks)
          
          if (userBooks.some(b => b.status === 'processing')) {
            timeoutId = setTimeout(loadData, 3000)
          }
        }
      }
      setIsLoadingBooks(false)
    }
    
    loadData()
    return () => clearTimeout(timeoutId)
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleUpload = async (storageUrl: string, bookId: string) => {
    // We let the local polling pick up the processing visually
    const { data: { user } } = await supabase.auth.getUser()
    
    // We update local state to 'processing' manually immediately 
    // so the UI feels snappy and polling starts
    setBooks(prev => {
      if (!prev.find(p => p.id === bookId)) {
        return [{ id: bookId, title: "New Upload", status: 'processing', created_at: new Date().toISOString() }, ...prev]
      }
      return prev
    })

    try {
      fetch('/api/books/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, userId: user?.id })
      })
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleRetry = async (bookId: string) => {
    setIsRetrying(bookId)
    // update local array to trigger processing UI
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'processing' } : b))
    try {
      await fetch('/api/books/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      })
    } catch (e) {
      console.error("Retry failed", e)
    }
    setIsRetrying(null)
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book? This cannot be undone.")) return
    
    setIsDeleting(bookId)
    try {
      const res = await fetch(`/api/books?id=${bookId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setBooks(prev => prev.filter(b => b.id !== bookId))
      } else {
        const err = await res.json()
        alert("Failed to delete book: " + err.error)
      }
    } catch (e) {
      console.error("Delete failed", e)
    }
    setIsDeleting(null)
  }

  if (isLoadingBooks) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-[#C8502A] text-2xl font-bold">BookWise AI</h1>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign out
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="w-full max-w-2xl space-y-6 mt-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to your Personal AI Tutor</h1>
            <p className="text-gray-500 mt-3 text-lg">Get started by uploading your first PDF document to generate an automated curriculum.</p>
          </div>
          <div className="pt-8">
            <UploadDropzone onUpload={handleUpload} />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <Library className="w-6 h-6 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">Your Library</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {books.map(b => (
                <div key={b.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <h3 className="font-semibold text-gray-900 truncate" title={b.title}>{b.title}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-4">
                    {b.status === 'failed' ? (
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                           <AlertCircle className="w-4 h-4" />
                           <span className="text-sm font-semibold max-sm:hidden">Ingestion failed</span>
                           <Button 
                             size="sm" 
                             variant="destructive" 
                             onClick={() => handleRetry(b.id)} 
                             disabled={isRetrying === b.id || isDeleting === b.id}
                             className="ml-2 h-7 px-3 text-xs"
                           >
                              {isRetrying === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Retry'}
                           </Button>
                        </div>
                    ) : b.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">
                           <Loader2 className="w-4 h-4 animate-spin" />
                           <span className="text-sm font-medium">Analysing your book...</span>
                        </div>
                    ) : (
                        <span className="text-xs font-semibold tracking-wide px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                          READY
                        </span>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 h-auto rounded-md transition-colors"
                      onClick={() => handleDelete(b.id)}
                      disabled={isDeleting === b.id}
                      title="Delete book"
                    >
                      {isDeleting === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Add New Book</h3>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <UploadDropzone onUpload={handleUpload} />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
