"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Book } from "@/types"
import { Send, Bot, User, BookOpen, Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

function TutorChat() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ready")
        .order("created_at", { ascending: false })

      const readyBooks = (data ?? []) as Book[]
      setBooks(readyBooks)

      const bookId = searchParams.get("bookId")
      if (bookId && readyBooks.find((b) => b.id === bookId)) {
        setSelectedBookId(bookId)
      } else if (readyBooks.length > 0) {
        setSelectedBookId(readyBooks[0].id)
      }
    }
    load()
  }, [supabase, router, searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  const selectedBook = books.find((b) => b.id === selectedBookId)

  const handleSend = async () => {
    if (!input.trim() || !selectedBookId || isStreaming) return

    const userMsg: Message = { role: "user", content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsStreaming(true)

    const allMessages = [...messages, userMsg]

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBookId, messages: allMessages }),
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: assistantContent }
          return updated
        })
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-[#C8502A]" />
          <h1 className="text-white font-semibold">AI Tutor</h1>
        </div>
        {books.length > 0 && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <select
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value)
                setMessages([])
              }}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#C8502A]"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#1a1714]">
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <BookOpen className="w-12 h-12 mb-4 opacity-30" />
            <p>No books ready yet.</p>
            <p className="text-sm mt-1">Upload and process a book to start chatting.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-white font-medium mb-1">Ask anything about <span className="text-[#C8502A]">{selectedBook?.title}</span></p>
            <p className="text-sm">I'll answer based on the book's content.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#C8502A]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[#C8502A]" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#C8502A] text-white rounded-tr-sm"
                    : "bg-white/5 text-gray-200 rounded-tl-sm"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && msg.content === "" && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10 shrink-0">
        <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedBook ? `Ask about "${selectedBook.title}"...` : "Select a book to start..."}
            disabled={!selectedBookId || isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none focus:outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedBookId || isStreaming}
            className="w-8 h-8 rounded-lg bg-[#C8502A] disabled:opacity-40 flex items-center justify-center shrink-0 hover:bg-[#b04523] transition-colors"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

export default function TutorPage() {
  return (
    <Suspense>
      <TutorChat />
    </Suspense>
  )
}
