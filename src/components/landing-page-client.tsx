"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen, MessageSquare, Brain, Award, Sparkles, ChevronRight,
  Play, Pause, RotateCcw, UploadCloud, Check, X, Flame, Zap,
  Mic, Volume2, ArrowRight, Shield, Share2, Compass, BookOpenCheck,
  TrendingUp, User, VolumeX, AwardIcon, FileText
} from "lucide-react"

// Mock concepts for the concept definitions
const CONCEPTS: Record<string, string> = {
  "Habit Stacking": "A form of implementation intention where you pair a new habit with a current habit. The formula is: 'After [Current Habit], I will [New Habit]'.",
  "1% Better Every Day": "The concept of continuous improvement. Compounding 1% improvements daily results in being 37 times better by the end of one year.",
  "System vs Goals": "Goals are about the results you want to achieve. Systems are about the processes that lead to those results. You do not rise to the level of your goals; you fall to the level of your systems.",
  "Identity Shift": "The ultimate form of behavior change. True behavior change is not about having a goal, but about becoming the type of person who achieves that goal."
}

// Mock Quiz Questions
const QUIZ_QUESTIONS = [
  {
    question: "What is the formula for Habit Stacking?",
    options: [
      "Before [New Habit], I will ignore [Current Habit]",
      "After [Current Habit], I will [New Habit]",
      "If [New Habit] happens, then [Current Habit] is deleted",
      "Stack [New Habit] and [Current Habit] on alternate days"
    ],
    answerIndex: 1,
    explanation: "Habit stacking links your new habit directly to an existing daily trigger, creating a reliable mental cue."
  },
  {
    question: "According to Atomic Habits, how do habits compound over time?",
    options: [
      "They add up linearly",
      "They stay the same",
      "They compound like interest, making 1% daily changes massive over a year",
      "They only compound if you study for 4+ hours daily"
    ],
    answerIndex: 2,
    explanation: "Just like financial interest, small actions (1% improvement) compound exponentially over time."
  },
  {
    question: "What is the difference between Systems and Goals?",
    options: [
      "Goals are the process, systems are the result",
      "Goals are for losers, systems are for winners",
      "Goals are about the results you want, systems are the processes that get you there",
      "There is no difference between them"
    ],
    answerIndex: 2,
    explanation: "James Clear argues that focusing on the system (the process) guarantees the goal, whereas focusing only on the goal leads to burnout."
  }
]

