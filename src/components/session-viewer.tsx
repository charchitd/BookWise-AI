"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Send, Bot, Loader2, CheckCircle, ArrowLeft, ArrowRight,
  BookOpen, Zap, Flame, Award, X, Volume2, Brain, FileText,
  Mic, MicOff, VolumeX
} from "lucide-react"
import TimerWidget from "@/components/timer-widget"
import AudioPlayer from "@/components/audio-player"

interface XpToast { id: number; xp: number; streak: number }
type LeftTab = "notes" | "audio" | "quiz"

interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export default function SessionViewer({
  book, chapter, prevChapterId, nextChapterId,
}: {
  book: any; chapter: any
  prevChapterId?: string | null; nextChapterId?: string | null
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [xpToasts, setXpToasts] = useState<XpToast[]>([])
  const [leftTab, setLeftTab] = useState<LeftTab>("notes")
  const [certModal, setCertModal] = useState(false)

  // Voice Chat state
  const [isListening, setIsListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizResults, setQuizResults] = useState<boolean[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizDone, setQuizDone] = useState(false)

  const toastCounter = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const initialCompleted = chapter.concepts?.length > 0 && chapter.concepts.every((c: any) => c.mastery_state === "mastered")
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const speakResponse = (text: string) => {
    if (!voiceMode || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  const showXpToast = (xp: number, streak: number) => {
    const id = ++toastCounter.current
    setXpToasts(prev => [...prev, { id, xp, streak }])
    setTimeout(() => setXpToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const handleSyncTime = async (minutes: number) => {
    try {
      const res = await fetch("/api/stats/sync-time", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.xp_earned) showXpToast(data.xp_earned, data.streak ?? 0)
      }
    } catch (e) { console.error("Failed to sync time", e) }
  }

  const handleMarkAsDone = async () => {
    setIsCompleting(true)
    try {
      const res = await fetch("/api/courses/complete-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      })
      if (res.ok) {
        setIsCompleted(true)
        const data = await res.json()
        if (data.certificateIssued) setCertModal(true)
      }
    } catch (e) { console.error("Failed to complete session", e) }
    finally { setIsCompleting(false) }
  }

  // Quiz
  const loadQuiz = async () => {
    setQuizLoading(true)
    setQuizQuestions([])
    setQuizIndex(0)
    setQuizSelected(null)
    setQuizResults([])
    setShowExplanation(false)
    setQuizDone(false)
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, chapterId: chapter.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuizQuestions(data.questions)
    } catch (e: any) {
      console.error("Quiz load failed:", e.message)
    } finally { setQuizLoading(false) }
  }

  const handleQuizAnswer = async (idx: number) => {
    if (quizSelected !== null) return
    setQuizSelected(idx)
    setShowExplanation(true)
    const correct = idx === quizQuestions[quizIndex].correct_index
    const newResults = [...quizResults, correct]
    setQuizResults(newResults)

    // Update mastery if correct
    if (correct && chapter.concepts?.[quizIndex]) {
      await fetch("/api/quiz/answer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: chapter.concepts[quizIndex]?.id,
          correct: true, attemptNumber: 1,
        }),
      })
    }
  }

  const nextQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizDone(true)
    } else {
      setQuizIndex(q => q + 1)
      setQuizSelected(null)
      setShowExplanation(false)
    }
  }

  // Chat
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return
    const userMsg = { role: "user", content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsStreaming(true)

    const allMessages = [
      { role: "user", content: `Note to AI: I am studying Session ${chapter.num}: "${chapter.title}". Focus answers on this topic.` },
      ...messages, userMsg,
    ]

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, messages: allMessages }),
      })
      if (!res.body) throw new Error("No response body")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let content = ""
      setMessages(prev => [...prev, { role: "assistant", content: "" }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content }; return u })
      }
      speakResponse(content)
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }])
    } finally { setIsStreaming(false) }
  }

  const audioText = [
    `Session ${chapter.num}: ${chapter.title}.`,
    chapter.summary || "",
    chapter.concepts?.map((c: any) => c.name).join(". ") || "",
  ].filter(Boolean).join(" ")

  const score = quizResults.length > 0 ? Math.round((quizResults.filter(Boolean).length / quizResults.length) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-5rem)] relative">

      {/* Certificate Modal */}
      {certModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative bg-card border border-yellow-500/40 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <button onClick={() => setCertModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Course Complete!</div>
            <h2 className="text-2xl font-extrabold text-white mb-2">{book.title}</h2>
            <p className="text-gray-400 mb-5">
              You've mastered all sessions and earned a <span className="text-yellow-400 font-semibold">Certificate of Completion</span> + <span className="text-yellow-400 font-bold">+200 XP bonus</span>!
            </p>
            <a href="/certificates" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg">
              <Award className="w-4 h-4" /> View My Certificate
            </a>
          </div>
        </div>
      )}

      {/* XP Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {xpToasts.map(toast => (
          <div key={toast.id} className="animate-in slide-in-from-right-4 fade-in duration-300 bg-card border border-yellow-500/30 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-1 text-yellow-400"><Zap className="w-4 h-4" /><span className="font-bold text-sm">+{toast.xp} XP</span></div>
            {toast.streak > 1 && <div className="flex items-center gap-1 text-orange-400 border-l border-white/10 pl-3"><Flame className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{toast.streak}d streak</span></div>}
          </div>
        ))}
      </div>

      {/* LEFT PANEL */}
      <div className="border-r border-white/10 flex flex-col bg-card/30 overflow-hidden">

        {/* Session header */}
        <div className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Session {chapter.num}</span>
              <TimerWidget onComplete={handleMarkAsDone} onSyncTime={handleSyncTime} />
            </div>
            <Link href={`/books/${book.id}/course`} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground bg-white/5 px-2 py-1 rounded-md transition-colors">
              <BookOpen className="w-3 h-3" /> Course
            </Link>
          </div>
          <h2 className="text-3xl font-bold mb-3">{chapter.title}</h2>
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg text-sm w-fit">
                <CheckCircle className="w-4 h-4" /><span className="font-semibold">Completed</span>
              </div>
            ) : (
              <button onClick={handleMarkAsDone} disabled={isCompleting}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
                {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Mark as Done
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 flex gap-1 border-b border-white/10 shrink-0">
          {([
            { id: "notes", label: "Study Notes", icon: FileText },
            { id: "audio", label: "Audio", icon: Volume2 },
            { id: "quiz", label: "Quiz", icon: Brain },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setLeftTab(id); if (id === "quiz" && quizQuestions.length === 0 && !quizLoading) loadQuiz() }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                leftTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {leftTab === "notes" && (
            <>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-semibold mb-3 text-primary">Summary</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                  {chapter.summary || "No summary available."}
                </p>
              </div>

              {chapter.concepts?.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-base font-semibold mb-3">Key Concepts</h3>
                  <div className="flex flex-wrap gap-2">
                    {chapter.concepts.map((c: any) => (
                      <span key={c.id} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border ${
                        c.mastery_state === "mastered"
                          ? "bg-green-500/20 text-green-400 border-green-500/20"
                          : "bg-white/5 text-muted-foreground border-white/10"
                      }`}>
                        {c.mastery_state === "mastered" ? "✓ " : ""}{c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 pb-6">
                {prevChapterId ? (
                  <Link href={`/books/${book.id}/session/${prevChapterId}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </Link>
                ) : <div />}
                {nextChapterId ? (
                  <Link href={`/books/${book.id}/session/${nextChapterId}`} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all font-medium text-sm">
                    Next Session <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="text-sm text-green-500 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Course Complete!
                  </div>
                )}
              </div>
            </>
          )}

          {leftTab === "audio" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Listen to the session summary. Start the audio and follow along with the highlighted transcript.
              </p>
              <AudioPlayer text={audioText} title={chapter.title} />
            </div>
          )}

          {leftTab === "quiz" && (
            <div>
              {quizLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Generating quiz questions from this session…</p>
                </div>
              )}

              {!quizLoading && quizQuestions.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground mb-4">Could not generate quiz. The session may still be processing.</p>
                  <button onClick={loadQuiz} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    Try Again
                  </button>
                </div>
              )}

              {!quizLoading && quizQuestions.length > 0 && !quizDone && (
                <div className="space-y-5">
                  {/* Progress */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Question {quizIndex + 1} of {quizQuestions.length}</span>
                    <span>{quizResults.filter(Boolean).length} correct</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }} />
                  </div>

                  {/* Question */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="font-semibold text-white leading-relaxed">{quizQuestions[quizIndex].question}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {quizQuestions[quizIndex].options.map((opt, i) => {
                      const isCorrect = i === quizQuestions[quizIndex].correct_index
                      const isSelected = i === quizSelected
                      let cls = "bg-white/5 border-white/10 text-foreground hover:bg-white/10"
                      if (quizSelected !== null) {
                        if (isCorrect) cls = "bg-green-500/20 border-green-500/40 text-green-400"
                        else if (isSelected) cls = "bg-red-500/20 border-red-500/40 text-red-400"
                        else cls = "bg-white/5 border-white/5 text-muted-foreground opacity-60"
                      }
                      return (
                        <button key={i} onClick={() => handleQuizAnswer(i)} disabled={quizSelected !== null}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${cls}`}>
                          <span className="font-mono text-xs mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>{opt}
                        </button>
                      )
                    })}
                  </div>

                  {showExplanation && (
                    <div className={`rounded-xl px-4 py-3 text-sm border ${quizResults[quizResults.length - 1] ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
                      <span className="font-semibold mr-1">{quizResults[quizResults.length - 1] ? "✓ Correct!" : "✗ Incorrect."}</span>
                      {quizQuestions[quizIndex].explanation}
                    </div>
                  )}

                  {quizSelected !== null && (
                    <button onClick={nextQuestion} className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                      {quizIndex + 1 >= quizQuestions.length ? "See Results" : "Next Question →"}
                    </button>
                  )}
                </div>
              )}

              {quizDone && (
                <div className="text-center py-8 space-y-4">
                  <div className={`text-5xl font-extrabold ${score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                    {score}%
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {quizResults.filter(Boolean).length} / {quizResults.length} correct
                  </p>
                  <p className="text-foreground font-medium">
                    {score >= 80 ? "🎉 Excellent! You've mastered this session." : score >= 50 ? "👍 Good effort! Review the concepts and try again." : "📚 Keep studying — revisit the summary and retake."}
                  </p>
                  <button onClick={loadQuiz} className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors">
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: AI Chat */}
      <div className="flex flex-col bg-background relative h-full">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-card/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
          <Bot className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <h1 className="text-foreground font-semibold">Session Tutor</h1>
            <p className="text-xs text-muted-foreground">Ask anything about this session</p>
          </div>
          <button 
            onClick={() => {
              if (voiceMode && window.speechSynthesis) window.speechSynthesis.cancel()
              setVoiceMode(!voiceMode)
            }}
            className={`p-2 rounded-xl transition-all ${voiceMode ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
            title={voiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
          >
            {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-20 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-medium">Your AI tutor is ready.</p>
              <p className="text-sm mt-1">Ask for explanations, examples, or a deep dive into any concept.</p>
              <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-xs">
                {["Explain this session in simple terms", "Give me a real-world example", "What's the most important concept here?"].map(p => (
                  <button key={p} onClick={() => setInput(p)}
                    className="text-xs text-left px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white/5 text-foreground rounded-tl-sm border border-white/10"
                }`}>
                  {msg.content}
                  {msg.role === "assistant" && msg.content === "" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-background absolute bottom-0 left-0 right-0">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-2 focus-within:border-primary/50 transition-colors">
            <button onClick={toggleListening} disabled={isStreaming}
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "hover:bg-white/10 text-muted-foreground"
              }`}>
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask for clarification or examples…" disabled={isStreaming} rows={1}
              className="flex-1 bg-transparent text-sm placeholder-muted-foreground resize-none focus:outline-none max-h-32 py-2.5 px-2" />
            <button onClick={handleSend} disabled={!input.trim() || isStreaming}
              className="w-10 h-10 mb-0.5 rounded-lg bg-primary disabled:opacity-40 flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors text-primary-foreground">
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
