"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { BookOpen, MessageSquare, Brain, LogOut, LayoutDashboard } from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Library", icon: LayoutDashboard },
  { href: "/tutor", label: "AI Tutor", icon: MessageSquare },
  { href: "/quiz", label: "Quiz", icon: Brain },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#0E0C09] flex">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-white/10 shrink-0">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C8502A]" />
            <span className="text-white font-bold tracking-tight text-lg">BookWise AI</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#C8502A] text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