export default function LandingPageClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()

  // Sandbox simulation states
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"notes" | "audio" | "quiz" | "tutor" | "voice">("notes")

  // 1. Concept popover state
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null)
  const [conceptPosition, setConceptPosition] = useState<{ x: number; y: number } | null>(null)

  // 2. Audio playback simulation
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioWordIndex, setAudioWordIndex] = useState(-1)
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioUtteranceRef = useRef<any>(null)

  const audioText = "In Atomic Habits, James Clear explains that habits are the compound interest of self-improvement. Just as money multiplies through compound interest, the effects of your habits multiply as you repeat them."
  const audioWords = audioText.split(" ")

  // 3. Quiz simulation state
  const [quizStep, setQuizStep] = useState(0) // 0: start, 1: q1, 2: q2, 3: q3, 4: score
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null)
  const [xpPoints, setXpPoints] = useState(140)
  const [xpProgress, setXpProgress] = useState(40)
  const [showXpToast, setShowXpToast] = useState(false)
  const [streakDays, setStreakDays] = useState(1)

  // 4. Tutor Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to your AI Study Session on *Atomic Habits*. I'm your interactive tutor. Select one of the quick topics below or ask anything you need clarification on!" }
  ])
  const [chatInput, setChatInput] = useState("")
  const [tutorTyping, setTutorTyping] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // 5. Voice buddy state
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState("Click the microphone to start speaking to Read")
  const [voiceWaveform, setVoiceWaveform] = useState(false)

  // 6. Certificate Customizer state
  const [certName, setCertName] = useState("")
  const [certTheme, setCertTheme] = useState<"gold" | "purple" | "emerald" | "rose" | "cyan">("gold")
  const [certShimmer, setCertShimmer] = useState(true)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, tutorTyping])

  // Cleanup audio on tab switch or unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback()
    }
  }, [activeTab])

  // PDF upload simulation
  const handleSimulatedUpload = () => {
    if (uploadState !== "idle") return
    setUploadState("uploading")
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setUploadState("success")
            setActiveTab("notes")
          }, 400)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  // Concept popover helper
  const handleConceptHover = (e: React.MouseEvent, conceptName: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setConceptPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10
    })
    setHoveredConcept(conceptName)
  }

  // Audio Playback functions
  const playAudioHighlight = () => {
    if (audioPlaying) {
      stopAudioPlayback()
      return
    }

    setAudioPlaying(true)
    setAudioWordIndex(0)

    // Trigger synthesis if browser supports it and isn't muted
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(audioText)
      utterance.rate = 1.0
      
      // Find an English voice (female if available)
      const voices = window.speechSynthesis.getVoices()
      const chosenVoice = voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("zira")))
      if (chosenVoice) {
        utterance.voice = chosenVoice
      }

      utterance.onend = () => {
        stopAudioPlayback()
      }

      audioUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }

    // Visual highlighted word timer
    let wordIdx = 0
    // Total words: 28. Standard speaking rate 130-150 wpm ~ 0.4 seconds per word.
    audioIntervalRef.current = setInterval(() => {
      wordIdx++
      if (wordIdx >= audioWords.length) {
        stopAudioPlayback()
      } else {
        setAudioWordIndex(wordIdx)
      }
    }, 380)
  }

  const stopAudioPlayback = () => {
    setAudioPlaying(false)
    setAudioWordIndex(-1)
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current)
      audioIntervalRef.current = null
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const restartAudioPlayback = () => {
    stopAudioPlayback()
    setTimeout(() => {
      playAudioHighlight()
    }, 100)
  }

  // Quiz helper functions
  const handleSelectOption = (optIndex: number) => {
    if (selectedOption !== null) return
    setSelectedOption(optIndex)
    const isCorrect = optIndex === QUIZ_QUESTIONS[quizStep - 1].answerIndex
    setIsAnswerCorrect(isCorrect)
    
    // Track correct answers
    const updatedAnswers = [...quizAnswers]
    updatedAnswers.push(optIndex)
    setQuizAnswers(updatedAnswers)

    setTimeout(() => {
      // Move to next question or end
      setSelectedOption(null)
      setIsAnswerCorrect(null)
      if (quizStep < 3) {
        setQuizStep(prev => prev + 1)
      } else {
        setQuizStep(4) // completed
        triggerXPEarn()
      }
    }, 1600)
  }

  const triggerXPEarn = () => {
    setShowXpToast(true)
    setXpPoints(prev => prev + 25)
    setStreakDays(2)
    // animate progress bar
    let progress = 40
    const interval = setInterval(() => {
      progress += 2
      if (progress >= 65) {
        clearInterval(interval)
      }
      setXpProgress(progress)
    }, 30)

    setTimeout(() => {
      setShowXpToast(false)
    }, 4500)
  }

  const restartQuiz = () => {
    setQuizStep(1)
    setQuizAnswers([])
    setSelectedOption(null)
    setIsAnswerCorrect(null)
  }

  // Tutor Chat helpers
  const handleTutorPromptClick = (promptText: string) => {
    if (tutorTyping) return
    
    // Add user message
    const userMsg = { sender: "user" as const, text: promptText }
    setChatMessages(prev => [...prev, userMsg])
    setTutorTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let responseText = ""
      if (promptText.includes("Habit Stacking")) {
        responseText = "Habit stacking is a strategy where you pair a new habit with an existing habit. The formula is:\n\n**'After [CURRENT HABIT], I will [NEW HABIT].'**\n\nFor example: *'After I pour my morning cup of coffee, I will meditate for one minute.'* This leverages the strong neural pathways already established by your existing habits so that the new action feels automatic!"
      } else if (promptText.includes("example")) {
        responseText = "Absolutely! Here are three real-world habit stacks:\n\n1. **Fitness:** 'After I close my laptop for lunch, I will do 10 pushups.'\n2. **Gratitude:** 'After I sit down for dinner, I will say one thing I am grateful for today.'\n3. **Mindfulness:** 'After I put on my running shoes, I will take three deep breaths.'\n\nBy anchoring a tiny habit onto an existing cue, you remove the friction of remembering to do it."
      } else {
        responseText = "Chapter 1 argues that tiny changes (1% better everyday) compound into massive differences over time. Clear calls habits the **'compound interest of self-improvement'**. Rather than focusing on goals (what you want to achieve), focus on your systems (the daily processes that get you there)."
      }

      setTutorTyping(false)
      setChatMessages(prev => [...prev, { sender: "ai", text: responseText }])
    }, 1500)
  }

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || tutorTyping) return
    const text = chatInput
    setChatInput("")

    setChatMessages(prev => [...prev, { sender: "user", text }])
    setTutorTyping(true)

    setTimeout(() => {
      setTutorTyping(false)
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: `That's a fantastic question about "${text}". In the actual BookWise AI experience, I would reference the full text of your uploaded PDF, extract contextually relevant passages, and provide a detailed study explanation tailored to your question! Here, you can click on the prompt chips to see a demo of our conversational response system.`
        }
      ])
    }, 1800)
  }

  // Voice buddy simulation
  const handleVoiceToggle = () => {
    if (voiceActive) {
      setVoiceActive(false)
      setVoiceWaveform(false)
      setVoiceStatus("Voice buddy paused.")
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      return
    }

    setVoiceActive(true)
    setVoiceWaveform(true)
    setVoiceStatus("Read is listening... Say 'Explain compound interest'")

    // Simulate speech recognition trigger
    setTimeout(() => {
      if (!voiceActive) return
      setVoiceStatus("Recognized: 'Explain compound interest'")
      setVoiceWaveform(false)

      setTimeout(() => {
        if (!voiceActive) return
        setVoiceStatus("Read is speaking...")
        setVoiceWaveform(true)

        const responseText = "Sure! Compound interest in reading means that learning one small concept today builds on what you already know, making it easier to understand bigger ideas tomorrow. It's the 1% compound rule for your brain!"
        
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(responseText)
          
          // Find female voice
          const voices = window.speechSynthesis.getVoices()
          const femaleVoice = voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("zira")))
          if (femaleVoice) utterance.voice = femaleVoice
          
          utterance.onend = () => {
            setVoiceWaveform(false)
            setVoiceStatus("Read is waiting. Click mic to speak again.")
          }
          window.speechSynthesis.speak(utterance)
        } else {
          // Timer fallback
          setTimeout(() => {
            setVoiceWaveform(false)
            setVoiceStatus("Read is waiting. Click mic to speak again.")
          }, 5000)
        }
      }, 1000)
    }, 3000)
  }

  // Theme-specific styles for certificate preview
  const getCertThemeStyles = () => {
    switch (certTheme) {
      case "gold":
        return {
          border: "border-amber-500/50 shadow-amber-500/10",
          gradient: "from-amber-600 via-yellow-500 to-amber-600",
          bgTint: "bg-amber-500/5",
          accentColor: "text-amber-400"
        }
      case "purple":
        return {
          border: "border-purple-500/50 shadow-purple-500/10",
          gradient: "from-purple-600 via-indigo-500 to-purple-600",
          bgTint: "bg-purple-500/5",
          accentColor: "text-purple-400"
        }
      case "emerald":
        return {
          border: "border-emerald-500/50 shadow-emerald-500/10",
          gradient: "from-emerald-600 via-teal-500 to-emerald-600",
          bgTint: "bg-emerald-500/5",
          accentColor: "text-emerald-400"
        }
      case "rose":
        return {
          border: "border-rose-500/50 shadow-rose-500/10",
          gradient: "from-rose-600 via-pink-500 to-rose-600",
          bgTint: "bg-rose-500/5",
          accentColor: "text-rose-400"
        }
      case "cyan":
        return {
          border: "border-cyan-500/50 shadow-cyan-500/10",
          gradient: "from-cyan-600 via-sky-500 to-cyan-600",
          bgTint: "bg-cyan-500/5",
          accentColor: "text-cyan-400"
        }
    }
  }

  const themeStyles = getCertThemeStyles()

  return (
    <div className="bg-[#0D0F14] text-[#F0F2F8] min-h-screen selection:bg-amber-500/30 selection:text-white font-sans scroll-smooth overflow-x-hidden">
      
      {/* ── HEADER & NAVIGATION ────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0D0F14]/80 backdrop-blur-md border-b border-[#2A2F42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_0_16px_rgba(245,166,35,0.4)]">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight leading-none">BookWise</span>
              <span className="text-xs font-semibold ml-1 text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">AI</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9BA3BE]">
            <a href="#features" className="hover:text-[#F0F2F8] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#F0F2F8] transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-[#F0F2F8] transition-colors">Live Sandbox</a>
            <a href="#gamification" className="hover:text-[#F0F2F8] transition-colors">Gamification</a>
            <a href="#certificates" className="hover:text-[#F0F2F8] transition-colors">Certificates</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0D0F14] text-sm font-semibold px-4 py-2 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-[#9BA3BE] hover:text-[#F0F2F8] px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0D0F14] text-sm font-semibold px-4 py-2 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ───────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none -z-10" />

        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Reading & Learning Companion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-display leading-[1.1] text-balance">
            Knowledge Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Beautiful</span> & Interactive
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#9BA3BE] leading-relaxed text-balance">
            Upload any book PDF. Let AI segment it into gamified, bite-sized study sessions. Master concepts with an interactive audio player, dynamic quizzes, and a voice-activated study companion.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0D0F14] text-base font-bold px-8 py-3.5 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] group"
            >
              Start Uploading Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#2A2F42] bg-[#13161E]/40 hover:bg-[#13161E]/80 text-[#F0F2F8] text-base font-semibold px-8 py-3.5 transition-all"
            >
              Try Interactive Demo
            </a>
          </div>
        </div>

        {/* Floating Book Cover Preview Mockup */}
        <div className="mt-16 md:mt-24 max-w-5xl mx-auto rounded-2xl border border-[#2A2F42] bg-[#13161E]/30 p-2 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-transparent to-transparent opacity-90 z-10" />
          
          {/* Decorative browser dots */}
          <div className="h-8 border-b border-[#2A2F42] px-4 flex items-center gap-1.5 bg-[#13161E]/50">
            <span className="w-3 h-3 rounded-full bg-rose-500/30" />
            <span className="w-3 h-3 rounded-full bg-amber-500/30" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/30" />
            <span className="text-xs text-[#5C6480] ml-3 select-none">BookWise AI Study Hub</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 min-h-[350px] relative">
            {/* Left: Book Cover preview card */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#1C2030]/50 rounded-xl border border-[#2A2F42] relative overflow-hidden">
              <div className="w-32 h-44 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2d6a9f] shadow-[0_12px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between p-4 relative group-hover:scale-105 transition-transform duration-300">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Atomic Habits</h4>
                  <p className="text-[10px] text-sky-200 mt-1">James Clear</p>
                </div>
              </div>
              <h3 className="text-white font-semibold mt-6 text-center text-sm">Atomic Habits</h3>
              <p className="text-xs text-[#9BA3BE] text-center mt-1">Syllabus: 12 Sessions · 34 Concepts</p>
              
              <div className="w-full mt-6 bg-[#13161E] rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full w-[67%]" />
              </div>
              <div className="w-full flex justify-between text-[10px] text-[#5C6480] mt-1.5 font-medium">
                <span>Progress</span>
                <span className="text-amber-400">67% mastered</span>
              </div>
            </div>

            {/* Middle: Concept Map / Syllabus Tree */}
            <div className="flex flex-col justify-center gap-3 p-4 bg-[#1C2030]/30 rounded-xl border border-[#2A2F42]/60">
              <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase mb-1">Your Daily Course Path</span>
              {[
                { label: "Session 1: The Power of 1%", time: "15 min", icon: BookOpenCheck, active: true },
                { label: "Session 2: Identity-Based Habits", time: "20 min", icon: Brain, active: true },
                { label: "Session 3: Habit Stacking", time: "15 min", icon: Flame, active: false, current: true },
                { label: "Session 4: Make It Obvious", time: "18 min", icon: Sparkles, active: false }
              ].map((s, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    s.current 
                      ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5" 
                      : s.active 
                        ? "bg-[#13161E]/40 border-emerald-500/20 text-[#9BA3BE]" 
                        : "bg-[#13161E]/20 border-transparent text-[#5C6480]"
                  }`}
                >
                  <s.icon className={`w-4 h-4 ${s.current ? "text-amber-400" : s.active ? "text-emerald-400" : "text-[#5C6480]"}`} />
                  <span className={`text-xs font-semibold flex-1 ${s.current ? "text-white" : ""}`}>{s.label}</span>
                  <span className="text-[10px] opacity-65">{s.time}</span>
                </div>
              ))}
            </div>

            {/* Right: AI Tutor Chat Preview */}
            <div className="flex flex-col bg-[#1C2030]/50 rounded-xl border border-[#2A2F42] p-4 gap-3 relative justify-between overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#2A2F42] pb-2">
                <div className="w-5 h-5 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/40">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-xs font-bold text-white">BookWise AI Tutor</span>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-3 text-xs overflow-hidden">
                <div className="bg-[#13161E] text-[#9BA3BE] p-2.5 rounded-lg rounded-tl-none border border-[#2A2F42] max-w-[90%]">
                  How does habit stacking help me read books?
                </div>
                <div className="bg-violet-950/30 text-violet-200 p-2.5 rounded-lg rounded-tr-none border border-violet-500/20 max-w-[90%] ml-auto font-reading">
                  It links your reading habit to an existing daily trigger, like your morning coffee. So you automatically read!
                </div>
              </div>
              <div className="bg-[#13161E] rounded-lg border border-[#2A2F42] p-1.5 flex items-center justify-between mt-2">
                <span className="text-[10px] text-[#5C6480] px-2">Ask a follow up question...</span>
                <button className="bg-amber-500 text-[#0D0F14] rounded-md p-1">
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES STRIP ────────────────────────── */}
      <section id="features" className="py-20 border-t border-[#2A2F42] bg-[#13161E]/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Feature Rich Platform</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">Active Learning, Redefined</h2>
            <p className="text-[#9BA3BE] text-sm sm:text-base">
              Say goodbye to passive scrolling and forgetting what you read. BookWise AI drives active recall and comprehension.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#13161E] rounded-2xl border border-[#2A2F42] p-6 hover:border-amber-500/30 hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Smart Ingestion Engine</h3>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Upload any PDF book. Our LLM pipeline handles dirty scans, extracts layout data, and dynamically splits chapters into balanced reading sessions matching your daily goal.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#13161E] rounded-2xl border border-[#2A2F42] p-6 hover:border-amber-500/30 hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">"Read" Voice Buddy</h3>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Experience hands-free learning with our native speech companion. Discuss complex ideas, practice oral quiz answers, and review summaries entirely with voice controls.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#13161E] rounded-2xl border border-[#2A2F42] p-6 hover:border-amber-500/30 hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Dynamic AI Quizzes</h3>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Self-evaluate with multiple-choice questions custom generated from the specific chapters you completed. Track concept mastery from New to Mastered.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#13161E] rounded-2xl border border-[#2A2F42] p-6 hover:border-amber-500/30 hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Gamified Motivation</h3>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Stay consistent using daily study streaks, levels, XP accumulation, and global leaderboards. Level up your profile from a Spark to a Legend.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#13161E] rounded-2xl border border-[#2A2F42] p-6 hover:border-amber-500/30 hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">AI Contextual Tutor</h3>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Chat side-by-side with an LLM tutor that has complete grounding in the textbook you are currently reading. Highlight and ask for simple explanations or real-world examples.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#13161E] rounded-2xl border border-[#2A2F42] p-6 hover:border-amber-500/30 hover:translate-y-[-4px] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">Foil Certificates</h3>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Complete a book course, pass the final evaluations, and earn beautiful shareable certificates with golden-shimmer animations to post on LinkedIn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE SANDBOX DEMO SECTION ───────────── */}
      <section id="demo" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/4 w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none -z-10" />
        
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Live Interactive Sandbox</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">Experience BookWise AI Instantly</h2>
          <p className="text-[#9BA3BE] text-sm sm:text-base">
            Try the simulated BookWise learning workspace below. Click on tabs, trigger synthesized audio, take the quiz, or chat with the tutor.
          </p>
        </div>

        {uploadState === "idle" && (
          /* Step 1: Upload dropzone simulator */
          <div className="max-w-3xl mx-auto bg-[#13161E] border-2 border-dashed border-[#2A2F42] hover:border-amber-500/40 rounded-3xl p-12 text-center transition-all cursor-pointer relative overflow-hidden group shadow-xl shadow-black/20" onClick={handleSimulatedUpload}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Upload a PDF to Demo</h3>
                <p className="text-sm text-[#9BA3BE] max-w-md mx-auto">
                  Click here to simulate uploading a PDF (e.g., <span className="text-amber-400 font-medium">Atomic Habits.pdf</span>) and watch how our AI engine curates a custom learning course.
                </p>
              </div>
              <button className="mt-2 inline-flex items-center gap-2 bg-[#252A3A] hover:bg-[#343A52] text-[#F0F2F8] border border-[#2A2F42] rounded-xl px-5 py-2 text-sm font-semibold transition-colors">
                Select Test PDF
              </button>
            </div>
          </div>
        )}

        {uploadState === "uploading" && (
          /* Step 2: Upload progress simulator */
          <div className="max-w-2xl mx-auto bg-[#13161E] border border-[#2A2F42] rounded-3xl p-8 text-center space-y-6 shadow-xl shadow-black/20 relative overflow-hidden">
            <div className="w-12 h-12 rounded-full border-t-2 border-amber-500 border-r-2 border-transparent animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">AI Ingestion Pipeline Active</h3>
              <p className="text-xs text-[#9BA3BE] max-w-md mx-auto">
                {uploadProgress < 30 && "Scanning page layout structures..."}
                {uploadProgress >= 30 && uploadProgress < 60 && "Running chapter boundaries extraction & cleansing..."}
                {uploadProgress >= 60 && uploadProgress < 90 && "Segmenting syllabus into daily targets..."}
                {uploadProgress >= 90 && "Synthesizing concept maps and generating quiz hints..."}
              </p>
            </div>
            
            <div className="w-full bg-[#0D0F14] rounded-full h-2 overflow-hidden border border-[#2A2F42]">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="text-sm font-bold text-amber-400">{uploadProgress}% Complete</div>
          </div>
        )}

        {uploadState === "success" && (
          /* Step 3: Interactive Workspace Sandbox */
          <div className="max-w-5xl mx-auto bg-[#13161E] border border-[#2A2F42] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col md:flex-row animate-fade-up min-h-[560px]">
            
            {/* Left Panel: Tabs & Content */}
            <div className="flex-1 border-r border-[#2A2F42] flex flex-col justify-between">
              <div>
                {/* Header with Title and Timer widget simulator */}
                <div className="px-6 py-4 border-b border-[#2A2F42] bg-[#1C2030]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/20 px-2 py-0.5 rounded">Session 3</span>
                    <h3 className="text-white font-bold text-sm">Habit Stacking</h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#13161E] border border-[#2A2F42] rounded-full text-xs font-bold text-[#9BA3BE]">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>25:00 Focus</span>
                  </div>
                </div>

                {/* Workspace tab selectors */}
                <div className="px-4 border-b border-[#2A2F42] bg-[#13161E] flex gap-1 overflow-x-auto scrollbar-none">
                  {[
                    { id: "notes", label: "📝 Study Notes" },
                    { id: "audio", label: "🎧 Audio" },
                    { id: "quiz", label: "🧠 Quiz" },
                    { id: "tutor", label: "💬 AI Tutor" },
                    { id: "voice", label: "🎙️ Voice Buddy" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                        activeTab === tab.id 
                          ? "border-amber-500 text-amber-400 font-bold" 
                          : "border-transparent text-[#9BA3BE] hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Workspace Content Display */}
                <div className="p-6 min-h-[320px] max-h-[380px] overflow-y-auto relative">
                  
                  {/* TAB 1: STUDY NOTES */}
                  {activeTab === "notes" && (
                    <div className="space-y-4">
                      <h4 className="text-[#F0F2F8] font-bold text-sm">Summary Overview</h4>
                      <p className="text-sm text-[#9BA3BE] leading-relaxed font-reading">
                        James Clear introduces the principle of{" "}
                        <span 
                          className="text-amber-400 underline decoration-dotted cursor-pointer font-bold relative inline-block hover:text-amber-300"
                          onMouseEnter={(e) => handleConceptHover(e, "Habit Stacking")}
                          onMouseLeave={() => setHoveredConcept(null)}
                        >
                          Habit Stacking
                        </span>
                        . It provides a simple mental shortcut: you piggyback a new behavior onto a current routine. Small actions, when stacked, generate a compounding effect that builds{" "}
                        <span 
                          className="text-amber-400 underline decoration-dotted cursor-pointer font-bold relative inline-block hover:text-amber-300"
                          onMouseEnter={(e) => handleConceptHover(e, "1% Better Every Day")}
                          onMouseLeave={() => setHoveredConcept(null)}
                        >
                          1% Better Every Day
                        </span>
                        .
                      </p>
                      <p className="text-sm text-[#9BA3BE] leading-relaxed font-reading">
                        By focusing heavily on{" "}
                        <span 
                          className="text-amber-400 underline decoration-dotted cursor-pointer font-bold relative inline-block hover:text-amber-300"
                          onMouseEnter={(e) => handleConceptHover(e, "System vs Goals")}
                          onMouseLeave={() => setHoveredConcept(null)}
                        >
                          System vs Goals
                        </span>
                        , learners ensure they establish automatic triggers. Over time, this initiates a deep{" "}
                        <span 
                          className="text-amber-400 underline decoration-dotted cursor-pointer font-bold relative inline-block hover:text-amber-300"
                          onMouseEnter={(e) => handleConceptHover(e, "Identity Shift")}
                          onMouseLeave={() => setHoveredConcept(null)}
                        >
                          Identity Shift
                        </span>
                        , making habits a core part of who they are.
                      </p>

                      <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-[#9BA3BE]">
                          <strong className="text-white">Tip:</strong> Hover over the dotted highlighted concepts in the study notes above to instantly see AI-extracted definitions.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: AUDIO PLAYBACK */}
                  {activeTab === "audio" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-[#1C2030]/50 border border-[#2A2F42] rounded-xl">
                        <button 
                          onClick={playAudioHighlight}
                          className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-[#0D0F14] flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                        >
                          {audioPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <div>
                          <h4 className="text-white text-sm font-bold">Audio Chapter Reader</h4>
                          <p className="text-xs text-[#9BA3BE] mt-0.5">
                            {audioPlaying ? "Currently reading summary..." : "Press play to read the summary out loud with word highlights."}
                          </p>
                        </div>
                        {audioPlaying && (
                          <button 
                            onClick={restartAudioPlayback}
                            className="ml-auto w-8 h-8 rounded-lg bg-[#252A3A] border border-[#2A2F42] flex items-center justify-center text-[#9BA3BE] hover:text-white"
                            title="Restart audio"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Karaoke highlighted text display */}
                      <div className="p-4 bg-[#0D0F14] rounded-xl border border-[#2A2F42] leading-relaxed font-reading text-sm">
                        {audioWords.map((word, idx) => {
                          const isHighlighted = idx === audioWordIndex
                          return (
                            <span 
                              key={idx}
                              className={`transition-colors duration-150 mr-1.5 inline-block py-0.5 rounded px-0.5 ${
                                isHighlighted 
                                  ? "bg-amber-500 text-[#0D0F14] font-bold" 
                                  : "text-[#9BA3BE]"
                              }`}
                            >
                              {word}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: QUIZ SIMULATOR */}
                  {activeTab === "quiz" && (
                    <div className="space-y-4">
                      {quizStep === 0 && (
                        <div className="text-center py-6 space-y-4">
                          <Brain className="w-12 h-12 text-amber-400 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-white font-bold text-base">Check Your Understanding</h4>
                            <p className="text-xs text-[#9BA3BE] max-w-sm mx-auto">
                              Take a quick 3-question MCQ generated automatically from the concepts in this chapter.
                            </p>
                          </div>
                          <button 
                            onClick={() => setQuizStep(1)}
                            className="bg-amber-500 hover:bg-amber-400 text-[#0D0F14] text-xs font-bold rounded-xl px-5 py-2.5 transition-all shadow-md shadow-amber-500/10"
                          >
                            Start Quiz Demo
                          </button>
                        </div>
                      )}

                      {quizStep >= 1 && quizStep <= 3 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs text-[#5C6480] font-medium border-b border-[#2A2F42]/60 pb-2">
                            <span>Question {quizStep} of 3</span>
                            <span className="text-amber-400 font-bold">10 XP Rewards</span>
                          </div>
                          
                          <h4 className="text-[#F0F2F8] font-bold text-sm leading-relaxed">
                            {QUIZ_QUESTIONS[quizStep - 1].question}
                          </h4>

                          <div className="grid grid-cols-1 gap-2.5 pt-2">
                            {QUIZ_QUESTIONS[quizStep - 1].options.map((opt, oIdx) => {
                              const isSelected = selectedOption === oIdx
                              const isCorrectOption = oIdx === QUIZ_QUESTIONS[quizStep - 1].answerIndex
                              let btnClass = "border-[#2A2F42] bg-[#1C2030]/30 text-[#9BA3BE] hover:bg-[#1C2030]/60 hover:text-white"
                              
                              if (selectedOption !== null) {
                                if (isSelected) {
                                  btnClass = isAnswerCorrect 
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold" 
                                    : "border-rose-500 bg-rose-500/10 text-rose-400 font-semibold animate-shake"
                                } else if (isCorrectOption) {
                                  btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                                } else {
                                  btnClass = "border-transparent bg-[#1C2030]/10 text-[#5C6480] opacity-50"
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleSelectOption(oIdx)}
                                  disabled={selectedOption !== null}
                                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${btnClass}`}
                                >
                                  <span>{opt}</span>
                                  {selectedOption !== null && isSelected && (
                                    isAnswerCorrect ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {selectedOption !== null && (
                            <div className="p-3 bg-[#0D0F14] border border-[#2A2F42] rounded-xl text-[11px] text-[#9BA3BE] leading-relaxed animate-fade-up">
                              <span className="font-bold text-[#F0F2F8]">Explanation: </span>
                              {QUIZ_QUESTIONS[quizStep - 1].explanation}
                            </div>
                          )}
                        </div>
                      )}

                      {quizStep === 4 && (
                        <div className="text-center py-4 space-y-4">
                          <Award className="w-12 h-12 text-emerald-400 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-white font-bold text-base">Evaluation Complete!</h4>
                            <p className="text-xs text-emerald-400 font-bold">Score: 3 / 3 (100% Correct)</p>
                          </div>
                          
                          <p className="text-[11px] text-[#9BA3BE] max-w-xs mx-auto leading-relaxed">
                            Excellent work! All related concepts have graduated from <strong className="text-amber-400">Learning ➔ Mastered</strong>.
                          </p>

                          <div className="flex items-center justify-center gap-3 pt-2">
                            <button 
                              onClick={restartQuiz}
                              className="bg-[#252A3A] hover:bg-[#343A52] text-[#F0F2F8] border border-[#2A2F42] text-xs font-bold rounded-xl px-4 py-2 transition-all"
                            >
                              Retake Quiz
                            </button>
                            <button 
                              onClick={() => setActiveTab("notes")}
                              className="bg-amber-500 hover:bg-amber-400 text-[#0D0F14] text-xs font-bold rounded-xl px-4 py-2 transition-all shadow-md shadow-amber-500/10"
                            >
                              Back to Notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: AI TUTOR CHAT SIMULATION */}
                  {activeTab === "tutor" && (
                    <div className="flex flex-col h-full justify-between gap-4">
                      {/* Message log */}
                      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        {chatMessages.map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                          >
                            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                              msg.sender === "user" 
                                ? "bg-amber-500 text-[#0D0F14]" 
                                : "bg-violet-600 text-white"
                            }`}>
                              {msg.sender === "user" ? "ME" : "AI"}
                            </div>
                            <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                              msg.sender === "user" 
                                ? "bg-amber-500/10 text-white border border-amber-500/20 rounded-tr-none" 
                                : "bg-violet-950/20 text-[#D2C9F9] border border-violet-500/10 rounded-tl-none font-reading"
                            }`}>
                              {msg.text.split("\n\n").map((para, pIdx) => (
                                <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>{para}</p>
                              ))}
                            </div>
                          </div>
                        ))}

                        {tutorTyping && (
                          <div className="flex gap-2 max-w-[85%]">
                            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold">AI</div>
                            <div className="p-3 bg-[#1C2030]/50 border border-[#2A2F42] rounded-xl rounded-tl-none flex items-center gap-1.5 py-2.5">
                              <span className="w-1.5 h-1.5 bg-[#5C6480] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1.5 h-1.5 bg-[#5C6480] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1.5 h-1.5 bg-[#5C6480] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Prompt suggestion chips */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2A2F42]/60">
                        {[
                          "Explain Habit Stacking",
                          "Give me a real-world example",
                          "Summarize Chapter 1 concepts"
                        ].map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleTutorPromptClick(prompt)}
                            disabled={tutorTyping}
                            className="bg-[#1C2030]/60 border border-[#2A2F42] hover:border-amber-500/30 text-[#9BA3BE] hover:text-white rounded-full px-3 py-1.5 text-[10px] font-medium transition-all"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      {/* Send input form */}
                      <form onSubmit={handleSendChatMessage} className="bg-[#0D0F14] border border-[#2A2F42] rounded-xl p-1.5 flex items-center justify-between">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Ask a custom question..."
                          className="bg-transparent border-0 outline-none text-xs px-2 flex-1 text-[#F0F2F8] placeholder-[#5C6480]"
                        />
                        <button 
                          type="submit"
                          disabled={tutorTyping || !chatInput.trim()}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0D0F14] disabled:opacity-50 flex items-center justify-center transition-colors shrink-0"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 5: VOICE BUDDY "READ" */}
                  {activeTab === "voice" && (
                    <div className="text-center py-6 space-y-6 flex flex-col items-center justify-center">
                      <div className="space-y-2">
                        <h4 className="text-white font-bold text-base">Meet "Read"</h4>
                        <p className="text-xs text-[#9BA3BE] max-w-sm mx-auto leading-relaxed">
                          Speak and learn hands-free. Click below to start an interactive study dialogue.
                        </p>
                      </div>

                      {/* Animated audio wave indicator */}
                      <div className="h-16 flex items-center justify-center gap-1.5 w-full">
                        {voiceWaveform ? (
                          [...Array(9)].map((_, i) => {
                            const delay = `${i * 150}ms`
                            const duration = `${0.6 + Math.random() * 0.8}s`
                            return (
                              <span 
                                key={i} 
                                className="w-1 bg-amber-500 rounded-full animate-pulse"
                                style={{
                                  height: `${20 + Math.random() * 40}px`,
                                  animationDelay: delay,
                                  animationDuration: duration
                                }}
                              />
                            )
                          })
                        ) : (
                          <div className="w-full h-[1px] bg-[#2A2F42] max-w-[200px]" />
                        )}
                      </div>

                      <div className="space-y-4 flex flex-col items-center">
                        <button 
                          onClick={handleVoiceToggle}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            voiceActive 
                              ? "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20 text-white animate-pulse" 
                              : "bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20 text-[#0D0F14]"
                          }`}
                        >
                          {voiceActive ? <VolumeX className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        
                        <p className="text-xs font-semibold text-amber-400 px-4 py-1.5 bg-[#0D0F14] border border-[#2A2F42] rounded-full max-w-md">
                          {voiceStatus}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Simulated sidebar widgets embedded at bottom of viewer */}
              <div className="px-6 py-4 border-t border-[#2A2F42] bg-[#1C2030]/20 flex items-center justify-between">
                <span className="text-[10px] text-[#5C6480] font-medium">Atomic Habits · James Clear</span>
                <span className="text-[10px] text-[#5C6480] font-medium">Auto-saving study state...</span>
              </div>
            </div>

            {/* Right Panel: Gamification Widget Simulation */}
            <div className="w-full md:w-64 bg-[#1C2030]/50 p-6 flex flex-col justify-between border-t md:border-t-0 border-[#2A2F42]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-amber-400 tracking-widest uppercase mb-4">Your Profile Progress</h4>
                  
                  {/* Streak & XP widgets */}
                  <div className="flex items-center justify-between p-3 bg-[#13161E] rounded-xl border border-[#2A2F42] mb-3">
                    <div className="flex items-center gap-1.5">
                      <Flame className={`w-4 h-4 ${streakDays > 1 ? "text-orange-500 animate-bounce" : "text-[#5C6480]"}`} />
                      <span className={`text-xs font-bold ${streakDays > 1 ? "text-orange-400" : "text-[#9BA3BE]"}`}>
                        {streakDays} Day Streak
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">{xpPoints} XP</span>
                    </div>
                  </div>
                </div>

                {/* Level Up progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-violet-400">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Lv.2 Apprentice</span>
                    </div>
                    <span className="text-[#5C6480] font-medium">{xpProgress}%</span>
                  </div>
                  
                  <div className="h-2 rounded-full bg-[#13161E] overflow-hidden border border-[#2A2F42]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-500 transition-all duration-500" 
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#5C6480] block">Level up at 300 XP (Get 200 XP for book completion)</span>
                </div>

                {/* Leaderboard snapshot */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#5C6480] tracking-wider uppercase">Weekly Leaderboard</span>
                  <div className="space-y-2">
                    {[
                      { rank: "🥇", name: "Charchit Dhawan", xp: "2,480 XP", active: false },
                      { rank: "🥈", name: "Sarah K.", xp: "2,100 XP", active: false },
                      { rank: "🥉", name: "Marcus T.", xp: "1,890 XP", active: false },
                      { rank: "4th", name: "You (Demo)", xp: `${xpPoints} XP`, active: true }
                    ].map((user, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between text-[11px] p-2 rounded-lg ${
                          user.active 
                            ? "bg-amber-500/10 border border-amber-500/20 text-white font-bold" 
                            : "text-[#9BA3BE]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center">{user.rank}</span>
                          <span className="truncate max-w-[100px]">{user.name}</span>
                        </div>
                        <span className={user.active ? "text-amber-400" : "text-[#5C6480]"}>{user.xp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom stats details */}
              <div className="pt-6 border-t border-[#2A2F42]/60 text-[10px] text-[#5C6480] space-y-1.5">
                <div className="flex justify-between">
                  <span>Concepts Mastered</span>
                  <span className="text-white font-medium">4 / 34</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Commitment</span>
                  <span className="text-white font-medium">60 minutes</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Dynamic XP floating toast notifications */}
        {showXpToast && (
          <div className="fixed bottom-6 right-6 bg-[#13161E] border border-amber-500/30 p-4 rounded-xl flex items-center gap-3 animate-fade-up shadow-[0_12px_24px_rgba(0,0,0,0.5)] z-50">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">XP Gained!</h4>
              <p className="text-[10px] text-amber-400">+25 Experience Points · Streak Maintained 🔥</p>
            </div>
          </div>
        )}
      </section>

      {/* ── TIMELINE / HOW IT WORKS ────────────────────── */}
      <section id="how-it-works" className="py-20 border-t border-[#2A2F42] bg-[#13161E]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
            <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">The Learning Journey</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">How BookWise AI Works</h2>
            <p className="text-[#9BA3BE] text-sm sm:text-base">
              From uploading your source materials to building a certified, verified mastery.
            </p>
          </div>

          <div className="relative">
            {/* Center line connecting points on desktop */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-[#2A2F42] -translate-x-1/2 -z-10" />

            <div className="space-y-16">
              {[
                {
                  step: "01",
                  title: "Upload any Textbook PDF",
                  desc: "Upload a book or study document. Our ingestion pipeline parses the raw PDF, resolves structure problems, and extracts key layouts.",
                  side: "left"
                },
                {
                  step: "02",
                  title: "Smart Course Segmentation",
                  desc: "Rather than forcing you to read huge volumes, our AI slices the text into manageable sessions sized to match your daily study goal.",
                  side: "right"
                },
                {
                  step: "03",
                  title: "Interactive Deep Study",
                  desc: "Read along, trigger automated text-to-speech audio with visual word highlighting, ask the tutor questions, and take memory checkpoints.",
                  side: "left"
                },
                {
                  step: "04",
                  title: "Track Mastery & Level Up",
                  desc: "Earn XP, maintain streaks, and watch concepts progress from learning to mastered. Win and display completion certificates.",
                  side: "right"
                }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-stretch relative">
                  
                  {/* Marker point */}
                  <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 w-8 h-8 rounded-full bg-[#13161E] border border-amber-500/50 flex items-center justify-center text-xs font-bold text-amber-400 z-10 shadow-lg">
                    {item.step}
                  </div>

                  <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${item.side === "left" ? "md:pr-16 md:text-right" : "md:pl-16 md:order-2"}`}>
                    <div className="bg-[#13161E] border border-[#2A2F42] p-6 rounded-2xl shadow-lg hover:border-amber-500/20 transition-colors">
                      <h3 className="text-white text-base font-bold mb-2">{item.title}</h3>
                      <p className="text-[#9BA3BE] text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION PREVIEW ───────────────────────── */}
      <section id="gamification" className="py-20 border-t border-[#2A2F42] bg-[#0D0F14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Gamification explainer text */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Engaging Mechanics</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">Duolingo-Style Gamified Progression</h2>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Most students quit reading textbooks because they lack feedback loops. BookWise AI implements immediate, gamified milestones to keep you engaged.
              </p>
              
              <div className="space-y-4 pt-2">
                {[
                  { title: "Daily Learning Streaks", desc: "Maintain your streak flames by completing just 10 minutes of study daily.", icon: Flame, iconColor: "text-orange-500" },
                  { title: "Global Weekly Leaderboard", desc: "Rank against students globally based on XP earned during quizzes and focus sessions.", icon: AwardIcon, iconColor: "text-amber-400" },
                  { title: "10-Level Mastery Badges", desc: "Level up your profile card from a Spark level all the way to a global Legend.", icon: Sparkles, iconColor: "text-violet-400" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-[#13161E] border border-[#2A2F42] flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold">{item.title}</h4>
                      <p className="text-xs text-[#9BA3BE] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Gamification Visual Podium */}
            <div className="bg-[#13161E] border border-[#2A2F42] rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none" />
              
              <h3 className="text-white font-bold text-sm text-center mb-8">Weekly Scholar Rankings</h3>
              
              {/* Podium display */}
              <div className="flex items-end justify-center gap-4 border-b border-[#2A2F42] pb-6 mb-6">
                
                {/* 2nd place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-400 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">SK</div>
                    <span className="absolute -top-2.5 -right-1 bg-slate-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-[#13161E]">2</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">Sarah K.</span>
                  <div className="w-20 bg-slate-800 border-t border-slate-500/20 h-16 rounded-t-lg flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400">2,100 XP</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-950/40 flex items-center justify-center text-sm font-bold text-amber-400 shadow-lg shadow-amber-500/20">CD</div>
                    <span className="absolute -top-3 -right-1 bg-amber-500 text-[#0d0f14] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border border-[#13161E]">1</span>
                  </div>
                  <span className="text-xs font-bold text-white">Charchit D.</span>
                  <div className="w-24 bg-amber-950/60 border-t border-amber-500/40 h-24 rounded-t-lg flex items-center justify-center shadow-lg shadow-amber-500/5">
                    <span className="text-xs font-bold text-amber-400">2,480 XP</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-700 bg-amber-950/20 flex items-center justify-center text-xs font-bold text-amber-600">MT</div>
                    <span className="absolute -top-2.5 -right-1 bg-amber-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-[#13161E]">3</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">Marcus T.</span>
                  <div className="w-20 bg-amber-950/30 border-t border-amber-700/20 h-12 rounded-t-lg flex items-center justify-center">
                    <span className="text-[10px] font-bold text-amber-700">1,890 XP</span>
                  </div>
                </div>

              </div>

              {/* Explainers banner */}
              <div className="p-3 bg-[#1C2030]/50 border border-[#2A2F42] rounded-xl flex items-center justify-between text-xs text-[#9BA3BE]">
                <span>Weekly Prize Pool</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  +200 Bonus XP
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CERTIFICATES & LIVE BUILDER ───────────────── */}
      <section id="certificates" className="py-20 border-t border-[#2A2F42] bg-[#13161E]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Certificate Text Description */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Credential Sharing</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">Shimmering Certificates of Completion</h2>
              <p className="text-[#9BA3BE] text-sm leading-relaxed">
                Prove your knowledge to your professional network. Once you master all concepts in a textbook, BookWise generates a shareable certificate featuring a dynamic foil finish.
              </p>
              
              {/* Interactive Name Customizer */}
              <div className="space-y-4 pt-4 border-t border-[#2A2F42]/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9BA3BE] uppercase tracking-wider block">Customise Your Name</label>
                  <input
                    type="text"
                    value={certName}
                    onChange={e => setCertName(e.target.value)}
                    placeholder="Enter your name to preview..."
                    maxLength={28}
                    className="w-full bg-[#13161E] border border-[#2A2F42] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#5C6480] outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9BA3BE] uppercase tracking-wider block">Select Shimmer Foil Theme</label>
                  <div className="flex gap-2">
                    {[
                      { id: "gold", label: "Amber Gold", color: "bg-amber-500" },
                      { id: "purple", label: "AI Violet", color: "bg-purple-500" },
                      { id: "emerald", label: "Emerald", color: "bg-emerald-500" },
                      { id: "rose", label: "Rose Petal", color: "bg-rose-500" },
                      { id: "cyan", label: "Cyan Ice", color: "bg-cyan-500" }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setCertTheme(theme.id as any)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          certTheme === theme.id 
                            ? "border-white scale-110" 
                            : "border-transparent"
                        }`}
                        title={theme.label}
                      >
                        <span className={`w-4 h-4 rounded-full ${theme.color}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Certificate Card Sandbox */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              
              {/* Premium Certificate Container */}
              <div 
                className={`w-full max-w-lg aspect-[1.6/1] bg-[#13161E] border-2 rounded-2xl p-6 relative overflow-hidden transition-all duration-500 shadow-2xl flex flex-col justify-between ${themeStyles?.border}`}
              >
                {/* Background foil shimmer overlay */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-tr ${themeStyles?.bgTint} opacity-70 pointer-events-none`} 
                />
                
                {/* Glowing shimmer foil animation effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

                {/* Top header decoration */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">BookWise AI</span>
                  </div>
                  <span className="text-[9px] font-semibold text-white/40 tracking-wider">ID: PREVIEW-9923</span>
                </div>

                {/* Main details */}
                <div className="text-center space-y-4 my-2 relative z-10">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles?.accentColor}`}>Certificate of Completion</span>
                  <div className="space-y-1">
                    <p className="text-[9px] text-[#9BA3BE] font-medium italic">This certifies that</p>
                    <h3 className="text-lg font-bold text-white font-display min-h-[28px] flex items-center justify-center">
                      {certName.trim() || "Charchit Dhawan"}
                    </h3>
                  </div>
                  <p className="text-[10px] text-[#9BA3BE] max-w-sm mx-auto leading-relaxed">
                    has successfully processed, studied, and mastered all concepts in the textbook course
                    <strong className="text-white font-bold block text-[11px] mt-0.5 font-reading">"Atomic Habits" by James Clear</strong>
                  </p>
                </div>

                {/* Bottom signatures / date */}
                <div className="flex items-end justify-between border-t border-[#2A2F42] pt-4 relative z-10 text-[9px] text-[#9BA3BE]">
                  <div className="space-y-0.5">
                    <span className="block text-white font-medium">July 9, 2026</span>
                    <span className="block text-[8px] opacity-60">DATE OF ISSUANCE</span>
                  </div>
                  
                  {/* Foil stamp */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeStyles?.gradient} flex items-center justify-center border border-white/20 shadow-lg`}>
                    <Award className="w-4 h-4 text-white" />
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className={`block font-semibold font-reading ${themeStyles?.accentColor}`}>Mastered ✓</span>
                    <span className="block text-[8px] opacity-60">34 KEY CONCEPTS</span>
                  </div>
                </div>

              </div>

              {/* Share badge snippets preview */}
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => alert("LinkedIn sharing is mocked in this landing page demo. In the actual app, it opens a customized LinkedIn post setup!")}
                  className="inline-flex items-center gap-1.5 text-xs text-[#9BA3BE] hover:text-white bg-[#13161E] border border-[#2A2F42] rounded-xl px-4 py-2 transition-colors font-medium"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share to LinkedIn
                </button>
                <button 
                  onClick={() => alert("Markdown copied: ![BookWise Certificate](badge)")}
                  className="inline-flex items-center gap-1.5 text-xs text-[#9BA3BE] hover:text-white bg-[#13161E] border border-[#2A2F42] rounded-xl px-4 py-2 transition-colors font-medium"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Copy GitHub Badge
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION / REGISTRATION FOOTER ───────── */}
      <section className="py-24 bg-[#13161E]/40 border-t border-[#2A2F42] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-display tracking-tight leading-none">
            Ready to study <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">smarter</span>?
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-[#9BA3BE] max-w-xl mx-auto leading-relaxed">
            Stop passive reading. Start understanding, retaining, and mastering complex subjects with your personal AI study companion.
          </p>

          <div className="pt-2">
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0D0F14] text-base font-bold px-8 py-4 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] group"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-[#2A2F42] bg-[#0d0f14] py-12 text-[#5C6480] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">BookWise AI</span>
          </div>

          <p className="text-center md:text-left">
            © {new Date().getFullYear()} BookWise AI. Built for modern scholars. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-[#9BA3BE] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#9BA3BE] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#9BA3BE] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
