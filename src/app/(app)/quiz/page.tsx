"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Book } from "@/types"
import { Brain, BookOpen, Loader2, CheckCircle2, XCircle, Trophy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Question {
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

type QuizState = "idle" | "loading" | "active" | "summary"

function QuizContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState("")
  const [quizState, setQuizState] = useState<QuizState>("idle")
  const [questions, setQuestions] = useState<Question[]>([])
  const [conceptIds, setConceptIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

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

  const startQuiz = async () => {
    if (!selectedBookId) return
    setQuizState("loading")
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBookId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestions(data.questions)
      setConceptIds(data.conceptIds)
      setCurrentIndex(0)
      setResults([])
      setSelectedOption(null)
      setShowExplanation(false)
      setQuizState("active")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to generate quiz")
      setQuizState("idle")
    }
  }

  const handleAnswer = async (optionIndex: number) => {
    if (selectedOption !== null) return
    setSelectedOption(optionIndex)
    setShowExplanation(true)

    const q = questions[currentIndex]
    const isCorrect = optionIndex === q.correct_index

    // Record answer
    await fetch("/api/quiz/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: selectedBookId,
        questionJson: q,
        selectedIndex: optionIndex,
        correctIndex: q.correct_index,
        conceptIds,
      }),
    })

    setResults((prev) => [...prev, isCorrect])
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizState("summary")
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
      setShowExplanation(false)
    }
  }

  const q = questions[currentIndex]
  const score = results.filter(Boolean).length
  const selectedBook = books.find((b) => b.id === selectedBookId)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Brain className="w-6 h-6 text-[#C8502A]" />
        <h1 className="text-2xl font-bold text-white">Knowledge Quiz</h1>
      </div>

      {/* Book selector */}
      {quizState === "idle" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <Brain className="w-12 h-12 text-[#C8502A] mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg mb-2">Test Your Knowledge</h2>
          <p className="text-gray-400 text-sm mb-6">
            We'll generate questions from your book's key concepts to test and improve your mastery.
          </p>

          {books.length === 0 ? (
            <p className="text-gray-500 text-sm">No books available. Upload and process a book first.</p>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 mb-6">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-[#C8502A]"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#1a1714]">
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={startQuiz}
                className="px-8 py-3 bg-[#C8502A] text-white font-semibold rounded-xl hover:bg-[#b04523] transition-colors"
              >
                Start Quiz
              </button>
            </>
          )}
        </div>
      )}

      {/* Loading */}
      {quizState === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#C8502A] mb-4" />
          <p>Generating questions from <span className="text-white">{selectedBook?.title}</span>...</p>
        </div>
      )}

      {/* Active quiz */}
      {quizState === "active" && q && (
        <div>
          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{results.filter(Boolean).length} correct so far</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-[#C8502A] rounded-full transition-all"
              style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
            <p className="text-white font-medium text-lg leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let style = "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
              if (selectedOption !== null) {
                if (i === q.correct_index) style = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                else if (i === selectedOption) style = "bg-red-500/20 border-red-500/50 text-red-300"
                else style = "bg-white/5 border-white/5 text-gray-500"
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left px-5 py-4 border rounded-xl text-sm transition-colors ${style}`}
                >
                  <span className="font-mono text-xs mr-3 opacity-60">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`rounded-xl p-4 mb-4 text-sm ${
              selectedOption === q.correct_index
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}>
              <div className="flex items-center gap-2 mb-1 font-medium">
                {selectedOption === q.correct_index ? (
                  <><CheckCircle2 className="w-4 h-4" /> Correct!</>
                ) : (
                  <><XCircle className="w-4 h-4" /> Incorrect</>
                )}
              </div>
              <p className="text-gray-300">{q.explanation}</p>
            </div>
          )}

          {selectedOption !== null && (
            <button
              onClick={handleNext}
              className="w-full py-3 bg-[#C8502A] text-white font-semibold rounded-xl hover:bg-[#b04523] transition-colors"
            >
              {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {quizState === "summary" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <Trophy className="w-14 h-14 text-[#C8502A] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-1">{score}/{questions.length}</h2>
          <p className="text-gray-400 mb-2">
            {score === questions.length
              ? "Perfect score! Outstanding work."
              : score >= questions.length / 2
              ? "Good job! Keep studying to master the rest."
              : "Keep at it — the more you practice, the better you'll get."}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Mastery states updated for concepts you answered correctly.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={startQuiz}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C8502A] text-white rounded-xl hover:bg-[#b04523] transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => setQuizState("idle")}
              className="px-6 py-2.5 bg-white/5 border border-white/10 text-gray-200 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Change Book
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense>
      <QuizContent />
    </Suspense>
  )
}
