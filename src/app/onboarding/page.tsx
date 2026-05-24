"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Clock, Flame, Zap, Trophy, ArrowRight, Loader2, CheckCircle } from "lucide-react"

const HOUR_OPTIONS = [
  {
    minutes: 30,
    label: "30 min/day",
    title: "Casual Learner",
    description: "Light reading, one concept at a time",
    icon: "🌱",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
  },
  {
    minutes: 60,
    label: "1 hr/day",
    title: "Dedicated Student",
    description: "One focused Pomodoro session daily",
    icon: "📚",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/40",
  },
  {
    minutes: 90,
    label: "1.5 hrs/day",
    title: "Serious Scholar",
    description: "Deep-dive sessions, rapid mastery",
    icon: "🧠",
    color: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/40",
  },
  {
    minutes: 120,
    label: "2 hrs/day",
    title: "Knowledge Seeker",
    description: "Multiple sessions, fast-track learning",
    icon: "⚡",
    color: "from-orange-500/20 to-amber-500/20",
    border: "border-orange-500/40",
  },
  {
    minutes: 180,
    label: "3+ hrs/day",
    title: "Grand Master",
    description: "Intensive immersion, elite-speed progress",
    icon: "🏆",
    color: "from-yellow-500/20 to-red-500/20",
    border: "border-yellow-500/40",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [displayName, setDisplayName] = useState("")
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const selectedOption = HOUR_OPTIONS.find(o => o.minutes === selectedMinutes)

  const handleNameNext = () => {
    if (!displayName.trim()) { setError("Please enter your name"); return }
    setError("")
    setStep(2)
  }

  const handleFinish = async () => {
    if (!selectedMinutes) { setError("Please select a daily goal"); return }
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim(), daily_goal_minutes: selectedMinutes }),
      })
      if (!res.ok) throw new Error("Failed to save profile")
      setStep(3)
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0C09] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 bg-[#C8502A] rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl">BookWise AI</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-10">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step > s ? "bg-[#C8502A] text-white" :
              step === s ? "bg-[#C8502A]/20 text-[#C8502A] border border-[#C8502A]/40" :
              "bg-white/5 text-gray-600 border border-white/10"
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 2 && <div className={`w-16 h-px transition-all ${step > s ? "bg-[#C8502A]" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">👋</div>
              <h1 className="text-3xl font-extrabold text-white mb-2">Welcome, Scholar!</h1>
              <p className="text-gray-400">Let's personalize your learning journey. First, what should we call you?</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError("") }}
                onKeyDown={e => e.key === "Enter" && handleNameNext()}
                placeholder="Your name or username"
                className="w-full bg-white/5 border border-white/10 focus:border-[#C8502A]/60 text-white placeholder-gray-600 rounded-xl px-5 py-4 text-lg outline-none transition-colors"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleNameNext}
                className="w-full bg-[#C8502A] hover:bg-[#b04523] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#C8502A]/20"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Daily Goal */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">⏱️</div>
              <h1 className="text-3xl font-extrabold text-white mb-2">
                Hi, {displayName}!
              </h1>
              <p className="text-gray-400">How many hours can you dedicate to learning each day? We'll build your perfect course pace.</p>
            </div>

            <div className="space-y-3 mb-6">
              {HOUR_OPTIONS.map(opt => (
                <button
                  key={opt.minutes}
                  onClick={() => { setSelectedMinutes(opt.minutes); setError("") }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    selectedMinutes === opt.minutes
                      ? `bg-gradient-to-r ${opt.color} ${opt.border} border shadow-lg`
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{opt.label}</span>
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400">{opt.title}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5 truncate">{opt.description}</p>
                  </div>
                  {selectedMinutes === opt.minutes && (
                    <CheckCircle className="w-5 h-5 text-[#C8502A] shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={handleFinish}
              disabled={!selectedMinutes || saving}
              className="w-full bg-[#C8502A] hover:bg-[#b04523] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#C8502A]/20"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><Zap className="w-5 h-5" /> Build My Learning Plan</>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-extrabold text-white mb-3">You're all set, {displayName}!</h1>
            <p className="text-gray-400 mb-8">
              Your plan: <span className="text-white font-semibold">{selectedOption?.label}</span> as a{" "}
              <span className="text-[#C8502A] font-semibold">{selectedOption?.title}</span>.
              Upload your first book and we'll build a tailored course for you.
            </p>

            <div className="flex justify-center gap-6">
              {[
                { icon: <Flame className="w-6 h-6 text-orange-400" />, label: "Streak Tracker" },
                { icon: <Zap className="w-6 h-6 text-yellow-400" />, label: "XP & Levels" },
                { icon: <Trophy className="w-6 h-6 text-amber-400" />, label: "Leaderboard" },
              ].map(f => (
                <div key={f.label} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    {f.icon}
                  </div>
                  <span className="text-xs text-gray-500">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Taking you to your library…
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
