"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import {
  BookOpen, MessageSquare, Brain, LogOut,
  LayoutDashboard, Trophy, Flame, Zap, Award,
  Sparkles, ChevronRight
} from "lucide-react"

const NAV = [
  { href: "/dashboard",    label: "Library",      icon: LayoutDashboard, emoji: "📚" },
  { href: "/tutor",        label: "AI Tutor",     icon: MessageSquare,   emoji: "🤖" },
  { href: "/quiz",         label: "Quiz",         icon: Brain,           emoji: "🎯" },
  { href: "/leaderboard",  label: "Leaderboard",  icon: Trophy,          emoji: "🏆" },
  { href: "/certificates", label: "Certificates", icon: Award,           emoji: "🎓" },
]

const LEVEL_NAMES  = ["", "Spark", "Apprentice", "Scholar", "Analyst", "Sage", "Expert", "Master", "Virtuoso", "Grand Master", "Legend"]
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1600, 2500, 4000, 6000, 9000, Infinity]

function getLevel(xp: number) {
  for (let i = XP_THRESHOLDS.length - 2; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function getXpProgress(xp: number, level: number) {
  const start = XP_THRESHOLDS[level - 1]
  const end   = XP_THRESHOLDS[level]
  if (end === Infinity) return 100
  return Math.round(((xp - start) / (end - start)) * 100)
}

function getLevelColor(level: number) {
  const colors = ["","#9BA3BE","#CBD5E1","#60A5FA","#818CF8","#A78BFA","#C084FC","#F5A623","#FB923C","#FBBF24","#FDE68A"]
  return colors[level] ?? "#F5A623"
}

interface Profile {
  display_name: string
  total_learning_minutes: number
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createBrowserClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("profiles")
        .select("display_name, total_learning_minutes")
        .eq("id", user.id)
        .single()
      setProfile(data
        ? (data as Profile)
        : { display_name: "Scholar", total_learning_minutes: 0 }
      )
    }
    loadProfile()
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const xp          = profile?.total_learning_minutes ?? 0
  const level       = getLevel(xp)
  const xpProgress  = getXpProgress(xp, level)
  const levelName   = LEVEL_NAMES[level]
  const levelColor  = getLevelColor(level)
  const displayName = profile?.display_name ?? "Scholar"
  const initials    = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex" style={{ background: "#0D0F14" }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="w-60 flex flex-col shrink-0 relative"
        style={{
          background: "#13161E",
          borderRight: "1px solid #2A2F42",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #F5A623, #FF6B35)", boxShadow: "0 0 16px rgba(245,166,35,0.4)" }}
          >
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight leading-none">BookWise</span>
            <span
              className="text-xs font-semibold ml-1"
              style={{ color: "#F5A623", background: "#3D2E10", padding: "1px 5px", borderRadius: 4 }}
            >AI</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#2A2F42", margin: "0 20px 8px" }} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                style={{
                  background:  active ? "rgba(245,166,35,0.12)" : "transparent",
                  color:       active ? "#F5A623" : "#9BA3BE",
                  borderLeft:  active ? "2px solid #F5A623" : "2px solid transparent",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"
                    ;(e.currentTarget as HTMLElement).style.color = "#F0F2F8"
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent"
                    ;(e.currentTarget as HTMLElement).style.color = "#9BA3BE"
                  }
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* XP / Level card */}
        {profile && (
          <div
            className="mx-3 mb-3 p-4 rounded-2xl space-y-3"
            style={{ background: "#1C2030", border: "1px solid #2A2F42" }}
          >
            {/* Streak + XP row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" style={{ color: "#FF6B35" }} />
                <span className="text-xs font-semibold" style={{ color: "#FF6B35" }}>
                  1 day streak
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" style={{ color: "#F5A623" }} />
                <span className="text-xs font-bold" style={{ color: "#F5A623" }}>
                  {xp} XP
                </span>
              </div>
            </div>

            {/* Level progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" style={{ color: levelColor }} />
                  <span className="text-xs font-bold" style={{ color: levelColor }}>
                    Lv.{level} {levelName}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "#5C6480" }}>{xpProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#252A3A" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpProgress}%`,
                    background: `linear-gradient(90deg, ${levelColor}, #F5A623)`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* User + Sign out */}
        <div className="px-3 pb-4">
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2A2F42" }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #7C6FE0, #9485F0)", color: "#fff" }}
            >
              {initials}
            </div>
            <span className="text-xs font-medium flex-1 truncate" style={{ color: "#9BA3BE" }}>
              {displayName}
            </span>
            <button
              onClick={handleSignOut}
              className="transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: "#5C6480" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <main className="flex-1 overflow-auto animate-fade-up">
        {children}
      </main>
    </div>
  )
}
